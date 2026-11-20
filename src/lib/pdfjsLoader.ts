// Safe browser dynamic loader for PDF.js (serves local static bundle first, falls back to CDN)
let pdfjsPromise: Promise<any> | null = null;

export async function getPdfJs(): Promise<any> {
  if (typeof window === 'undefined') {
    throw new Error('PDF.js is only available in browser environments');
  }

  if ((window as any).pdfjsLib) {
    const pdfjs = (window as any).pdfjsLib;
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';
    }
    return pdfjs;
  }

  if (!pdfjsPromise) {
    pdfjsPromise = new Promise((resolve, reject) => {
      // Check if script is already present in document
      const existingScript = document.querySelector('script[src*="pdf.min.js"]') as HTMLScriptElement;
      if (existingScript) {
        if ((window as any).pdfjsLib) {
          const pdfjs = (window as any).pdfjsLib;
          pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';
          resolve(pdfjs);
          return;
        }

        const onLoad = () => {
          const pdfjs = (window as any).pdfjsLib;
          if (pdfjs) {
            pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';
            resolve(pdfjs);
          } else {
            pdfjsPromise = null;
            reject(new Error('Failed to initialize PDF.js'));
          }
        };

        existingScript.addEventListener('load', onLoad);
        existingScript.addEventListener('error', () => {
          // Fall back to CDN
          loadFromCdn().then(resolve).catch(reject);
        });

        setTimeout(() => {
          if ((window as any).pdfjsLib) {
            onLoad();
          }
        }, 150);
        return;
      }

      // Try local static script first
      const script = document.createElement('script');
      script.src = '/pdfjs/pdf.min.js';
      script.async = true;
      script.onload = () => {
        const pdfjs = (window as any).pdfjsLib;
        if (pdfjs) {
          pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';
          resolve(pdfjs);
        } else {
          loadFromCdn().then(resolve).catch(reject);
        }
      };
      script.onerror = () => {
        // Fall back to CDN if local bundle fails
        loadFromCdn().then(resolve).catch(reject);
      };
      document.head.appendChild(script);
    });
  }

  return pdfjsPromise;
}

function loadFromCdn(): Promise<any> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async = true;
    script.onload = () => {
      const pdfjs = (window as any).pdfjsLib;
      if (pdfjs) {
        pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(pdfjs);
      } else {
        reject(new Error('PDF.js failed to load from CDN'));
      }
    };
    script.onerror = (e) => {
      reject(new Error('Failed to load PDF.js engine: ' + e));
    };
    document.head.appendChild(script);
  });
}
