export interface ScannedFile {
  url: string;
  path: string;
  type: string;
  size?: number;
  mimeType?: string;
  category: 'html' | 'css' | 'js' | 'image' | 'font' | 'video' | 'audio' | 'document' | 'other';
}

export interface ScanProgress {
  status: 'idle' | 'scanning' | 'completed' | 'error';
  totalFiles: number;
  scannedPages: number;
  currentUrl?: string;
  error?: string;
}

export interface ScanResult {
  files: ScannedFile[];
  domain: string;
  totalFiles: number;
  totalSize: number;
  categories: Record<string, number>;
}

