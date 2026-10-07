/**
 * SVG Gantt Chart Renderer with interactive drag/resize, tooltips, collapsible WPs, click-to-edit title, and themes
 */

export class GanttChart {
  constructor(container, options = {}) {
    this.container = container;
    this.data = null;
    this.onTaskChange = options.onTaskChange || (() => {});
    this.onTaskSelect = options.onTaskSelect || (() => {});
    this.onTitleClick = options.onTitleClick || (() => {});
    this.onTaskReorder = options.onTaskReorder || (() => {});
    this.onColWidthChange = options.onColWidthChange || (() => {});
    this.onAutoFitColWidth = options.onAutoFitColWidth || (() => {});
    this.onDragStart = options.onDragStart || (() => {});
    this.onDragEnd = options.onDragEnd || (() => {});
    this.tooltipEl = null;
    this.hasMoved = false;
    this.initTooltip();
  }

  initTooltip() {
    let el = document.getElementById('gantt-tooltip');
    if (!el) {
      el = document.createElement('div');
      el.id = 'gantt-tooltip';
      el.className = 'gantt-tooltip';
      document.body.appendChild(el);
    }
    this.tooltipEl = el;
  }

  parseDateParts(dateStr) {
    if (!dateStr) return { year: 2026, month: 1, day: 1 };
    const str = String(dateStr).trim();
    const parts = str.split('-');
    const year = parseInt(parts[0], 10) || 2026;
    const month = parseInt(parts[1], 10) || 1;
    const day = parseInt(parts[2], 10) || 1;
    return { year, month, day };
  }

