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
    scrollX?: number;
    scrollY?: number;
    windowWidth?: number;
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

export interface DocxPreviewOptions {
  className?: string;
  inWrapper?: boolean;
  ignoreWidth?: boolean;
  ignoreHeight?: boolean;
  breakPages?: boolean;
  useBase64URL?: boolean;
  renderHeaders?: boolean;
  renderFooters?: boolean;
  renderEndnotes?: boolean;
}

declare global {
  interface Window {
    mammoth?: {
      convertToHtml: (options: MammothOptions) => Promise<MammothResult>;
    };
    html2pdf?: (element?: HTMLElement, options?: Html2PdfOptions) => Html2PdfInstance;
    html2canvas?: (element: HTMLElement, options?: any) => Promise<HTMLCanvasElement>;
    JSZip?: any;
    docx?: {
      renderAsync: (
        data: Blob | ArrayBuffer | Uint8Array,
        bodyContainer: HTMLElement,
        styleContainer?: HTMLElement | null,
        options?: DocxPreviewOptions
      ) => Promise<any>;
    };
  }
}
