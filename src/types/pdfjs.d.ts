export interface PdfJsTextItem {
  str: string;
  dir?: string;
  width?: number;
  height?: number;
  transform: number[];
  fontName?: string;
  hasEOL?: boolean;
}

export interface PdfJsPage {
  getViewport: (params: { scale: number }) => { width: number; height: number };
  getTextContent: () => Promise<{ items: PdfJsTextItem[] }>;
  render: (params: {
    canvasContext: CanvasRenderingContext2D;
    viewport: { width: number; height: number };
  }) => { promise: Promise<void> };
}

export interface PdfJsDocument {
  numPages: number;
  getPage: (pageNo: number) => Promise<PdfJsPage>;
}

export interface PdfJsLib {
  getDocument: (params: { data: Uint8Array }) => {
    promise: Promise<PdfJsDocument>;
  };
  GlobalWorkerOptions: {
    workerSrc: string;
  };
}

declare global {
  interface Window {
    pdfjsLib?: PdfJsLib;
  }
}