  render(data) {
    this.data = data;
    const { meta, workPackages, items } = data;

    const leftColWidth = meta.leftColWidth || (meta.compactView ? 260 : 350);
    const monthWidth = meta.monthWidth || 44;
    const totalMonths = Math.max(1, meta.totalMonths || 36);
    const rowHeight = meta.rowHeight || 38;
    const headerHeight = 70;
    const titleBannerHeight = 68;
    const chartTimelineWidth = totalMonths * monthWidth;
    const totalWidth = leftColWidth + chartTimelineWidth + 24;

    const timeMode = meta.timeMode || 'project_months';
    const startParts = this.parseDateParts(meta.startDate);
    const startYear = startParts.year;
    const startMonth = startParts.month; // 1 to 12

    // Calculate visible rows and aggregate spans
    const visibleRows = [];
    const wpMap = new Map(workPackages.map(wp => [wp.id, wp]));

    workPackages.forEach(wp => {
      const wpItems = items.filter(it => it.wpId === wp.id);
      let minM = Infinity, maxM = -Infinity;
      wpItems.forEach(it => {
        if (it.startMonth < minM) minM = it.startMonth;
        if (it.endMonth > maxM) maxM = it.endMonth;
      });
      if (minM === Infinity) { minM = 1; maxM = 1; }

      visibleRows.push({
        isWp: true,
        wp,
        itemCount: wpItems.length,
        minMonth: minM,
        maxMonth: maxM
      });

      if (!wp.collapsed) {
        wpItems.forEach(item => {
          visibleRows.push({
            isWp: false,
            wp,
            item
          });
        });
      }
    });

    this.visibleRows = visibleRows;
    this.rowHeight = rowHeight;
    this.headerHeight = headerHeight;
    this.titleBannerHeight = titleBannerHeight;
    this.leftColWidth = leftColWidth;

    const totalRowsHeight = visibleRows.length * rowHeight;
    const legendHeight = 44;
    const totalHeight = titleBannerHeight + headerHeight + totalRowsHeight + legendHeight + 20;

    // Theme palette
    const themeStyles = this.getThemeStyles(meta.theme);

    // Build SVG
    const svgParts = [];
    svgParts.push(`
      <svg id="gantt-svg-root"
           xmlns="http://www.w3.org/2000/svg"
           xmlns:xlink="http://www.w3.org/1999/xlink"
           viewBox="0 0 ${totalWidth} ${totalHeight}"
           width="${totalWidth}"
           height="${totalHeight}"
           style="background-color: ${themeStyles.bg}; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;"
           data-theme="${meta.theme}">
        <defs>
          <style>
            text {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              -webkit-font-smoothing: antialiased;
            }
            .gantt-title-interactive { cursor: pointer; }
            .gantt-title-interactive:hover .title-main { fill: #2563eb !important; }
            .gantt-title-interactive:hover .edit-pencil-icon { opacity: 1 !important; }
          </style>
          <linearGradient id="bar-shine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.22"/>
            <stop offset="100%" stop-color="#000000" stop-opacity="0.12"/>
          </linearGradient>
          <filter id="subtle-shadow" x="-5%" y="-10%" width="110%" height="130%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-opacity="0.12"/>
          </filter>
          <pattern id="hatch-pattern" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="8" stroke="#ffffff" stroke-width="2" stroke-opacity="0.32"/>
          </pattern>
        </defs>
    `);

    // Interactive Title Banner
    const projectTitle = meta.title || 'Click to set project title';
    const projectSubtitle = meta.subtitle || 'Click to add grant agreement # or subtitle';

    svgParts.push(`
      <g class="gantt-title-banner" transform="translate(16, 14)">
        <g class="gantt-title-interactive" id="gantt-title-trigger" title="Click to edit project title and details">
          <text id="gantt-svg-title" class="title-main" x="4" y="18" dominant-baseline="central" font-size="19" font-weight="700" fill="${themeStyles.titleText}">${this.escapeXML(projectTitle)}</text>
          
          <!-- Pencil icon indicating editability -->
          <g class="edit-pencil-icon" transform="translate(${Math.min(totalWidth - 280, 520)}, 8)" opacity="0.65">
            <rect x="0" y="0" width="84" height="20" rx="4" fill="${themeStyles.codeBadgeBg}" stroke="${themeStyles.codeBadgeBorder}" stroke-width="0.75"/>
            <path d="M7 14 L13 14 M9 7 L12 4 L14 6 L11 9 Z" fill="none" stroke="${themeStyles.metaText}" stroke-width="1.2"/>
            <text x="22" y="10" dominant-baseline="central" font-size="10.5" font-weight="600" fill="${themeStyles.metaText}">Edit Title</text>
          </g>

          <text id="gantt-svg-subtitle" x="4" y="40" dominant-baseline="central" font-size="12" font-weight="500" fill="${themeStyles.subtitleText}">${this.escapeXML(projectSubtitle)}</text>
        </g>
        
        <text x="${totalWidth - 36}" y="18" text-anchor="end" dominant-baseline="central" font-size="11.5" font-weight="500" fill="${themeStyles.metaText}">Duration: ${totalMonths} Months | ${items.length} Project Items</text>
      </g>
    `);

    const chartOffsetY = titleBannerHeight;

    // Timeline Header & Columns background
    svgParts.push(`<g transform="translate(0, ${chartOffsetY})">`);

    // Top Header background
    svgParts.push(`
      <rect x="0" y="0" width="${totalWidth}" height="${headerHeight}" fill="${themeStyles.headerBg}" stroke="${themeStyles.gridBorder}" stroke-width="1"/>
      <rect x="0" y="0" width="${leftColWidth}" height="${headerHeight}" fill="${themeStyles.headerLeftBg}" stroke="${themeStyles.gridBorder}" stroke-width="1"/>
      <text x="16" y="${headerHeight / 2}" dominant-baseline="central" font-size="13" font-weight="700" fill="${themeStyles.titleText}">Work Package / Tasks & Milestones</text>
    `);

    // Header Timeline Months & Years
    const headerCols = this.generateTimeHeaders(meta, totalMonths, monthWidth, leftColWidth, themeStyles);
    svgParts.push(headerCols);

    // Chart Rows Background & Grid lines
    svgParts.push(`<g transform="translate(0, ${headerHeight})">`);

    // Vertical Month Grid Lines behind rows
    for (let m = 0; m <= totalMonths; m++) {
      const gx = leftColWidth + m * monthWidth;
      let isYearBoundary = false;
      let isQuarterBoundary = false;

      if (timeMode === 'calendar') {
        if (m > 0 && m < totalMonths) {
          const totalM = (startMonth - 1) + (m - 1);
          const nextTotalM = totalM + 1;
          const currentYear = startYear + Math.floor(totalM / 12);
          const nextYear = startYear + Math.floor(nextTotalM / 12);
          isYearBoundary = (currentYear !== nextYear);
          isQuarterBoundary = ((totalM + 1) % 3 === 0);
        }
      } else {
        isYearBoundary = (m > 0 && m % 12 === 0);
        isQuarterBoundary = (m > 0 && m % 3 === 0);
      }

      const strokeCol = isYearBoundary ? themeStyles.yearGridBorder : (isQuarterBoundary ? themeStyles.quarterGridBorder : themeStyles.gridLine);
      const strokeW = isYearBoundary ? 1.5 : (isQuarterBoundary ? 1 : 0.75);

      svgParts.push(`
        <line x1="${gx}" y1="0" x2="${gx}" y2="${totalRowsHeight}" stroke="${strokeCol}" stroke-width="${strokeW}" ${(!isYearBoundary && !isQuarterBoundary) ? 'stroke-dasharray="2,3"' : ''}/>
      `);
    }

    // Rows
    visibleRows.forEach((row, idx) => {
      const y = idx * rowHeight;
      const rowCenterY = y + rowHeight / 2;
      const isEven = idx % 2 === 0;

      if (row.isWp) {
        // Work package header row (collapsible)
        const wpX = leftColWidth + (row.minMonth - 1) * monthWidth;
        const wpW = Math.max(monthWidth * 0.5, (row.maxMonth - row.minMonth + 1) * monthWidth);
        const chevron = row.wp.collapsed
          ? `<polygon points="12,${rowCenterY - 4} 18,${rowCenterY} 12,${rowCenterY + 4}" fill="${row.wp.color}"/>`
          : `<polygon points="10,${rowCenterY - 2} 18,${rowCenterY - 2} 14,${rowCenterY + 3}" fill="${row.wp.color}"/>`;

        svgParts.push(`
          <g class="gantt-wp-row" data-wpid="${row.wp.id}" style="cursor: pointer;">
            <rect x="0" y="${y}" width="${totalWidth}" height="${rowHeight}" fill="${themeStyles.wpRowBg}" stroke="${themeStyles.gridBorder}" stroke-width="0.5"/>
            <rect x="0" y="${y}" width="5" height="${rowHeight}" fill="${row.wp.color}"/>
            
            <!-- Chevron expand/collapse toggle -->
            ${chevron}

            <!-- WP Left label -->
            <text x="26" y="${rowCenterY}" dominant-baseline="central" font-size="12.5" font-weight="700" fill="${themeStyles.titleText}">
              <tspan fill="${row.wp.color}" font-weight="800">${this.escapeXML(row.wp.code)}:</tspan> ${this.escapeXML(this.truncate(row.wp.name, Math.max(24, Math.floor((leftColWidth - 130) / 7.2))))}
            </text>
            <text x="${leftColWidth - 14}" y="${rowCenterY}" text-anchor="end" dominant-baseline="central" font-size="10" fill="${themeStyles.metaText}">
              ${row.itemCount} items ${row.wp.collapsed ? '(click to expand)' : ''}
            </text>

            <!-- WP Span Bar in timeline (bracket or aggregate bar) -->
            <rect x="${wpX}" y="${y + (rowHeight - 12) / 2}" width="${wpW}" height="12" rx="3" fill="${row.wp.color}" fill-opacity="0.28" stroke="${row.wp.color}" stroke-width="1.2"/>
            <polygon points="${wpX},${y + (rowHeight - 12) / 2 + 12} ${wpX + 7},${y + (rowHeight - 12) / 2 + 12} ${wpX},${y + (rowHeight - 12) / 2 + 5}" fill="${row.wp.color}"/>
            <polygon points="${wpX + wpW},${y + (rowHeight - 12) / 2 + 12} ${wpX + wpW - 7},${y + (rowHeight - 12) / 2 + 12} ${wpX + wpW},${y + (rowHeight - 12) / 2 + 5}" fill="${row.wp.color}"/>
          </g>
        `);
      } else {
        // Task / Milestone / Deliverable Row
        const item = row.item;
        const isMilestone = item.type === 'milestone';
        const isDeliverable = item.type === 'deliverable';
        const badgeWidth = isMilestone ? 32 : (isDeliverable ? 36 : 40);

        // Dynamically calculate title truncation limit based on expanded column width
        const leadWidth = item.lead ? (item.lead.length + 3) * 6 : 0;
        const titleAvailWidth = Math.max(120, leftColWidth - (24 + badgeWidth) - 75 - leadWidth);
        const maxTitleChars = Math.max(20, Math.floor(titleAvailWidth / 6.2));

        svgParts.push(`
          <g class="gantt-item-row" data-id="${item.id}" data-wpid="${row.wp.id}">
            <!-- Row background -->
            <rect x="0" y="${y}" width="${totalWidth}" height="${rowHeight}" fill="${isEven ? themeStyles.rowBgEven : themeStyles.rowBgOdd}" stroke="${themeStyles.gridBorder}" stroke-width="0.5"/>
            
            <!-- Row drag-reorder handle -->
            <g class="svg-row-drag-handle" data-id="${item.id}" style="cursor: grab;">
              <title>Drag up or down to reorder task</title>
              <rect x="0" y="${y}" width="15" height="${rowHeight}" fill="transparent"/>
              <circle cx="5" cy="${rowCenterY - 5}" r="1.3" fill="${themeStyles.metaText}" opacity="0.4"/>
              <circle cx="9" cy="${rowCenterY - 5}" r="1.3" fill="${themeStyles.metaText}" opacity="0.4"/>
              <circle cx="5" cy="${rowCenterY}" r="1.3" fill="${themeStyles.metaText}" opacity="0.4"/>
              <circle cx="9" cy="${rowCenterY}" r="1.3" fill="${themeStyles.metaText}" opacity="0.4"/>
              <circle cx="5" cy="${rowCenterY + 5}" r="1.3" fill="${themeStyles.metaText}" opacity="0.4"/>
              <circle cx="9" cy="${rowCenterY + 5}" r="1.3" fill="${themeStyles.metaText}" opacity="0.4"/>
            </g>

            <!-- Left Column Content -->
            <!-- Type badge / code -->
            <rect x="16" y="${y + (rowHeight - 18) / 2}" width="${badgeWidth}" height="18" rx="3" fill="${isMilestone ? '#fef3c7' : (isDeliverable ? '#ede9fe' : themeStyles.codeBadgeBg)}" stroke="${isMilestone ? '#f59e0b' : (isDeliverable ? '#8b5cf6' : themeStyles.codeBadgeBorder)}" stroke-width="0.75"/>
            <text x="${16 + badgeWidth / 2}" y="${rowCenterY}" text-anchor="middle" dominant-baseline="central" font-size="9.5" font-weight="700" fill="${isMilestone ? '#b45309' : (isDeliverable ? '#6d28d9' : row.wp.color)}">
              ${this.escapeXML(item.code || (isMilestone ? 'MS' : (isDeliverable ? 'DEL' : 'TSK')))}
            </text>

            <!-- Title & Lead -->
            <text x="${24 + badgeWidth}" y="${rowCenterY}" dominant-baseline="central" font-size="11.5" font-weight="500" fill="${themeStyles.bodyText}" class="item-title-text">
              ${this.escapeXML(this.truncate(item.title, maxTitleChars))}
              ${item.lead ? `<tspan fill="${themeStyles.metaText}" font-size="10"> (${this.escapeXML(item.lead)})</tspan>` : ''}
            </text>

            <!-- Duration badge on right of left column -->
            <text x="${leftColWidth - 14}" y="${rowCenterY}" text-anchor="end" dominant-baseline="central" font-size="10" font-family="monospace" fill="${themeStyles.metaText}">
              M${item.startMonth}${item.endMonth !== item.startMonth ? `–M${item.endMonth}` : ''}
            </text>
        `);

        // Timeline Bar / Diamond / Deliverable rendering
        if (isMilestone) {
          // Milestone Diamond
          const cx = leftColWidth + (item.startMonth - 0.5) * monthWidth;
          const cy = rowCenterY;
          const r = 9;

          svgParts.push(`
            <g class="gantt-milestone-marker interactive-node" data-id="${item.id}" transform="translate(${cx}, ${cy})" style="cursor: pointer;">
              <polygon points="0,${-r} ${r},0 0,${r} ${-r},0" fill="#f59e0b" stroke="#b45309" stroke-width="1.8" filter="url(#subtle-shadow)"/>
              <circle cx="0" cy="0" r="2.5" fill="#ffffff"/>
            </g>
          `);
        } else if (isDeliverable) {
          // Deliverable Hexagon
          const cx = leftColWidth + (item.startMonth - 0.5) * monthWidth;
          const cy = rowCenterY;
          const r = 8.5;

          svgParts.push(`
            <g class="gantt-deliverable-marker interactive-node" data-id="${item.id}" transform="translate(${cx}, ${cy})" style="cursor: pointer;">
              <polygon points="${-r},${-r * 0.58} 0,${-r * 1.15} ${r},${-r * 0.58} ${r},${r * 0.58} 0,${r * 1.15} ${-r},${r * 0.58}" fill="#8b5cf6" stroke="#6d28d9" stroke-width="1.5" filter="url(#subtle-shadow)"/>
              <text x="0" y="0" text-anchor="middle" dominant-baseline="central" font-size="8.5" font-weight="800" fill="#ffffff">D</text>
            </g>
          `);
        } else {
          // Standard Task Bar
          const startM = item.startMonth;
          const endM = Math.max(startM, item.endMonth);
          const barX = leftColWidth + (startM - 1) * monthWidth + 3;
          const barW = Math.max(12, (endM - startM + 1) * monthWidth - 6);
          const barH = rowHeight - 14;
          const barY = y + 7;
          const barCenterY = barY + barH / 2;
          const progress = Math.min(100, Math.max(0, item.progress || 0));
          const progressW = (barW * progress) / 100;
          const barColor = row.wp.color || '#3b82f6';

          svgParts.push(`
            <g class="gantt-task-bar interactive-node" data-id="${item.id}" style="cursor: grab;">
              <!-- Outer bar -->
              <rect class="bar-main" x="${barX}" y="${barY}" width="${barW}" height="${barH}" rx="5" fill="${barColor}" stroke="${themeStyles.barBorder}" stroke-width="0.8" filter="url(#subtle-shadow)"/>
              
              <!-- Progress fill if progress > 0 -->
              ${meta.showProgress && progress > 0 ? `
                <clipPath id="clip-${item.id}">
                  <rect x="${barX}" y="${barY}" width="${progressW}" height="${barH}" rx="5"/>
                </clipPath>
                <rect x="${barX}" y="${barY}" width="${barW}" height="${barH}" rx="5" fill="#000000" fill-opacity="0.22" clip-path="url(#clip-${item.id})"/>
                <rect x="${barX}" y="${barY}" width="${progressW}" height="${barH}" rx="5" fill="url(#hatch-pattern)" clip-path="url(#clip-${item.id})"/>
              ` : ''}

              <!-- Bar shine overlay -->
              <rect x="${barX}" y="${barY}" width="${barW}" height="${barH}" rx="5" fill="url(#bar-shine)" pointer-events="none"/>

              <!-- Bar Label -->
              ${barW >= 60 ? `
                <text x="${barX + 8}" y="${barCenterY}" dominant-baseline="central" font-size="10.5" font-weight="600" fill="#ffffff" pointer-events="none">
                  ${this.escapeXML(this.truncate(item.code || item.title, Math.floor(barW / 7.5)))}
                  ${meta.showProgress && progress > 0 && barW > 110 ? `<tspan fill="#e0f2fe" font-size="9.5"> (${progress}%)</tspan>` : ''}
                </text>
              ` : `
                <text x="${barX + barW + 6}" y="${barCenterY}" dominant-baseline="central" font-size="10" font-weight="600" fill="${themeStyles.bodyText}" pointer-events="none">
                  ${this.escapeXML(item.code || item.title)}
                </text>
              `}

              <!-- Drag handle on the right edge for resizing duration -->
              <rect class="resize-handle resize-right" x="${barX + barW - 7}" y="${barY}" width="9" height="${barH}" rx="2" fill="transparent" style="cursor: ew-resize;"/>
            </g>
          `);
        }

        svgParts.push(`</g>`);
      }
    });

    // Drop insertion indicator line across chart rows
    svgParts.push(`
      <line id="svg-row-drop-indicator" x1="0" x2="${totalWidth}" y1="0" y2="0" stroke="#2563eb" stroke-width="2.5" stroke-dasharray="5,3" style="display: none; pointer-events: none;"/>
    `);

    svgParts.push(`</g>`); // End rows group

    // Interactive Column Divider Resize Handle (between Left Column and Timeline)
    const dividerH = headerHeight + totalRowsHeight;
    svgParts.push(`
      <g class="col-divider-handle" data-leftcolwidth="${leftColWidth}" title="Drag horizontally to stretch first column • Double-click to auto-fit longest title" style="cursor: col-resize;">
        <!-- Transparent wide hit area for easy mouse grabbing -->
        <rect x="${leftColWidth - 6}" y="0" width="12" height="${dividerH}" fill="transparent" style="cursor: col-resize;"/>
        <!-- Visual border line -->
        <line x1="${leftColWidth}" y1="0" x2="${leftColWidth}" y2="${dividerH}" stroke="${themeStyles.gridBorder}" stroke-width="1.5"/>
        <!-- Small visual grip notch in the header -->
        <rect x="${leftColWidth - 2.5}" y="${headerHeight / 2 - 10}" width="5" height="20" rx="2" fill="${themeStyles.metaText}" opacity="0.4" style="pointer-events: none;"/>
      </g>
    `);

    // Bottom Legend
    const legendY = headerHeight + totalRowsHeight + 14;
    svgParts.push(`
      <g class="gantt-legend" transform="translate(16, ${legendY})">
        <rect x="0" y="0" width="${totalWidth - 32}" height="32" rx="6" fill="${themeStyles.legendBg}" stroke="${themeStyles.gridBorder}" stroke-width="0.8"/>
        
        <g transform="translate(12, 10)">
          <!-- Task legend -->
          <rect x="0" y="0" width="16" height="10" rx="2" fill="#2563eb"/>
          <text x="22" y="6" dominant-baseline="central" font-size="11" font-weight="500" fill="${themeStyles.bodyText}">Research Task</text>

          <!-- Milestone legend -->
          <polygon points="120,5 125,0 130,5 125,10" fill="#f59e0b" stroke="#b45309" stroke-width="1"/>
          <text x="136" y="6" dominant-baseline="central" font-size="11" font-weight="500" fill="${themeStyles.bodyText}">Milestone (Decision Point)</text>

          <!-- Deliverable legend -->
          <polygon points="296,2 301,0 306,2 306,7 301,9 296,7" fill="#8b5cf6"/>
          <text x="312" y="6" dominant-baseline="central" font-size="11" font-weight="500" fill="${themeStyles.bodyText}">Deliverable / Output</text>

          ${meta.showProgress ? `
            <!-- Progress legend -->
            <rect x="445" y="0" width="24" height="10" rx="2" fill="#2563eb"/>
            <rect x="445" y="0" width="14" height="10" rx="2" fill="#1e3a8a"/>
            <text x="475" y="6" dominant-baseline="central" font-size="11" font-weight="500" fill="${themeStyles.bodyText}">Progress Fill (%)</text>
          ` : ''}
        </g>
      </g>
    `);

    svgParts.push(`</g>`); // End chartOffsetY
    svgParts.push(`</svg>`);

    this.container.innerHTML = svgParts.join('');

    // Attach event listeners for hover tooltips, collapsible WPs, title edit, and interactive dragging
    this.attachEventListeners(leftColWidth, monthWidth, totalMonths);
  }

