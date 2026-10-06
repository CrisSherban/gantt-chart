/**
 * Main Application Controller for Research Gantt Chart
 */
import { PRESETS } from './presets.js';
import { GanttChart } from './gantt.js';
import { saveState, loadInitialState, exportJSONFile, importJSONFile, exportCSVFile, importCSVText } from './storage.js';
import { exportSVG, exportPDF, exportPNG } from './export.js';

class App {
  constructor() {
    this.state = loadInitialState();
    this.chartContainer = document.getElementById('gantt-chart-container');
    this.scrollViewport = document.getElementById('gantt-scroll-viewport');
    
    // Undo / Redo history stacks
    this.history = [];
    this.redoStack = [];
    this.maxHistory = 50;
    this.preDragState = null;

    this.gantt = new GanttChart(this.chartContainer, {
      onTaskChange: (item) => this.handleTaskChanged(item),
      onTaskSelect: (id) => this.openEditModal(id),
      onTitleClick: () => this.openTitleModal(),
      onDragStart: () => {
        this.preDragState = JSON.stringify(this.state);
      },
      onDragEnd: () => {
        if (this.preDragState && this.preDragState !== JSON.stringify(this.state)) {
          this.history.push(this.preDragState);
          if (this.history.length > this.maxHistory) {
            this.history.shift();
          }
          this.redoStack = [];
          this.updateUndoRedoButtons();
          saveState(this.state);
        }
        this.preDragState = null;
      }
    });

    this.currentEditingId = null;
    this.currentEditingWpId = null;
    this.activeFilterWp = 'all';
    this.searchQuery = '';

    this.initDOM();
    this.bindEvents();
    this.renderAll();
    this.updateUndoRedoButtons();
  }

  pushHistory() {
    const snapshot = JSON.stringify(this.state);
    if (this.history.length === 0 || this.history[this.history.length - 1] !== snapshot) {
      this.history.push(snapshot);
      if (this.history.length > this.maxHistory) {
        this.history.shift();
      }
    }
    this.redoStack = [];
    this.updateUndoRedoButtons();
  }

  undo() {
    if (this.history.length === 0) return;
    const currentSnapshot = JSON.stringify(this.state);
    this.redoStack.push(currentSnapshot);

    const prevSnapshot = this.history.pop();
    this.state = JSON.parse(prevSnapshot);
    saveState(this.state);
    this.renderAll();
    this.updateUndoRedoButtons();
  }

  redo() {
    if (this.redoStack.length === 0) return;
    const currentSnapshot = JSON.stringify(this.state);
    this.history.push(currentSnapshot);

    const nextSnapshot = this.redoStack.pop();
    this.state = JSON.parse(nextSnapshot);
    saveState(this.state);
    this.renderAll();
    this.updateUndoRedoButtons();
  }

  updateUndoRedoButtons() {
    const undoBtn = document.getElementById('btn-undo');
    const redoBtn = document.getElementById('btn-redo');
    if (undoBtn) {
      undoBtn.disabled = (this.history.length === 0);
      undoBtn.style.opacity = (this.history.length === 0) ? '0.35' : '1';
      undoBtn.style.cursor = (this.history.length === 0) ? 'default' : 'pointer';
    }
    if (redoBtn) {
      redoBtn.disabled = (this.redoStack.length === 0);
      redoBtn.style.opacity = (this.redoStack.length === 0) ? '0.35' : '1';
      redoBtn.style.cursor = (this.redoStack.length === 0) ? 'default' : 'pointer';
    }
  }

