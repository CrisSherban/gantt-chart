/**
 * Export module: SVG (vector), PDF (vector & high-res), and PNG
 */
import { triggerDownload } from './storage.js';

export function exportSVG(svgElement, filename = 'research-gantt-chart.svg') {
  if (!svgElement) {
    alert('No Gantt chart element found to export.');
    return;
  }

  // Clone SVG so we can clean it up for standalone export
  const clone = svgElement.cloneNode(true);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

  // Embed default font styles to guarantee standalone rendering
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    text {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    .gantt-tooltip { display: none !important; }
    .resize-handle { display: none !important; }
  `;
  const defs = clone.querySelector('defs') || clone.insertBefore(document.createElementNS('http://www.w3.org/2000/svg', 'defs'), clone.firstChild);
  defs.appendChild(styleEl);

  // Remove interactive-only elements
  clone.querySelectorAll('.resize-handle').forEach(el => el.remove());

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
    alert('No Gantt chart element found to export.');
    return;
  }

  const viewBox = svgElement.viewBox.baseVal;
  const width = viewBox ? viewBox.width : svgElement.clientWidth || 1200;
  const height = viewBox ? viewBox.height : svgElement.clientHeight || 800;

  // Clone SVG and temporarily attach to body (hidden) for accurate SVG bounding boxes
  const clone = svgElement.cloneNode(true);
  clone.querySelectorAll('.resize-handle').forEach(el => el.remove());
  clone.style.position = 'fixed';
  clone.style.top = '-99999px';
  clone.style.left = '-99999px';
  clone.style.opacity = '0';
  clone.style.pointerEvents = 'none';
  document.body.appendChild(clone);

  const hasJsPdf = typeof window.jspdf !== 'undefined';

  try {
    // 1. Try vector PDF via svg2pdf if available
    if (hasJsPdf && typeof window.svg2pdf === 'function') {
      try {
        const { jsPDF } = window.jspdf;
        const orientation = width > height ? 'landscape' : 'portrait';
        const pdf = new jsPDF({
          orientation,
          unit: 'pt',
          format: [width, height]
        });

        await window.svg2pdf(clone, pdf, {
          x: 0,
          y: 0,
          width: width,
          height: height
        });

        document.body.removeChild(clone);
        pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
        return;
      } catch (vectorErr) {
        console.warn('Vector svg2pdf encountered an issue, falling back to high-res canvas PDF:', vectorErr);
      }
    }

    // 2. High-DPI Canvas fallback to jsPDF (300 DPI publication quality)
    if (hasJsPdf) {
      const bgColor = svgElement.getAttribute('style')?.match(/background-color:\s*([^;]+)/)?.[1] || '#ffffff';
      const canvas = await renderSvgToCanvas(clone, width, height, 2.5, bgColor);
      const { jsPDF } = window.jspdf;
      const orientation = width > height ? 'landscape' : 'portrait';
      const pdf = new jsPDF({
        orientation,
        unit: 'pt',
        format: [width, height]
      });

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, width, height);
      document.body.removeChild(clone);
      pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
      return;
    }
  } catch (err) {
    console.error('PDF export failed:', err);
    if (clone.parentNode) document.body.removeChild(clone);
  }

  if (clone.parentNode) document.body.removeChild(clone);

  // 3. Last fallback: browser print-to-pdf
  alert('Exporting via browser Print dialog. Please select "Save as PDF" and choose Landscape orientation.');
  window.print();
}

export async function exportPNG(svgElement, filename = 'research-gantt-chart.png', scale = 2.5) {
  if (!svgElement) return;

  const viewBox = svgElement.viewBox.baseVal;
  const width = viewBox ? viewBox.width : svgElement.clientWidth || 1200;
  const height = viewBox ? viewBox.height : svgElement.clientHeight || 800;

  const clone = svgElement.cloneNode(true);
  clone.querySelectorAll('.resize-handle').forEach(el => el.remove());

  const bgColor = svgElement.getAttribute('style')?.match(/background-color:\s*([^;]+)/)?.[1] || '#ffffff';

  try {
    const canvas = await renderSvgToCanvas(clone, width, height, scale, bgColor);
    canvas.toBlob((blob) => {
      if (blob) {
        triggerDownload(blob, filename.endsWith('.png') ? filename : `${filename}.png`);
      }
    }, 'image/png');
  } catch (e) {
    console.error('PNG export failed:', e);
    alert('Failed to generate PNG image.');
  }
}

function renderSvgToCanvas(svgElement, width, height, scale = 2, bgColor = '#ffffff') {
  return new Promise((resolve, reject) => {
    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(svgElement);
    if (!svgString.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
      svgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);

    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
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
      URL.revokeObjectURL(blobURL);
      reject(e);
    };
    image.src = blobURL;
  });
}
