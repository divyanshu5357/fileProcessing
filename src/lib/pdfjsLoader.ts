// Safe browser dynamic loader for PDF.js (prevents Turbopack/Next.js 'canvas' binary build errors)
let pdfjsPromise: Promise<any> | null = null;

export async function getPdfJs(): Promise<any> {
  if (typeof window === 'undefined') {
    throw new Error('PDF.js is only available in browser environments');
  }

  if ((window as any).pdfjsLib) {
    return (window as any).pdfjsLib;
  }

  if (!pdfjsPromise) {
    pdfjsPromise = new Promise((resolve, reject) => {
      // Check if script is already injected
      const existingScript = document.querySelector('script[src*="pdf.min.js"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => {
          const pdfjs = (window as any).pdfjsLib;
          if (pdfjs) {
            pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            resolve(pdfjs);
          } else {
            reject(new Error('Failed to initialize PDF.js'));
          }
        });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.async = true;
      script.onload = () => {
        const pdfjs = (window as any).pdfjsLib;
        if (pdfjs) {
          pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          resolve(pdfjs);
        } else {
          reject(new Error('PDF.js failed to attach to window'));
        }
      };
      script.onerror = (e) => reject(new Error('Failed to load PDF.js engine: ' + e));
      document.head.appendChild(script);
    });
  }

  return pdfjsPromise;
}
