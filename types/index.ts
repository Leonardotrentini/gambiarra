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

export interface ButtonContent {
  text: string;
  selector: string;
  html: string;
  url: string;
  type?: string;
  classes?: string[];
  href?: string;
}

export interface PixelTracking {
  type: 'facebook' | 'google' | 'tiktok' | 'pinterest' | 'linkedin' | 'other';
  code: string;
  selector: string;
  html: string;
  url: string;
  id?: string;
}

export interface ContentAnalysis {
  buttons: ButtonContent[];
  pixels: PixelTracking[];
  url: string;
}

export interface ButtonReplacement {
  url: string;
  selector: string;
  newText: string;
  newHref?: string;
}

export interface PixelReplacement {
  url: string;
  selector: string;
  pixelType: string;
  newPixelHtml?: string;
  newPixelToken?: string;
  action?: 'replace' | 'remove';
}

export interface Replacements {
  buttons: ButtonReplacement[];
  pixels: PixelReplacement[];
}

