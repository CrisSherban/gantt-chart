/**
 * Storage, JSON import/export, and CSV import/export module
 */
import { PRESETS } from './presets.js';

const STORAGE_KEY = 'gantt_chart_workspace_v1';

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Could not save to localStorage:', e);
  }
}

export function loadInitialState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.meta && parsed.items && parsed.workPackages) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not load from localStorage, falling back to preset:', e);
  }
  return JSON.parse(JSON.stringify(PRESETS.horizon_europe));
}

export function exportJSONFile(data, filename = 'project-gantt-chart.json') {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  triggerDownload(blob, filename);
}

export function importJSONFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!parsed.meta || !parsed.workPackages || !parsed.items) {
          throw new Error('Invalid Gantt Chart file format: missing meta, workPackages or items');
        }
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export function exportCSVFile(data, filename = 'gantt-tasks.csv') {
  const wpMap = new Map(data.workPackages.map(wp => [wp.id, wp]));
  
  const headers = ['WP_Code', 'WP_Name', 'Type', 'Code', 'Title', 'Start_Month', 'End_Month', 'Progress', 'Lead', 'Notes'];
  const rows = [headers.join(',')];

  data.items.forEach(item => {
    const wp = wpMap.get(item.wpId) || { code: '', name: '' };
    const row = [
      escapeCSV(wp.code),
      escapeCSV(wp.name),
      escapeCSV(item.type || 'task'),
      escapeCSV(item.code || ''),
      escapeCSV(item.title || ''),
      item.startMonth,
      item.endMonth,
      item.progress ?? 0,
      escapeCSV(item.lead || ''),
      escapeCSV(item.notes || '')
    ];
    rows.push(row.join(','));
  });

  const csvContent = rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename);
}

export function importCSVText(csvText, currentData) {
  const lines = csvText.split(/\r\n|\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) {
    throw new Error('CSV file is empty or does not contain task rows');
  }

  // Parse header
  const headerCols = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
  const wpCodeIdx = headerCols.findIndex(c => c.includes('wp_code') || c.includes('wp code') || c === 'wp');
  const wpNameIdx = headerCols.findIndex(c => c.includes('wp_name') || c.includes('wp name') || c === 'work package');
  const typeIdx = headerCols.findIndex(c => c === 'type' || c.includes('item_type'));
  const codeIdx = headerCols.findIndex(c => c === 'code' || c.includes('item_code') || c === 'task id');
  const titleIdx = headerCols.findIndex(c => c === 'title' || c.includes('item_title') || c === 'name' || c === 'task');
  const startIdx = headerCols.findIndex(c => c.includes('start') || c.includes('start_month'));
  const endIdx = headerCols.findIndex(c => c.includes('end') || c.includes('end_month'));
  const progIdx = headerCols.findIndex(c => c.includes('progress'));
  const leadIdx = headerCols.findIndex(c => c.includes('lead') || c.includes('assignee') || c.includes('owner'));
  const notesIdx = headerCols.findIndex(c => c.includes('notes') || c.includes('description'));

  if (titleIdx === -1) {
    throw new Error('CSV must contain at least a "Title" or "Task" column');
  }

  const newWps = [...currentData.workPackages];
  const wpMap = new Map();
  newWps.forEach(wp => {
    wpMap.set(wp.code.toLowerCase(), wp);
    wpMap.set(wp.name.toLowerCase(), wp);
  });

  const defaultColors = ['#2563eb', '#0d9488', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#84cc16'];
  const newItems = [];
  let maxMonth = currentData.meta.totalMonths || 36;

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (!cols || cols.length === 0 || !cols[titleIdx]) continue;

    const wpCode = wpCodeIdx !== -1 && cols[wpCodeIdx] ? cols[wpCodeIdx].trim() : 'WP1';
    const wpName = wpNameIdx !== -1 && cols[wpNameIdx] ? cols[wpNameIdx].trim() : (wpCode || 'General');

    // Find or create WP
    let wp = wpMap.get(wpCode.toLowerCase()) || wpMap.get(wpName.toLowerCase());
    if (!wp) {
      const newId = 'wp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
      wp = {
        id: newId,
        code: wpCode,
        name: wpName,
        color: defaultColors[newWps.length % defaultColors.length]
      };
      newWps.push(wp);
      wpMap.set(wpCode.toLowerCase(), wp);
      wpMap.set(wpName.toLowerCase(), wp);
    }

    const typeRaw = typeIdx !== -1 && cols[typeIdx] ? cols[typeIdx].trim().toLowerCase() : 'task';
    const type = (typeRaw.includes('milestone') || typeRaw === 'm') ? 'milestone' : 
                 (typeRaw.includes('deliverable') || typeRaw === 'd') ? 'deliverable' : 'task';

    const code = codeIdx !== -1 && cols[codeIdx] ? cols[codeIdx].trim() : '';
    const title = cols[titleIdx].trim();
    const startMonth = startIdx !== -1 && cols[startIdx] ? Math.max(1, parseInt(cols[startIdx], 10) || 1) : 1;
    const endMonth = endIdx !== -1 && cols[endIdx] ? Math.max(startMonth, parseInt(cols[endIdx], 10) || startMonth) : startMonth;
    const progress = progIdx !== -1 && cols[progIdx] ? Math.min(100, Math.max(0, parseInt(cols[progIdx], 10) || 0)) : 0;
    const lead = leadIdx !== -1 && cols[leadIdx] ? cols[leadIdx].trim() : '';
    const notes = notesIdx !== -1 && cols[notesIdx] ? cols[notesIdx].trim() : '';

    if (endMonth > maxMonth) {
      maxMonth = endMonth;
    }

    newItems.push({
      id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      wpId: wp.id,
      type,
      code,
      title,
      startMonth,
      endMonth: type === 'milestone' || type === 'deliverable' ? startMonth : endMonth,
      progress,
      lead,
      notes
    });
  }

  return {
    ...currentData,
    meta: {
      ...currentData.meta,
      totalMonths: Math.max(currentData.meta.totalMonths, maxMonth)
    },
    workPackages: newWps,
    items: newItems
  };
}

function escapeCSV(str) {
  if (str === null || str === undefined) return '""';
  const val = String(str);
  if (val.includes(',') || val.includes('"') || val.includes('\n') || val.includes('\r')) {
    return '"' + val.replace(/"/g, '""') + '"';
  }
  return `"${val}"`;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