  generateTimeHeaders(meta, totalMonths, monthWidth, leftColWidth, themeStyles) {
    const parts = [];
    const timeMode = meta.timeMode || 'project_months';
    const startParts = this.parseDateParts(meta.startDate);
    const startYear = startParts.year;
    const startMonth = startParts.month; // 1 to 12

    const y1Height = 32;
    const y2Height = 38;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (timeMode === 'calendar') {
      // Group consecutive month columns by their actual calendar year
      const yearGroups = [];
      let currentGroup = null;

      for (let m = 1; m <= totalMonths; m++) {
        const offset = m - 1;
        const totalM = (startMonth - 1) + offset;
        const calYear = startYear + Math.floor(totalM / 12);

        if (!currentGroup || currentGroup.year !== calYear) {
          if (currentGroup) {
            yearGroups.push(currentGroup);
          }
          currentGroup = {
            year: calYear,
            startMonthIdx: m,
            count: 1
          };
        } else {
          currentGroup.count++;
        }
      }
      if (currentGroup) {
        yearGroups.push(currentGroup);
      }

      // Render Year Row (Row 1)
      yearGroups.forEach((grp, idx) => {
        const x = leftColWidth + (grp.startMonthIdx - 1) * monthWidth;
        const w = grp.count * monthWidth;
        const bg = (idx % 2 === 0) ? themeStyles.yearHeaderBgEven : themeStyles.yearHeaderBgOdd;

        parts.push(`
          <rect x="${x}" y="0" width="${w}" height="${y1Height}" fill="${bg}" stroke="${themeStyles.gridBorder}" stroke-width="0.8"/>
          <text x="${x + w / 2}" y="${y1Height / 2}" text-anchor="middle" dominant-baseline="central" font-size="11.5" font-weight="700" fill="${themeStyles.titleText}">
            ${grp.year}
          </text>
        `);
      });

      // Render Month Subheader Row (Row 2)
      for (let m = 1; m <= totalMonths; m++) {
        const offset = m - 1;
        const totalM = (startMonth - 1) + offset;
        const calMonth = totalM % 12;
        const x = leftColWidth + (m - 1) * monthWidth;
        const isYearStart = (calMonth === 0 && m > 1);
        const isQuarterEnd = (calMonth + 1) % 3 === 0;

        let mLabel = monthNames[calMonth];

        parts.push(`
          <rect x="${x}" y="${y1Height}" width="${monthWidth}" height="${y2Height}" fill="${themeStyles.monthHeaderBg}" stroke="${themeStyles.gridBorder}" stroke-width="0.6"/>
          <text x="${x + monthWidth / 2}" y="${y1Height + y2Height / 2}" text-anchor="middle" dominant-baseline="central" font-size="10.5" font-weight="${(isQuarterEnd || isYearStart) ? '700' : '500'}" fill="${isYearStart ? themeStyles.titleText : (isQuarterEnd ? themeStyles.titleText : themeStyles.subtitleText)}">
            ${mLabel}
          </text>
        `);
      }
    } else if (timeMode === 'quarters') {
      // Grouping by Project Year (every 4 quarters = 12 months)
      const numYears = Math.ceil(totalMonths / 12);
      for (let yr = 0; yr < numYears; yr++) {
        const startM = yr * 12 + 1;
        const endM = Math.min((yr + 1) * 12, totalMonths);
        const spanMonths = endM - startM + 1;
        const x = leftColWidth + (startM - 1) * monthWidth;
        const w = spanMonths * monthWidth;
        const startQ = yr * 4 + 1;
        const endQ = Math.min((yr + 1) * 4, Math.ceil(totalMonths / 3));

        parts.push(`
          <rect x="${x}" y="0" width="${w}" height="${y1Height}" fill="${yr % 2 === 0 ? themeStyles.yearHeaderBgEven : themeStyles.yearHeaderBgOdd}" stroke="${themeStyles.gridBorder}" stroke-width="0.8"/>
          <text x="${x + w / 2}" y="${y1Height / 2}" text-anchor="middle" dominant-baseline="central" font-size="11.5" font-weight="700" fill="${themeStyles.titleText}">
            Year ${yr + 1} (Q${startQ}–Q${endQ})
          </text>
        `);
      }

      // Subheader: Individual months with Quarter indicator
      for (let m = 1; m <= totalMonths; m++) {
        const x = leftColWidth + (m - 1) * monthWidth;
        const qNum = Math.ceil(m / 3);
        const mInQ = ((m - 1) % 3) + 1;
        const mLabel = `Q${qNum}.${mInQ}`;
        const isQuarterEnd = m % 3 === 0;

        parts.push(`
          <rect x="${x}" y="${y1Height}" width="${monthWidth}" height="${y2Height}" fill="${themeStyles.monthHeaderBg}" stroke="${themeStyles.gridBorder}" stroke-width="0.6"/>
          <text x="${x + monthWidth / 2}" y="${y1Height + y2Height / 2}" text-anchor="middle" dominant-baseline="central" font-size="10.5" font-weight="${isQuarterEnd ? '700' : '500'}" fill="${isQuarterEnd ? themeStyles.titleText : themeStyles.subtitleText}">
            ${mLabel}
          </text>
        `);
      }
    } else {
      // Default: Project Months (M1 - MN grouped by Project Year)
      const numYears = Math.ceil(totalMonths / 12);
      for (let yr = 0; yr < numYears; yr++) {
        const startM = yr * 12 + 1;
        const endM = Math.min((yr + 1) * 12, totalMonths);
        const spanMonths = endM - startM + 1;
        const x = leftColWidth + (startM - 1) * monthWidth;
        const w = spanMonths * monthWidth;

        parts.push(`
          <rect x="${x}" y="0" width="${w}" height="${y1Height}" fill="${yr % 2 === 0 ? themeStyles.yearHeaderBgEven : themeStyles.yearHeaderBgOdd}" stroke="${themeStyles.gridBorder}" stroke-width="0.8"/>
          <text x="${x + w / 2}" y="${y1Height / 2}" text-anchor="middle" dominant-baseline="central" font-size="11.5" font-weight="700" fill="${themeStyles.titleText}">
            Project Year ${yr + 1} (Months ${startM}–${endM})
          </text>
        `);
      }

      // Subheader: M1, M2...
      for (let m = 1; m <= totalMonths; m++) {
        const x = leftColWidth + (m - 1) * monthWidth;
        const mLabel = `M${m}`;
        const isQuarterEnd = m % 3 === 0;

        parts.push(`
          <rect x="${x}" y="${y1Height}" width="${monthWidth}" height="${y2Height}" fill="${themeStyles.monthHeaderBg}" stroke="${themeStyles.gridBorder}" stroke-width="0.6"/>
          <text x="${x + monthWidth / 2}" y="${y1Height + y2Height / 2}" text-anchor="middle" dominant-baseline="central" font-size="10.5" font-weight="${isQuarterEnd ? '700' : '500'}" fill="${isQuarterEnd ? themeStyles.titleText : themeStyles.subtitleText}">
            ${mLabel}
          </text>
        `);
      }
    }

    return parts.join('');
  }

