export interface MammothResult {
  value: string;
  messages: Array<{
    type: string;
    message: string;
  }>;
}

export interface MammothOptions {
  arrayBuffer: ArrayBuffer;
}

export interface Html2PdfOptions {
  margin?: number | number[];
  filename?: string;
  image?: { type?: string; quality?: number };
  enableLinks?: boolean;
  html2canvas?: {
    scale?: number;
    useCORS?: boolean;
    logging?: boolean;
    letterRendering?: boolean;
  };
  jsPDF?: {
    unit?: string;
    format?: string | number[];
    orientation?: "portrait" | "landscape";
  };
  pagebreak?: {
    mode?: string | string[];
    before?: string | string[];
    after?: string | string[];
    avoid?: string | string[];
  };
}

export interface Html2PdfInstance {
  set: (options: Html2PdfOptions) => Html2PdfInstance;
  from: (element: HTMLElement | string) => Html2PdfInstance;
  toPdf: () => Html2PdfInstance;
  get: (type: string) => Promise<any>;
  save: (filename?: string) => Promise<void>;
  outputPdf: (type: "blob" | "dataurlstring" | "arraybuffer") => Promise<any>;
}

declare global {
  interface Window {
    mammoth?: {
      convertToHtml: (options: MammothOptions) => Promise<MammothResult>;
    };
    html2pdf?: (element?: HTMLElement, options?: Html2PdfOptions) => Html2PdfInstance;
  }
}