  initDOM() {
    // Dropdown toggle handling
    document.querySelectorAll('.dropdown-wrap').forEach(wrap => {
      const btn = wrap.querySelector('.dropdown-toggle');
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const isActive = wrap.classList.contains('active');
          document.querySelectorAll('.dropdown-wrap').forEach(w => w.classList.remove('active'));
          if (!isActive) wrap.classList.add('active');
        });
      }
    });

    window.addEventListener('click', () => {
      document.querySelectorAll('.dropdown-wrap').forEach(w => w.classList.remove('active'));
    });
  }

  bindEvents() {
    // Undo / Redo toolbar buttons
    document.getElementById('btn-undo')?.addEventListener('click', () => this.undo());
    document.getElementById('btn-redo')?.addEventListener('click', () => this.redo());

    // Keyboard shortcuts for Undo (Ctrl+Z / Cmd+Z) and Redo (Ctrl+Y / Cmd+Shift+Z)
    window.addEventListener('keydown', (e) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        if (!isInput) {
          if (e.shiftKey) {
            e.preventDefault();
            this.redo();
          } else {
            e.preventDefault();
            this.undo();
          }
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        if (!isInput) {
          e.preventDefault();
          this.redo();
        }
      }
    });

    // Preset selector
    const presetSelect = document.getElementById('preset-select');
    if (presetSelect) {
      presetSelect.addEventListener('change', (e) => {
        const key = e.target.value;
        if (PRESETS[key]) {
          if (confirm('Load this template? Current unsaved custom work will be replaced.')) {
            this.pushHistory();
            this.state = JSON.parse(JSON.stringify(PRESETS[key]));
            this.saveAndRender();
          }
        }
      });
    }

    // Sidebar tab buttons
    document.querySelectorAll('.sidebar-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.sidebar-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

        tab.classList.add('active');
        const targetId = tab.getAttribute('data-tab');
        const pane = document.getElementById(targetId);
        if (pane) pane.classList.add('active');
      });
    });

    // Sidebar toggle collapse
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    const sidebar = document.getElementById('app-sidebar');
    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
      });
    }

    // Horizontal Scroll Buttons
    document.getElementById('btn-scroll-left')?.addEventListener('click', () => {
      if (this.scrollViewport) {
        this.scrollViewport.scrollBy({ left: -260, behavior: 'smooth' });
      }
    });

    document.getElementById('btn-scroll-right')?.addEventListener('click', () => {
      if (this.scrollViewport) {
        this.scrollViewport.scrollBy({ left: 260, behavior: 'smooth' });
      }
    });

    // Search and filter tasks
    const searchInput = document.getElementById('task-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase();
        this.renderTaskList();
      });
    }

    const filterWp = document.getElementById('task-wp-filter');
    if (filterWp) {
      filterWp.addEventListener('change', (e) => {
        this.activeFilterWp = e.target.value;
        this.renderTaskList();
      });
    }

    // Add buttons
    document.getElementById('btn-add-task')?.addEventListener('click', () => this.openCreateModal('task'));
    document.getElementById('btn-add-milestone')?.addEventListener('click', () => this.openCreateModal('milestone'));
    document.getElementById('btn-add-deliverable')?.addEventListener('click', () => this.openCreateModal('deliverable'));
    document.getElementById('btn-add-wp')?.addEventListener('click', () => this.openWpModal());

    // Zoom buttons
    document.getElementById('btn-zoom-in')?.addEventListener('click', () => {
      this.state.meta.monthWidth = Math.min(100, (this.state.meta.monthWidth || 44) + 6);
      this.saveAndRender();
    });
    document.getElementById('btn-zoom-out')?.addEventListener('click', () => {
      this.state.meta.monthWidth = Math.max(26, (this.state.meta.monthWidth || 44) - 6);
      this.saveAndRender();
    });

    // Exports
    document.getElementById('btn-export-svg')?.addEventListener('click', () => {
      const svg = document.getElementById('gantt-svg-root');
      const filename = (this.state.meta.title || 'gantt-chart').toLowerCase().replace(/[^a-z0-9]/g, '-');
      exportSVG(svg, `${filename}.svg`);
    });

    document.getElementById('btn-export-pdf')?.addEventListener('click', () => {
      const svg = document.getElementById('gantt-svg-root');
      const filename = (this.state.meta.title || 'gantt-chart').toLowerCase().replace(/[^a-z0-9]/g, '-');
      exportPDF(svg, `${filename}.pdf`);
    });

    document.getElementById('btn-export-png')?.addEventListener('click', () => {
      const svg = document.getElementById('gantt-svg-root');
      const filename = (this.state.meta.title || 'gantt-chart').toLowerCase().replace(/[^a-z0-9]/g, '-');
      exportPNG(svg, `${filename}.png`, 2.5);
    });

    document.getElementById('btn-print')?.addEventListener('click', () => {
      window.print();
    });

    // JSON import/export
    document.getElementById('btn-export-json')?.addEventListener('click', () => {
      const filename = (this.state.meta.title || 'gantt-chart').toLowerCase().replace(/[^a-z0-9]/g, '-') + '.json';
      exportJSONFile(this.state, filename);
    });

    const fileInput = document.getElementById('json-file-input');
    document.getElementById('btn-import-json')?.addEventListener('click', () => fileInput?.click());
    fileInput?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (file) {
        try {
          this.pushHistory();
          this.state = await importJSONFile(file);
          this.saveAndRender();
          alert('Project imported successfully!');
        } catch (err) {
          alert('Failed to import JSON: ' + err.message);
        }
        e.target.value = '';
      }
    });

    // CSV import/export
    document.getElementById('btn-export-csv')?.addEventListener('click', () => {
      const filename = (this.state.meta.title || 'gantt-tasks').toLowerCase().replace(/[^a-z0-9]/g, '-') + '.csv';
      exportCSVFile(this.state, filename);
    });

    const csvFileInput = document.getElementById('csv-file-input');
    document.getElementById('btn-import-csv')?.addEventListener('click', () => csvFileInput?.click());
    csvFileInput?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (re) => {
          try {
            this.pushHistory();
            this.state = importCSVText(re.target.result, this.state);
            this.saveAndRender();
            alert('CSV imported successfully!');
          } catch (err) {
            alert('Failed to import CSV: ' + err.message);
          }
        };
        reader.readAsText(file);
        e.target.value = '';
      }
    });

    // Theme selector
    document.getElementById('theme-select')?.addEventListener('change', (e) => {
      this.pushHistory();
      this.state.meta.theme = e.target.value;
      this.saveAndRender();
    });

    // Direct Title Inputs (Top of Sidebar)
    const sidebarTitle = document.getElementById('sidebar-input-title');
    sidebarTitle?.addEventListener('focus', () => {
      this.pushHistory();
    });
    sidebarTitle?.addEventListener('input', (e) => {
      this.state.meta.title = e.target.value;
      this.updateTitleInSVG();
      saveState(this.state);
      this.syncTitleInputs();
    });

    const sidebarSubtitle = document.getElementById('sidebar-input-subtitle');
    sidebarSubtitle?.addEventListener('focus', () => {
      this.pushHistory();
    });
    sidebarSubtitle?.addEventListener('input', (e) => {
      this.state.meta.subtitle = e.target.value;
      this.updateTitleInSVG();
      saveState(this.state);
      this.syncTitleInputs();
    });

    document.getElementById('btn-quick-edit-title')?.addEventListener('click', () => {
      this.openTitleModal();
    });

    // Settings tab form inputs
    const projectTitleInput = document.getElementById('input-project-title');
    projectTitleInput?.addEventListener('focus', () => {
      this.pushHistory();
    });
    projectTitleInput?.addEventListener('input', (e) => {
      this.state.meta.title = e.target.value;
      this.updateTitleInSVG();
      saveState(this.state);
      this.syncTitleInputs();
    });

    const projectSubtitleInput = document.getElementById('input-project-subtitle');
    projectSubtitleInput?.addEventListener('focus', () => {
      this.pushHistory();
    });
    projectSubtitleInput?.addEventListener('input', (e) => {
      this.state.meta.subtitle = e.target.value;
      this.updateTitleInSVG();
      saveState(this.state);
      this.syncTitleInputs();
    });

    const timeModeSelect = document.getElementById('select-time-mode');
    timeModeSelect?.addEventListener('change', (e) => {
      this.pushHistory();
      this.state.meta.timeMode = e.target.value;
      this.saveAndRender();
    });

    const startDateInput = document.getElementById('input-start-date');
    startDateInput?.addEventListener('change', (e) => {
      this.pushHistory();
      this.state.meta.startDate = e.target.value;
      this.saveAndRender();
    });

    const totalMonthsInput = document.getElementById('input-total-months');
    totalMonthsInput?.addEventListener('change', (e) => {
      this.pushHistory();
      this.state.meta.totalMonths = Math.max(1, parseInt(e.target.value, 10) || 36);
      this.saveAndRender();
    });

    const toggleProgress = document.getElementById('toggle-show-progress');
    toggleProgress?.addEventListener('change', (e) => {
      this.pushHistory();
      this.state.meta.showProgress = e.target.checked;
      this.saveAndRender();
    });

    // Modals
    this.bindModalEvents();
    this.bindTitleModalEvents();
  }

  updateTitleInSVG() {
    const titleEl = document.getElementById('gantt-svg-title');
    const subtitleEl = document.getElementById('gantt-svg-subtitle');
    if (titleEl) {
      titleEl.textContent = this.state.meta.title || 'Click to set project title';
    }
    if (subtitleEl) {
      subtitleEl.textContent = this.state.meta.subtitle || 'Click to add grant agreement # or subtitle';
    }
    document.title = (this.state.meta.title ? `${this.state.meta.title} — ` : '') + 'Research Gantt';
  }

  syncTitleInputs() {
    const sTitle = document.getElementById('sidebar-input-title');
    const sSub = document.getElementById('sidebar-input-subtitle');
    const mTitle = document.getElementById('input-project-title');
    const mSub = document.getElementById('input-project-subtitle');

    if (sTitle && sTitle.value !== (this.state.meta.title || '')) sTitle.value = this.state.meta.title || '';
    if (sSub && sSub.value !== (this.state.meta.subtitle || '')) sSub.value = this.state.meta.subtitle || '';
    if (mTitle && mTitle.value !== (this.state.meta.title || '')) mTitle.value = this.state.meta.title || '';
    if (mSub && mSub.value !== (this.state.meta.subtitle || '')) mSub.value = this.state.meta.subtitle || '';
  }

  bindTitleModalEvents() {
    const modal = document.getElementById('title-modal');
    const closeBtn = document.getElementById('title-modal-close-btn');
    const cancelBtn = document.getElementById('title-modal-cancel-btn');
    const saveBtn = document.getElementById('title-modal-save-btn');

    closeBtn?.addEventListener('click', () => modal.classList.remove('active'));
    cancelBtn?.addEventListener('click', () => modal.classList.remove('active'));

    saveBtn?.addEventListener('click', () => {
      this.pushHistory();
      const newTitle = document.getElementById('modal-input-title').value.trim();
      const newSubtitle = document.getElementById('modal-input-subtitle').value.trim();
      const newStart = document.getElementById('modal-input-start-date').value;
      const newDuration = parseInt(document.getElementById('modal-input-total-months').value, 10);

      this.state.meta.title = newTitle;
      this.state.meta.subtitle = newSubtitle;
      if (newStart) this.state.meta.startDate = newStart;
      if (newDuration && newDuration > 0) this.state.meta.totalMonths = newDuration;

      modal.classList.remove('active');
      this.saveAndRender();
    });
  }

  openTitleModal() {
    const modal = document.getElementById('title-modal');
    document.getElementById('modal-input-title').value = this.state.meta.title || '';
    document.getElementById('modal-input-subtitle').value = this.state.meta.subtitle || '';
    document.getElementById('modal-input-start-date').value = this.state.meta.startDate || '2026-01-01';
    document.getElementById('modal-input-total-months').value = this.state.meta.totalMonths || 36;
    modal.classList.add('active');
    setTimeout(() => document.getElementById('modal-input-title')?.focus(), 50);
  }

  bindModalEvents() {
    const modal = document.getElementById('item-modal');
    const closeBtn = document.getElementById('modal-close-btn');
    const cancelBtn = document.getElementById('modal-cancel-btn');
    const saveBtn = document.getElementById('modal-save-btn');
    const deleteBtn = document.getElementById('modal-delete-btn');

    closeBtn?.addEventListener('click', () => this.closeItemModal());
    cancelBtn?.addEventListener('click', () => this.closeItemModal());

    deleteBtn?.addEventListener('click', () => {
      if (this.currentEditingId) {
        if (confirm('Are you sure you want to delete this item?')) {
          this.pushHistory();
          this.state.items = this.state.items.filter(it => it.id !== this.currentEditingId);
          this.closeItemModal();
          this.saveAndRender();
        }
      }
    });

    saveBtn?.addEventListener('click', () => this.saveItemFromModal());

    // Type pills in modal
    document.querySelectorAll('#modal-type-selector .pill-option').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('#modal-type-selector .pill-option').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const type = pill.getAttribute('data-type');
        this.updateModalFieldsForType(type);
      });
    });

    // Start month & End month bounds sync
    const startMInput = document.getElementById('modal-start-month');
    const endMInput = document.getElementById('modal-end-month');
    startMInput?.addEventListener('input', () => {
      const type = document.querySelector('#modal-type-selector .pill-option.active')?.getAttribute('data-type');
      if (type === 'milestone' || type === 'deliverable') {
        endMInput.value = startMInput.value;
      } else if (parseInt(endMInput.value, 10) < parseInt(startMInput.value, 10)) {
        endMInput.value = startMInput.value;
      }
    });

    // Progress slider sync
    const progSlider = document.getElementById('modal-progress');
    const progNum = document.getElementById('modal-progress-num');
    progSlider?.addEventListener('input', () => {
      progNum.value = progSlider.value;
    });
    progNum?.addEventListener('input', () => {
      progSlider.value = progNum.value;
    });

    // WP Modal Events
    document.getElementById('wp-modal-close-btn')?.addEventListener('click', () => this.closeWpModal());
    document.getElementById('wp-modal-cancel-btn')?.addEventListener('click', () => this.closeWpModal());
    document.getElementById('wp-modal-save-btn')?.addEventListener('click', () => this.saveWpFromModal());
    document.getElementById('wp-modal-delete-btn')?.addEventListener('click', () => this.deleteWpFromModal());
  }

  updateModalFieldsForType(type) {
    const endRow = document.getElementById('modal-end-month-row');
    const progRow = document.getElementById('modal-progress-row');
    const startLabel = document.getElementById('modal-start-label');

    if (type === 'milestone' || type === 'deliverable') {
      if (endRow) endRow.style.display = 'none';
      if (progRow) progRow.style.display = 'none';
      if (startLabel) startLabel.textContent = 'Month due';
    } else {
      if (endRow) endRow.style.display = 'block';
      if (progRow) progRow.style.display = 'block';
      if (startLabel) startLabel.textContent = 'Start Month';
    }
  }

  saveAndRender() {
    saveState(this.state);
    this.renderAll();
  }

  renderAll() {
    this.gantt.render(this.state);
    this.renderSettings();
    this.syncTitleInputs();
    this.renderWorkPackages();
    this.renderTaskList();
    this.renderToolbarStats();
    this.updateTitleInSVG();
    this.updateUndoRedoButtons();
  }

  renderSettings() {
    const meta = this.state.meta;
    const timeModeSelect = document.getElementById('select-time-mode');
    if (timeModeSelect) timeModeSelect.value = meta.timeMode || 'project_months';

    const startDateInput = document.getElementById('input-start-date');
    if (startDateInput) startDateInput.value = meta.startDate || '2026-01-01';

    const totalMonthsInput = document.getElementById('input-total-months');
    if (totalMonthsInput) totalMonthsInput.value = meta.totalMonths || 36;

    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) themeSelect.value = meta.theme || 'academic';

    const toggleProgress = document.getElementById('toggle-show-progress');
    if (toggleProgress) toggleProgress.checked = !!meta.showProgress;
  }

  renderWorkPackages() {
    const container = document.getElementById('wp-list-container');
    if (!container) return;

    const wpFilter = document.getElementById('task-wp-filter');
    const modalWpSelect = document.getElementById('modal-wp-select');

    let filterHtml = '<option value="all">All Work Packages</option>';
    let modalWpHtml = '';

    let html = '';
    this.state.workPackages.forEach((wp) => {
      const count = this.state.items.filter(it => it.wpId === wp.id).length;
      html += `
        <div class="wp-card" data-id="${wp.id}">
          <div class="wp-info">
            <span class="wp-color-dot" style="background-color: ${wp.color};"></span>
            <div>
              <div class="wp-name">${this.escapeHTML(wp.code)}: ${this.escapeHTML(wp.name)}</div>
              <div class="wp-code">${count} tasks/milestones</div>
            </div>
          </div>
          <div style="display: flex; gap: 4px;">
            <button class="btn btn-sm btn-icon" title="Edit Work Package" onclick="window.ganttApp.openWpModal('${wp.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            </button>
          </div>
        </div>
      `;

      filterHtml += `<option value="${wp.id}">${this.escapeHTML(wp.code)}: ${this.escapeHTML(wp.name)}</option>`;
      modalWpHtml += `<option value="${wp.id}">${this.escapeHTML(wp.code)}: ${this.escapeHTML(wp.name)}</option>`;
    });

    container.innerHTML = html;

    if (wpFilter) {
      const prevVal = this.activeFilterWp;
      wpFilter.innerHTML = filterHtml;
      wpFilter.value = prevVal;
    }

    if (modalWpSelect) {
      modalWpSelect.innerHTML = modalWpHtml;
    }
  }

  renderTaskList() {
    const container = document.getElementById('task-items-list');
    if (!container) return;

    const wpMap = new Map(this.state.workPackages.map(wp => [wp.id, wp]));

    let filtered = this.state.items.filter(item => {
      if (this.activeFilterWp !== 'all' && item.wpId !== this.activeFilterWp) return false;
      if (this.searchQuery) {
        const str = `${item.code} ${item.title} ${item.lead} ${item.notes}`.toLowerCase();
        if (!str.includes(this.searchQuery)) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 13px; padding: 24px 0;">No items found</div>`;
      return;
    }

    let html = '';
    filtered.forEach(item => {
      const wp = wpMap.get(item.wpId);
      const isMilestone = item.type === 'milestone';
      const isDeliverable = item.type === 'deliverable';
      const badgeClass = isMilestone ? 'badge-milestone' : (isDeliverable ? 'badge-deliverable' : 'badge-task');
      const badgeLabel = item.code || (isMilestone ? 'MS' : (isDeliverable ? 'DEL' : 'Task'));

      html += `
        <div class="task-card ${this.currentEditingId === item.id ? 'active' : ''}" data-id="${item.id}" onclick="window.ganttApp.openEditModal('${item.id}')">
          <div class="task-card-header">
            <div class="task-badges">
              <span class="badge ${badgeClass}">${this.escapeHTML(badgeLabel)}</span>
              ${wp ? `<span style="font-size: 11px; font-weight: 600; color: ${wp.color};">${this.escapeHTML(wp.code)}</span>` : ''}
            </div>
            <div class="task-card-actions" onclick="event.stopPropagation();">
              <button class="btn btn-sm btn-icon" title="Edit" onclick="window.ganttApp.openEditModal('${item.id}')">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
              </button>
            </div>
          </div>
          <div class="task-card-title">${this.escapeHTML(item.title)}</div>
          <div class="task-card-footer">
            <span>M${item.startMonth}${item.endMonth !== item.startMonth ? `–M${item.endMonth}` : ''}</span>
            ${!isMilestone && !isDeliverable ? `
              <span class="progress-pill">
                <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:${item.progress === 100 ? '#10b981' : '#2563eb'};"></span>
                ${item.progress ?? 0}%
              </span>
            ` : ''}
            ${item.lead ? `<span>${this.escapeHTML(item.lead)}</span>` : ''}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  renderToolbarStats() {
    const totalWps = this.state.workPackages.length;
    const totalTasks = this.state.items.filter(i => i.type === 'task' || !i.type).length;
    const totalMilestones = this.state.items.filter(i => i.type === 'milestone').length;
    const totalDeliverables = this.state.items.filter(i => i.type === 'deliverable').length;

    let totalProgressSum = 0;
    let taskCount = 0;
    this.state.items.forEach(it => {
      if (it.type === 'task' || !it.type) {
        totalProgressSum += (it.progress || 0);
        taskCount++;
      }
    });
    const avgProgress = taskCount > 0 ? Math.round(totalProgressSum / taskCount) : 0;

    const el = document.getElementById('toolbar-stats');
    if (el) {
      el.innerHTML = `
        <div class="stat-item"><span class="stat-dot"></span> <strong>${totalWps}</strong> Work Packages</div>
        <div class="stat-item"><span class="stat-dot"></span> <strong>${totalTasks}</strong> Tasks</div>
        <div class="stat-item"><span class="stat-dot" style="background:#f59e0b;"></span> <strong>${totalMilestones}</strong> Milestones</div>
        <div class="stat-item"><span class="stat-dot" style="background:#8b5cf6;"></span> <strong>${totalDeliverables}</strong> Deliverables</div>
        <div class="stat-item"><span class="stat-dot" style="background:#10b981;"></span> <strong>${avgProgress}%</strong> Complete</div>
      `;
    }
  }

  handleTaskChanged(updatedItem) {
    if (updatedItem) {
      const idx = this.state.items.findIndex(i => i.id === updatedItem.id);
      if (idx !== -1) {
        this.state.items[idx] = updatedItem;
      }
    }
    saveState(this.state);
    this.renderTaskList();
    this.renderToolbarStats();
  }

  openCreateModal(type = 'task') {
    this.currentEditingId = null;
    const modal = document.getElementById('item-modal');
    const titleEl = document.getElementById('item-modal-title');
    const deleteBtn = document.getElementById('modal-delete-btn');

    if (titleEl) titleEl.textContent = type === 'milestone' ? 'Add Milestone' : (type === 'deliverable' ? 'Add Deliverable' : 'Add Task');
    if (deleteBtn) deleteBtn.style.display = 'none';

    document.querySelectorAll('#modal-type-selector .pill-option').forEach(p => {
      p.classList.toggle('active', p.getAttribute('data-type') === type);
    });

    const firstWp = this.state.workPackages[0];
    document.getElementById('modal-wp-select').value = firstWp ? firstWp.id : '';
    document.getElementById('modal-item-code').value = '';
    document.getElementById('modal-item-title').value = '';
    document.getElementById('modal-start-month').value = '1';
    document.getElementById('modal-end-month').value = type === 'milestone' || type === 'deliverable' ? '1' : '6';
    document.getElementById('modal-progress').value = '0';
    document.getElementById('modal-progress-num').value = '0';
    document.getElementById('modal-lead').value = '';
    document.getElementById('modal-notes').value = '';

    this.updateModalFieldsForType(type);
    modal.classList.add('active');
  }

  openEditModal(id) {
    const item = this.state.items.find(i => i.id === id);
    if (!item) return;

    this.currentEditingId = id;
    const modal = document.getElementById('item-modal');
    const titleEl = document.getElementById('item-modal-title');
    const deleteBtn = document.getElementById('modal-delete-btn');

    const type = item.type || 'task';
    if (titleEl) titleEl.textContent = 'Edit Item Details';
    if (deleteBtn) deleteBtn.style.display = 'inline-flex';

    document.querySelectorAll('#modal-type-selector .pill-option').forEach(p => {
      p.classList.toggle('active', p.getAttribute('data-type') === type);
    });

    document.getElementById('modal-wp-select').value = item.wpId;
    document.getElementById('modal-item-code').value = item.code || '';
    document.getElementById('modal-item-title').value = item.title || '';
    document.getElementById('modal-start-month').value = item.startMonth || 1;
    document.getElementById('modal-end-month').value = item.endMonth || item.startMonth || 1;
    document.getElementById('modal-progress').value = item.progress ?? 0;
    document.getElementById('modal-progress-num').value = item.progress ?? 0;
    document.getElementById('modal-lead').value = item.lead || '';
    document.getElementById('modal-notes').value = item.notes || '';

    this.updateModalFieldsForType(type);
    modal.classList.add('active');
  }

  closeItemModal() {
    document.getElementById('item-modal')?.classList.remove('active');
    this.currentEditingId = null;
  }

  saveItemFromModal() {
    const title = document.getElementById('modal-item-title').value.trim();
    if (!title) {
      alert('Please enter a task or milestone title');
      return;
    }

    this.pushHistory();

    const type = document.querySelector('#modal-type-selector .pill-option.active')?.getAttribute('data-type') || 'task';
    const wpId = document.getElementById('modal-wp-select').value;
    const code = document.getElementById('modal-item-code').value.trim();
    const startM = Math.max(1, parseInt(document.getElementById('modal-start-month').value, 10) || 1);
    let endM = Math.max(startM, parseInt(document.getElementById('modal-end-month').value, 10) || startM);
    if (type === 'milestone' || type === 'deliverable') {
      endM = startM;
    }
    const progress = Math.min(100, Math.max(0, parseInt(document.getElementById('modal-progress-num').value, 10) || 0));
    const lead = document.getElementById('modal-lead').value.trim();
    const notes = document.getElementById('modal-notes').value.trim();

    if (endM > (this.state.meta.totalMonths || 36)) {
      this.state.meta.totalMonths = endM;
    }

    if (this.currentEditingId) {
      const item = this.state.items.find(i => i.id === this.currentEditingId);
      if (item) {
        item.wpId = wpId;
        item.type = type;
        item.code = code;
        item.title = title;
        item.startMonth = startM;
        item.endMonth = endM;
        item.progress = progress;
        item.lead = lead;
        item.notes = notes;
      }
    } else {
      const newItem = {
        id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        wpId,
        type,
        code,
        title,
        startMonth: startM,
        endMonth: endM,
        progress,
        lead,
        notes
      };
      this.state.items.push(newItem);
    }

    this.closeItemModal();
    this.saveAndRender();
  }

  // Work Package Modal
  openWpModal(wpId = null) {
    this.currentEditingWpId = wpId;
    const modal = document.getElementById('wp-modal');
    const titleEl = document.getElementById('wp-modal-title');
    const deleteBtn = document.getElementById('wp-modal-delete-btn');

    if (wpId) {
      const wp = this.state.workPackages.find(w => w.id === wpId);
      if (!wp) return;
      if (titleEl) titleEl.textContent = 'Edit Work Package';
      if (deleteBtn) deleteBtn.style.display = 'inline-flex';
      document.getElementById('wp-input-code').value = wp.code;
      document.getElementById('wp-input-name').value = wp.name;
      document.getElementById('wp-input-color').value = wp.color;
    } else {
      if (titleEl) titleEl.textContent = 'Add Work Package';
      if (deleteBtn) deleteBtn.style.display = 'none';
      const nextNum = this.state.workPackages.length + 1;
      document.getElementById('wp-input-code').value = `WP${nextNum}`;
      document.getElementById('wp-input-name').value = '';
      const defaultColors = ['#2563eb', '#0d9488', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];
      document.getElementById('wp-input-color').value = defaultColors[(nextNum - 1) % defaultColors.length];
    }

    modal.classList.add('active');
  }

  closeWpModal() {
    document.getElementById('wp-modal')?.classList.remove('active');
    this.currentEditingWpId = null;
  }

  saveWpFromModal() {
    const code = document.getElementById('wp-input-code').value.trim();
    const name = document.getElementById('wp-input-name').value.trim();
    const color = document.getElementById('wp-input-color').value;

    if (!code || !name) {
      alert('Please fill in both Work Package Code and Name.');
      return;
    }

    this.pushHistory();

    if (this.currentEditingWpId) {
      const wp = this.state.workPackages.find(w => w.id === this.currentEditingWpId);
      if (wp) {
        wp.code = code;
        wp.name = name;
        wp.color = color;
      }
    } else {
      const newWp = {
        id: 'wp_' + Date.now(),
        code,
        name,
        color
      };
      this.state.workPackages.push(newWp);
    }

    this.closeWpModal();
    this.saveAndRender();
  }

  deleteWpFromModal() {
    if (!this.currentEditingWpId) return;
    const hasItems = this.state.items.some(i => i.wpId === this.currentEditingWpId);
    if (hasItems) {
      alert('Cannot delete this Work Package because it contains tasks. Please reassign or delete its tasks first.');
      return;
    }
    if (this.state.workPackages.length <= 1) {
      alert('Project must have at least one Work Package.');
      return;
    }
    if (confirm('Are you sure you want to delete this Work Package?')) {
      this.pushHistory();
      this.state.workPackages = this.state.workPackages.filter(w => w.id !== this.currentEditingWpId);
      this.closeWpModal();
      this.saveAndRender();
    }
  }

  escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

// Global bootstrap
window.addEventListener('DOMContentLoaded', () => {
  window.ganttApp = new App();
});
