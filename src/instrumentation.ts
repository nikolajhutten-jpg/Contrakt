/**
 * Next.js instrumentation hook — runs once at server startup before any request.
 *
 * pdfjs-dist (used by pdf-parse) references DOMMatrix, ImageData, and Path2D
 * at module evaluation time. These are browser APIs not available in Node.js.
 * Providing minimal stubs here prevents the module from crashing on load.
 * The stubs are sufficient for text extraction — canvas rendering is never used.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const g = globalThis as Record<string, unknown>;
    if (!g.DOMMatrix) g.DOMMatrix = class DOMMatrix {};
    if (!g.ImageData) g.ImageData = class ImageData {};
    if (!g.Path2D) g.Path2D = class Path2D {};
  }
}
