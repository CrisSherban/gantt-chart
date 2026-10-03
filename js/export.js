/**
 * Robust Export Module for SVG (vector), PDF (high-resolution landscape), and PNG
 */
import { triggerDownload } from './storage.js';

export function exportSVG(svgElement, filename = 'research-gantt-chart.svg') {
  if (!svgElement) {
    alert('No Gantt chart element found to export.');
    return;
  }

  const clone = svgElement.cloneNode(true);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

  // Embed default font styles
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    text {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    .gantt-tooltip { display: none !important; }
    .resize-handle { display: none !important; }
    .edit-pencil-icon { display: none !important; }
  `;
  const defs = clone.querySelector('defs') || clone.insertBefore(document.createElementNS('http://www.w3.org/2000/svg', 'defs'), clone.firstChild);
  defs.appendChild(styleEl);

  // Remove interactive UI controls
  clone.querySelectorAll('.resize-handle, .edit-pencil-icon').forEach(el => el.remove());

  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(clone);

  // Ensure XML namespace
  if (!svgString.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
    svgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  // Add XML declaration
  svgString = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgString;

  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  triggerDownload(blob, filename.endsWith('.svg') ? filename : `${filename}.svg`);
}

export async function exportPDF(svgElement, filename = 'research-gantt-chart.pdf') {
  if (!svgElement) {
    alert('No Gantt chart found to export.');
    return;
  }

  const btn = document.getElementById('btn-export-pdf');
  const origBtnText = btn ? btn.innerHTML : '';
  if (btn) btn.innerHTML = `<span>⏳ Generating PDF...</span>`;

  try {
    const viewBox = svgElement.viewBox.baseVal;
    const width = Math.round(viewBox ? viewBox.width : (svgElement.clientWidth || 1200));
    const height = Math.round(viewBox ? viewBox.height : (svgElement.clientHeight || 800));

    // Clone and prepare SVG
    const clone = svgElement.cloneNode(true);
    clone.querySelectorAll('.resize-handle, .edit-pencil-icon').forEach(el => el.remove());
    
    // Explicit SVG dimensions
    clone.setAttribute('width', width);
    clone.setAttribute('height', height);

    const bgColor = svgElement.getAttribute('style')?.match(/background-color:\s*([^;]+)/)?.[1] || '#ffffff';

    // Render at 2.5x for crisp 300 DPI print quality
    const canvas = await renderSvgToCanvas(clone, width, height, 2.5, bgColor);

    // Verify jsPDF is loaded
    if (typeof window.jspdf !== 'undefined') {
      const { jsPDF } = window.jspdf;
      const isLandscape = width >= height;

      // In jsPDF, when orientation is landscape, format width should be larger than height
      const pageW = Math.max(width, height);
      const pageH = Math.min(width, height);

      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'pt',
        format: isLandscape ? [pageW, pageH] : [pageH, pageW]
      });

      const actualW = pdf.internal.pageSize.getWidth();
      const actualH = pdf.internal.pageSize.getHeight();

      const imgData = canvas.toDataURL('image/png', 1.0);
      pdf.addImage(imgData, 'PNG', 0, 0, actualW, actualH, undefined, 'FAST');
      pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
    } else {
      // Fallback if jsPDF CDN was blocked
      window.print();
    }
  } catch (err) {
    console.error('PDF export error:', err);
    alert('Could not generate PDF directly. Opening print dialog to Save as PDF...');
    window.print();
  } finally {
    if (btn) btn.innerHTML = origBtnText;
  }
}

export async function exportPNG(svgElement, filename = 'research-gantt-chart.png', scale = 2.5) {
  if (!svgElement) return;

  const btn = document.getElementById('btn-export-png');
  const origBtnText = btn ? btn.innerHTML : '';
  if (btn) btn.innerHTML = `<span>⏳ Generating PNG...</span>`;

  try {
    const viewBox = svgElement.viewBox.baseVal;
    const width = Math.round(viewBox ? viewBox.width : (svgElement.clientWidth || 1200));
    const height = Math.round(viewBox ? viewBox.height : (svgElement.clientHeight || 800));

    const clone = svgElement.cloneNode(true);
    clone.querySelectorAll('.resize-handle, .edit-pencil-icon').forEach(el => el.remove());
    clone.setAttribute('width', width);
    clone.setAttribute('height', height);

    const bgColor = svgElement.getAttribute('style')?.match(/background-color:\s*([^;]+)/)?.[1] || '#ffffff';

    const canvas = await renderSvgToCanvas(clone, width, height, scale, bgColor);
    canvas.toBlob((blob) => {
      if (blob) {
        triggerDownload(blob, filename.endsWith('.png') ? filename : `${filename}.png`);
      }
    }, 'image/png');
  } catch (e) {
    console.error('PNG export failed:', e);
    alert('Failed to generate PNG image.');
  } finally {
    if (btn) btn.innerHTML = origBtnText;
  }
}

function renderSvgToCanvas(svgElement, width, height, scale = 2, bgColor = '#ffffff') {
  return new Promise((resolve, reject) => {
    // Clone so we can sanitize for sandboxed SVG image rendering
    const cleanSvg = svgElement.cloneNode(true);

    // Remove any external font @import rules that trigger browser security cross-origin blocking in Image()
    cleanSvg.querySelectorAll('style').forEach(style => {
      style.textContent = style.textContent.replace(/@import[^;]+;/g, '');
    });

    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(cleanSvg);

    if (!svgString.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
      svgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);

    const image = new Image();
    image.crossOrigin = 'anonymous';

    const timer = setTimeout(() => {
      URL.revokeObjectURL(blobURL);
      reject(new Error('SVG image rendering timed out'));
    }, 8000);

    image.onload = () => {
      clearTimeout(timer);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const ctx = canvas.getContext('2d');

      // Solid background fill so output isn't transparent
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.scale(scale, scale);
      ctx.drawImage(image, 0, 0, width, height);

      URL.revokeObjectURL(blobURL);
      resolve(canvas);
    };

    image.onerror = (e) => {
      clearTimeout(timer);
      URL.revokeObjectURL(blobURL);
      reject(new Error('Failed to load SVG into Canvas: ' + (e?.message || 'sandbox error')));
    };

    image.src = blobURL;
  });
}