  attachEventListeners(leftColWidth, monthWidth, totalMonths) {
    const svg = this.container.querySelector('#gantt-svg-root');
    if (!svg) return;

    // Title Click-to-Edit Trigger
    const titleTrigger = svg.querySelector('#gantt-title-trigger');
    if (titleTrigger) {
      titleTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        this.onTitleClick();
      });
    }

    // Collapsible Work Package header rows
    svg.querySelectorAll('.gantt-wp-row').forEach(wpRow => {
      wpRow.addEventListener('click', (e) => {
        const wpId = wpRow.getAttribute('data-wpid');
        const wp = this.data.workPackages.find(w => w.id === wpId);
        if (wp) {
          wp.collapsed = !wp.collapsed;
          this.render(this.data);
          this.onTaskChange();
        }
      });
    });

    // Tooltip listeners
    const nodes = svg.querySelectorAll('.interactive-node');
    nodes.forEach(node => {
      const id = node.getAttribute('data-id');
      const item = this.data.items.find(it => it.id === id);
      if (!item) return;
      const wp = this.data.workPackages.find(w => w.id === item.wpId);

      node.addEventListener('mouseenter', (e) => {
        this.showTooltip(e, item, wp);
      });

      node.addEventListener('mousemove', (e) => {
        this.moveTooltip(e);
      });

      node.addEventListener('mouseleave', () => {
        this.hideTooltip();
      });

      node.addEventListener('click', (e) => {
        if (this.hasMoved) return; // ignore click if dragging occurred
        e.stopPropagation();
        this.onTaskSelect(item.id);
      });
    });

    // Drag-to-move, Drag-to-resize, Drag-to-reorder, and Column-resize handlers
    let isDragging = false;
    let dragType = null; // 'move' | 'resize-right' | 'row-reorder' | 'col-resize'
    let currentItemId = null;
    let initialMouseX = 0;
    let initialMouseY = 0;
    let origStartMonth = 1;
    let origEndMonth = 1;
    let origLeftColWidth = leftColWidth;
    let pendingRowTarget = null;

    // Double-click column divider to auto-fit longest title
    svg.querySelectorAll('.col-divider-handle').forEach(el => {
      el.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.onAutoFitColWidth();
      });
    });

    const onMouseDown = (e) => {
      const colDivider = e.target.closest('.col-divider-handle');
      const rowDragHandle = e.target.closest('.svg-row-drag-handle');
      const resizeHandle = e.target.closest('.resize-right');
      const taskBar = e.target.closest('.gantt-task-bar');
      const marker = e.target.closest('.gantt-milestone-marker, .gantt-deliverable-marker');

      if (colDivider) {
        e.preventDefault();
        e.stopPropagation();
        isDragging = true;
        this.hasMoved = false;
        dragType = 'col-resize';
        initialMouseX = e.clientX;
        origLeftColWidth = this.leftColWidth || leftColWidth;
        this.onDragStart();
        return;
      } else if (rowDragHandle) {
        e.preventDefault();
        e.stopPropagation();
        currentItemId = rowDragHandle.getAttribute('data-id');
        isDragging = true;
        this.hasMoved = false;
        dragType = 'row-reorder';
        initialMouseY = e.clientY;
        pendingRowTarget = null;
      } else if (resizeHandle) {
        e.preventDefault();
        e.stopPropagation();
        const parentBar = resizeHandle.closest('.gantt-task-bar');
        currentItemId = parentBar.getAttribute('data-id');
        const item = this.data.items.find(i => i.id === currentItemId);
        if (!item) return;

        isDragging = true;
        this.hasMoved = false;
        dragType = 'resize-right';
        initialMouseX = e.clientX;
        origStartMonth = item.startMonth;
        origEndMonth = item.endMonth;
        this.onDragStart();
      } else if (taskBar || marker) {
        const targetNode = taskBar || marker;
        currentItemId = targetNode.getAttribute('data-id');
        const item = this.data.items.find(i => i.id === currentItemId);
        if (!item) return;

        isDragging = true;
        this.hasMoved = false;
        dragType = 'move';
        initialMouseX = e.clientX;
        origStartMonth = item.startMonth;
        origEndMonth = item.endMonth;
        this.onDragStart();
      }
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;

      if (dragType === 'col-resize') {
        const deltaX = e.clientX - initialMouseX;
        if (Math.abs(deltaX) > 2) {
          this.hasMoved = true;
        }
        const newLeftColWidth = Math.max(220, Math.min(650, origLeftColWidth + deltaX));
        const currentW = this.data.meta.leftColWidth || this.leftColWidth || 350;
        if (newLeftColWidth !== currentW) {
          this.data.meta.leftColWidth = newLeftColWidth;
          this.render(this.data);
          this.onColWidthChange(newLeftColWidth);
        }
        return;
      }

      if (!currentItemId) return;

      if (dragType === 'row-reorder') {
        const deltaY = Math.abs(e.clientY - initialMouseY);
        if (deltaY > 3) {
          this.hasMoved = true;
        }

        const dropLine = svg.querySelector('#svg-row-drop-indicator');
        if (!dropLine) return;

        // Map mouse position to SVG coordinate space
        const ctm = svg.getScreenCTM();
        if (!ctm) return;
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgPt = pt.matrixTransform(ctm.inverse());

        const rowAreaY = svgPt.y - (this.titleBannerHeight || 68) - (this.headerHeight || 70);
        const rowH = this.rowHeight || 38;
        const totalRows = (this.visibleRows || []).length;
        if (totalRows === 0) return;

        const targetIdx = Math.max(0, Math.min(totalRows - 1, Math.floor(rowAreaY / rowH)));
        const targetRow = this.visibleRows[targetIdx];
        if (!targetRow) return;

        const rowTopY = targetIdx * rowH;
        const isAfter = (rowAreaY - rowTopY) > (rowH / 2);
        const lineY = rowTopY + (isAfter ? rowH : 0);

        dropLine.setAttribute('y1', lineY);
        dropLine.setAttribute('y2', lineY);
        dropLine.style.display = 'block';

        pendingRowTarget = {
          targetRow,
          isAfter
        };
        return;
      }

      const deltaX = e.clientX - initialMouseX;
      if (Math.abs(deltaX) > 4) {
        this.hasMoved = true;
      }

      const deltaMonths = Math.round(deltaX / monthWidth);
      const item = this.data.items.find(i => i.id === currentItemId);
      if (!item) return;

      if (dragType === 'resize-right') {
        const newEnd = Math.max(origStartMonth, Math.min(totalMonths, origEndMonth + deltaMonths));
        if (newEnd !== item.endMonth) {
          item.endMonth = newEnd;
          this.render(this.data);
          this.onTaskChange(item);
        }
      } else if (dragType === 'move') {
        const span = origEndMonth - origStartMonth;
        let newStart = origStartMonth + deltaMonths;
        let newEnd = newStart + span;

        if (newStart < 1) {
          newStart = 1;
          newEnd = newStart + span;
        }
        if (newEnd > totalMonths) {
          newEnd = totalMonths;
          newStart = Math.max(1, newEnd - span);
        }

        if (newStart !== item.startMonth || newEnd !== item.endMonth) {
          item.startMonth = newStart;
          item.endMonth = newEnd;
          this.render(this.data);
          this.onTaskChange(item);
        }
      }
    };

    const onMouseUp = () => {
      if (isDragging) {
        const dropLine = svg.querySelector('#svg-row-drop-indicator');
        if (dropLine) dropLine.style.display = 'none';

        if (dragType === 'col-resize') {
          if (this.hasMoved) {
            this.onDragEnd();
          }
          isDragging = false;
          dragType = null;
          setTimeout(() => { this.hasMoved = false; }, 80);
          return;
        }

        if (dragType === 'row-reorder') {
          if (this.hasMoved && pendingRowTarget && currentItemId) {
            const { targetRow, isAfter } = pendingRowTarget;
            if (targetRow.item && targetRow.item.id !== currentItemId) {
              this.onTaskReorder(currentItemId, targetRow.item.id, isAfter);
            } else if (targetRow.isWp) {
              const wpItems = this.data.items.filter(it => it.wpId === targetRow.wp.id);
              if (wpItems.length > 0 && wpItems[0].id !== currentItemId) {
                this.onTaskReorder(currentItemId, wpItems[0].id, false);
              }
            }
          }
        } else if (this.hasMoved) {
          this.onDragEnd();
        }

        isDragging = false;
        dragType = null;
        currentItemId = null;
        pendingRowTarget = null;
        setTimeout(() => { this.hasMoved = false; }, 80);
      }
    };

    svg.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  showTooltip(e, item, wp) {
    if (!this.tooltipEl) return;
    const typeLabel = item.type === 'milestone' ? 'Milestone' : (item.type === 'deliverable' ? 'Deliverable' : 'Task');
    const badgeColor = item.type === 'milestone' ? '#f59e0b' : (item.type === 'deliverable' ? '#8b5cf6' : (wp ? wp.color : '#2563eb'));

    this.tooltipEl.innerHTML = `
      <div class="tt-header">
        <span class="tt-badge" style="background-color: ${badgeColor}; color: #fff;">${this.escapeXML(item.code || typeLabel)}</span>
        <span class="tt-type">${typeLabel}</span>
      </div>
      <div class="tt-title">${this.escapeXML(item.title)}</div>
      <div class="tt-meta">
        <div><strong>Package:</strong> ${wp ? this.escapeXML(wp.code + ' – ' + wp.name) : 'General'}</div>
        <div><strong>Timeline:</strong> Month ${item.startMonth}${item.endMonth !== item.startMonth ? ` – Month ${item.endMonth}` : ''} (${item.endMonth - item.startMonth + 1} mo)</div>
        ${item.type === 'task' ? `<div><strong>Progress:</strong> ${item.progress ?? 0}% completed</div>` : ''}
        ${item.lead ? `<div><strong>Lead / Owner:</strong> ${this.escapeXML(item.lead)}</div>` : ''}
        ${item.notes ? `<div class="tt-notes">${this.escapeXML(item.notes)}</div>` : ''}
      </div>
      <div class="tt-hint">Click to edit details • Drag bar to adjust dates</div>
    `;

    this.tooltipEl.style.display = 'block';
    this.moveTooltip(e);
  }

  moveTooltip(e) {
    if (!this.tooltipEl) return;
    const offset = 14;
    let x = e.pageX + offset;
    let y = e.pageY + offset;

    const ttRect = this.tooltipEl.getBoundingClientRect();
    if (x + ttRect.width > window.innerWidth - 10) {
      x = e.pageX - ttRect.width - offset;
    }
    if (y + ttRect.height > window.innerHeight - 10) {
      y = e.pageY - ttRect.height - offset;
    }

    this.tooltipEl.style.left = `${x}px`;
    this.tooltipEl.style.top = `${y}px`;
  }

  hideTooltip() {
    if (this.tooltipEl) {
      this.tooltipEl.style.display = 'none';
    }
  }

  getThemeStyles(theme) {
    const themes = {
      academic: {
        bg: '#ffffff',
        headerBg: '#f8fafc',
        headerLeftBg: '#f1f5f9',
        yearHeaderBgEven: '#e2e8f0',
        yearHeaderBgOdd: '#edf2f7',
        monthHeaderBg: '#f8fafc',
        wpRowBg: '#f1f5f9',
        rowBgEven: '#ffffff',
        rowBgOdd: '#fbfcfd',
        gridBorder: '#e2e8f0',
        yearGridBorder: '#94a3b8',
        quarterGridBorder: '#cbd5e1',
        gridLine: '#f1f5f9',
        titleText: '#0f172a',
        subtitleText: '#475569',
        bodyText: '#1e293b',
        metaText: '#64748b',
        codeBadgeBg: '#f1f5f9',
        codeBadgeBorder: '#cbd5e1',
        barBorder: '#ffffff',
        legendBg: '#f8fafc'
      },
      ocean: {
        bg: '#ffffff',
        headerBg: '#f0f9ff',
        headerLeftBg: '#e0f2fe',
        yearHeaderBgEven: '#bae6fd',
        yearHeaderBgOdd: '#cffafe',
        monthHeaderBg: '#f0f9ff',
        wpRowBg: '#e0f2fe',
        rowBgEven: '#ffffff',
        rowBgOdd: '#f8fafc',
        gridBorder: '#e0f2fe',
        yearGridBorder: '#7dd3fc',
        quarterGridBorder: '#bae6fd',
        gridLine: '#f0f9ff',
        titleText: '#082f49',
        subtitleText: '#0369a1',
        bodyText: '#0c4a6e',
        metaText: '#0284c7',
        codeBadgeBg: '#e0f2fe',
        codeBadgeBorder: '#bae6fd',
        barBorder: '#ffffff',
        legendBg: '#f0f9ff'
      },
      emerald: {
        bg: '#ffffff',
        headerBg: '#f0fdf4',
        headerLeftBg: '#dcfce7',
        yearHeaderBgEven: '#bbf7d0',
        yearHeaderBgOdd: '#d1fae5',
        monthHeaderBg: '#f0fdf4',
        wpRowBg: '#dcfce7',
        rowBgEven: '#ffffff',
        rowBgOdd: '#f9fdfa',
        gridBorder: '#dcfce7',
        yearGridBorder: '#86efac',
        quarterGridBorder: '#bbf7d0',
        gridLine: '#f0fdf4',
        titleText: '#052e16',
        subtitleText: '#15803d',
        bodyText: '#166534',
        metaText: '#16a34a',
        codeBadgeBg: '#dcfce7',
        codeBadgeBorder: '#bbf7d0',
        barBorder: '#ffffff',
        legendBg: '#f0fdf4'
      },
      monochrome: {
        bg: '#ffffff',
        headerBg: '#f4f4f5',
        headerLeftBg: '#e4e4e7',
        yearHeaderBgEven: '#d4d4d8',
        yearHeaderBgOdd: '#e4e4e7',
        monthHeaderBg: '#f4f4f5',
        wpRowBg: '#e4e4e7',
        rowBgEven: '#ffffff',
        rowBgOdd: '#fafafa',
        gridBorder: '#d4d4d8',
        yearGridBorder: '#71717a',
        quarterGridBorder: '#a1a1aa',
        gridLine: '#e4e4e7',
        titleText: '#18181b',
        subtitleText: '#3f3f46',
        bodyText: '#27272a',
        metaText: '#52525b',
        codeBadgeBg: '#f4f4f5',
        codeBadgeBorder: '#d4d4d8',
        barBorder: '#18181b',
        legendBg: '#f4f4f5'
      },
      dark: {
        bg: '#0f172a',
        headerBg: '#1e293b',
        headerLeftBg: '#1e293b',
        yearHeaderBgEven: '#334155',
        yearHeaderBgOdd: '#293548',
        monthHeaderBg: '#1e293b',
        wpRowBg: '#1e293b',
        rowBgEven: '#0f172a',
        rowBgOdd: '#141e33',
        gridBorder: '#334155',
        yearGridBorder: '#64748b',
        quarterGridBorder: '#475569',
        gridLine: '#1e293b',
        titleText: '#f8fafc',
        subtitleText: '#94a3b8',
        bodyText: '#f1f5f9',
        metaText: '#94a3b8',
        codeBadgeBg: '#334155',
        codeBadgeBorder: '#475569',
        barBorder: '#0f172a',
        legendBg: '#1e293b'
      }
    };

    return themes[theme] || themes.academic;
  }

  escapeXML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  truncate(str, maxLen) {
    if (!str) return '';
    if (str.length <= maxLen) return str;
    return str.substring(0, maxLen - 1) + '…';
  }
}
