# ResearchGantt 📊

> **A modern, publication-grade web application for creating interactive Gantt charts tailored for research proposals, grant agreements, PhD roadmaps, and multi-partner project organizations.**

Built with standard HTML5, CSS3, and ES6 JavaScript. **100% client-side**, zero build steps, zero external dependencies required for core functionality, and **fully compatible with GitHub Pages**.

![License: BSD-3-Clause](https://img.shields.io/badge/License-BSD_3--Clause-blue.svg)
![GitHub Pages Ready](https://img.shields.io/badge/Deployment-GitHub%20Pages-brightgreen.svg)
![Vector SVG & PDF](https://img.shields.io/badge/Export-SVG%20%7C%20PDF%20%7C%20PNG-purple.svg)

---

## ✨ Features

### 🎓 Designed for Research Proposals & Grant Structures
- **Work Packages (WPs)**: Group tasks under distinct Work Packages with customizable color coding and collapsible sections.
- **Tasks, Milestones & Deliverables**:
  - **Research Tasks**: Rounded bars with optional completion progress fill (`%`).
  - **Milestones**: Distinct diamond markers (`◆`) for decision checkpoints and stage gates.
  - **Deliverables**: Hexagonal output badges for technical reports, datasets, and code releases.
- **Flexible Timeline Conventions**:
  - **Project Months (`M1 – M36`)**: The standard convention for EU Horizon Europe, NSF, NIH, and EPSRC research proposals.
  - **Calendar Dates (`Jan 2026 – Dec 2028`)**: Real calendar timeline mapped with month names and year headers.
  - **Quarters & Years (`Q1 Y1 – Q4 Y3`)**: High-level reporting and corporate R&D roadmaps.

### 📐 Publication-Grade Vector & PDF Export
- **Vector SVG Export (`.svg`)**:
  - Standalone XML vector file with embedded styling.
  - Infinite zoom with zero pixelation.
  - Ready for inclusion in **LaTeX** (`\includesvg`), **Adobe Illustrator**, **Inkscape**, and **Figma**.
- **PDF Document Export (`.pdf`)**:
  - Generates publication-ready landscape PDF documents via `jsPDF` and `svg2pdf`.
  - Ready for direct attachment to grant proposals or print submissions.
- **High-Res Retina PNG (`.png`)**:
  - 2.5× Retina resolution with solid background for presentations (PowerPoint, Google Slides, Keynote).
- **Print / System PDF**:
  - Custom `@media print` stylesheet formatted for crisp landscape printing.

### 🖱️ Fluid Interactive Timeline
- **Interactive Drag & Drop**: Click and drag any task bar along the timeline to reschedule start and end months.
- **Right-Edge Duration Resizing**: Drag the right edge of any task bar to extend or shorten its duration.
- **Collapsible Work Packages**: Click any Work Package header row to collapse or expand its items.
- **Rich Hover Tooltips**: Inspect task titles, duration, responsible leads, progress, and descriptions at a glance.
- **Timeline Zoom**: Zoom in/out to adjust column width for short or multi-year projects.

### 💾 Data Portability
- **Auto-Save**: Changes persist automatically to browser `localStorage`.
- **JSON Save & Load**: Export complete project state as a `.json` file to version control, back up, or share with co-investigators.
- **CSV Import & Export**: Export task tables to CSV or import tasks from spreadsheets (Excel, Google Sheets).

### 🎨 Themes
- **Academic Clean**: Classic navy, teal, and slate palette tailored for scientific proposals.
- **Ocean Blue**: Contemporary cool-blue tech theme.
- **Emerald Sage**: Organic greens and gold.
- **Monochrome Print**: High-contrast grayscale with distinct hatching, perfect for black-and-white printouts and peer-reviewed journals.
- **Dark Studio**: Sleek dark mode for high-contrast presentations.

### 📦 Ready-to-Use Presets
1. **EU Horizon Europe / NSF Research Project (36 Months)**: 5 Work Packages, SOTA benchmarks, distributed toolchain, pilot trials, ethics, and dissemination.
2. **Doctoral Research Roadmap (48 Months)**: 4-Year PhD dissertation timeline covering coursework, proposal, empirical evaluation, journals, and defense.
3. **Translational DeepTech R&D (18 Months)**: Prototype development, optoelectronics, clinical testing, and commercialization.
4. **Blank Project**: Clean slate to start your own organization structure.

---

## 🚀 Live Demo & GitHub Pages Deployment

### Deploying to GitHub Pages in 30 Seconds
1. Push this repository to GitHub:
   ```bash
   git add .
   git commit -m "Add Research Gantt web application"
   git push origin main
   ```
2. On GitHub, navigate to **Settings** > **Pages**.
3. Under **Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: `main` / folder: `/ (root)`
4. Click **Save**. Your app will be live at `https://<your-username>.github.io/gantt-chart/`!

### Running Locally
Because ResearchGantt uses native ES6 JavaScript modules, serve it using any local static file server:

```bash
# Python 3
python3 -m http.server 8000

# Open in browser:
# http://localhost:8000
```

---

## 📁 Project Architecture

```
gantt-chart/
├── index.html          # Application UI, modals, toolbar, and semantic markup
├── css/
│   ├── style.css       # Layout, sidebar tabs, cards, responsive & print CSS
│   └── gantt.css       # SVG styling, hover tooltips, and interactive cursor states
├── js/
│   ├── app.js          # Controller: UI events, search, modals, stats calculation
│   ├── gantt.js        # SVG Engine: coordinate math, timeline rendering, drag & resize
│   ├── presets.js      # Built-in research grant and project templates
│   ├── export.js       # Vector SVG, jsPDF/svg2pdf vector PDF, and Retina PNG exporters
│   └── storage.js      # LocalStorage, JSON import/export, and CSV import/export
├── assets/
│   └── favicon.svg     # Gantt chart favicon
└── README.md           # Documentation
```

---

## 📄 License
This project is open-source under the [BSD 3-Clause License](LICENSE).
