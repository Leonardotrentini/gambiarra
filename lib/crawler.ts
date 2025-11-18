import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { ScannedFile } from '@/types';

export class DomainCrawler {
  private baseUrl: string;
  private domain: string;
  private visitedUrls: Set<string> = new Set();
  private foundFiles: Map<string, ScannedFile> = new Map();
  private maxDepth: number = 5;
  private maxPages: number = 100;
  private usePuppeteer: boolean = true;

  constructor(baseUrl: string, options?: { maxDepth?: number; maxPages?: number; usePuppeteer?: boolean }) {
    this.baseUrl = baseUrl;
    const urlObj = new URL(baseUrl);
    this.domain = urlObj.origin;
    this.maxDepth = options?.maxDepth || 5;
    this.maxPages = options?.maxPages || 100;
    this.usePuppeteer = options?.usePuppeteer !== false;
  }

  private normalizeUrl(url: string): string {
    try {
      if (url.startsWith('//')) {
        url = `https:${url}`;
      } else if (url.startsWith('/')) {
        url = `${this.domain}${url}`;
      } else if (!url.startsWith('http')) {
        url = `${this.domain}/${url}`;
      }
      const urlObj = new URL(url);
      // Remove fragmentos e queries desnecessárias
      urlObj.hash = '';
      return urlObj.href;
    } catch {
      return '';
    }
  }

  private isSameDomain(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.origin === this.domain;
    } catch {
      return false;
    }
  }

  private getFileCategory(url: string, mimeType?: string): ScannedFile['category'] {
    const extension = url.split('.').pop()?.toLowerCase() || '';
    
    if (mimeType) {
      if (mimeType.startsWith('text/html')) return 'html';
      if (mimeType.startsWith('text/css')) return 'css';
      if (mimeType.includes('javascript') || mimeType.includes('json')) return 'js';
      if (mimeType.startsWith('image/')) return 'image';
      if (mimeType.startsWith('font/') || mimeType.includes('font')) return 'font';
      if (mimeType.startsWith('video/')) return 'video';
      if (mimeType.startsWith('audio/')) return 'audio';
      if (mimeType.includes('pdf') || mimeType.includes('document')) return 'document';
    }

    const htmlExts = ['html', 'htm'];
    const cssExts = ['css'];
    const jsExts = ['js', 'jsx', 'ts', 'tsx', 'json'];
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'ico', 'bmp'];
    const fontExts = ['woff', 'woff2', 'ttf', 'otf', 'eot'];
    const videoExts = ['mp4', 'webm', 'ogg', 'avi', 'mov'];
    const audioExts = ['mp3', 'wav', 'ogg', 'm4a'];
    const docExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx'];

    if (htmlExts.includes(extension)) return 'html';
    if (cssExts.includes(extension)) return 'css';
    if (jsExts.includes(extension)) return 'js';
    if (imageExts.includes(extension)) return 'image';
    if (fontExts.includes(extension)) return 'font';
    if (videoExts.includes(extension)) return 'video';
    if (audioExts.includes(extension)) return 'audio';
    if (docExts.includes(extension)) return 'document';

    return 'other';
  }

  private extractPathFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname || '/';
    } catch {
      return url;
    }
  }

  private async fetchWithAxios(url: string): Promise<{ content: string; mimeType?: string } | null> {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        maxRedirects: 5,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        responseType: 'text',
        validateStatus: (status) => status < 400,
      });
      return {
        content: response.data,
        mimeType: response.headers['content-type']?.split(';')[0],
      };
    } catch (error) {
      console.error(`Erro ao buscar ${url}:`, error);
      return null;
    }
  }

  private async fetchWithPuppeteer(url: string): Promise<{ content: string; mimeType?: string } | null> {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      const content = await page.content();
      await browser.close();
      return { content, mimeType: 'text/html' };
    } catch (error) {
      if (browser) await browser.close();
      console.error(`Erro ao buscar com Puppeteer ${url}:`, error);
      return null;
    }
  }

  private extractFilesFromHtml(html: string, baseUrl: string): string[] {
    const $ = cheerio.load(html);
    const files: string[] = [];

    // Links
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) files.push(this.normalizeUrl(href));
    });

    // Scripts
    $('script[src]').each((_, el) => {
      const src = $(el).attr('src');
      if (src) files.push(this.normalizeUrl(src));
    });

    // Stylesheets
    $('link[rel="stylesheet"], link[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) files.push(this.normalizeUrl(href));
    });

    // Imagens
    $('img[src], img[data-src], img[data-lazy-src]').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src');
      if (src) files.push(this.normalizeUrl(src));
    });

    // Background images em CSS inline
    $('[style*="background-image"]').each((_, el) => {
      const style = $(el).attr('style') || '';
      const match = style.match(/url\(['"]?([^'"]+)['"]?\)/);
      if (match?.[1]) files.push(this.normalizeUrl(match[1]));
    });

    // Fontes
    $('link[rel*="font"], link[href*="font"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) files.push(this.normalizeUrl(href));
    });

    // Vídeos e áudios
    $('video[src], audio[src], source[src]').each((_, el) => {
      const src = $(el).attr('src');
      if (src) files.push(this.normalizeUrl(src));
    });

    // Favicons
    $('link[rel*="icon"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) files.push(this.normalizeUrl(href));
    });

    return files;
  }

  private async processFile(url: string): Promise<void> {
    if (this.foundFiles.has(url)) return;

    const normalizedUrl = this.normalizeUrl(url);
    if (!this.isSameDomain(normalizedUrl)) return;

    try {
      // Tentar obter informações do arquivo
      const response = await axios.head(normalizedUrl, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        validateStatus: () => true,
      });

      const mimeType = response.headers['content-type']?.split(';')[0];
      const contentLength = parseInt(response.headers['content-length'] || '0', 10);
      const category = this.getFileCategory(normalizedUrl, mimeType);

      const file: ScannedFile = {
        url: normalizedUrl,
        path: this.extractPathFromUrl(normalizedUrl),
        type: mimeType || 'unknown',
        size: contentLength || undefined,
        mimeType,
        category,
      };

      this.foundFiles.set(normalizedUrl, file);
    } catch (error) {
      // Se HEAD falhar, ainda adiciona o arquivo com informações básicas
      const category = this.getFileCategory(normalizedUrl);
      const file: ScannedFile = {
        url: normalizedUrl,
        path: this.extractPathFromUrl(normalizedUrl),
        type: 'unknown',
        category,
      };
      this.foundFiles.set(normalizedUrl, file);
    }
  }

  private async crawlPage(url: string, depth: number = 0): Promise<void> {
    if (depth > this.maxDepth) return;
    if (this.visitedUrls.size >= this.maxPages) return;

    const normalizedUrl = this.normalizeUrl(url);
    if (!this.isSameDomain(normalizedUrl)) return;
    if (this.visitedUrls.has(normalizedUrl)) return;

    this.visitedUrls.add(normalizedUrl);

    try {
      let result;
      if (this.usePuppeteer && depth === 0) {
        // Usar Puppeteer apenas na primeira página para renderizar JS
        result = await this.fetchWithPuppeteer(normalizedUrl);
      } else {
        result = await this.fetchWithAxios(normalizedUrl);
      }

      if (!result) return;

      // Adicionar a própria página como arquivo HTML
      const htmlFile: ScannedFile = {
        url: normalizedUrl,
        path: this.extractPathFromUrl(normalizedUrl),
        type: 'text/html',
        mimeType: 'text/html',
        category: 'html',
      };
      this.foundFiles.set(normalizedUrl, htmlFile);

      // Extrair arquivos do HTML
      const files = this.extractFilesFromHtml(result.content, normalizedUrl);
      
      // Processar arquivos encontrados
      for (const fileUrl of files) {
        await this.processFile(fileUrl);
      }

      // Extrair links para páginas HTML e continuar crawling
      const $ = cheerio.load(result.content);
      const links: string[] = [];
      $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        if (href) {
          const linkUrl = this.normalizeUrl(href);
          if (this.isSameDomain(linkUrl) && !this.visitedUrls.has(linkUrl)) {
            links.push(linkUrl);
          }
        }
      });

      // Continuar crawling recursivamente
      for (const link of links.slice(0, 10)) { // Limitar links por página
        if (this.visitedUrls.size >= this.maxPages) break;
        await this.crawlPage(link, depth + 1);
      }
    } catch (error) {
      console.error(`Erro ao fazer crawl de ${normalizedUrl}:`, error);
    }
  }

  async scan(): Promise<ScannedFile[]> {
    console.log(`Iniciando escaneamento de ${this.baseUrl}...`);
    await this.crawlPage(this.baseUrl);
    console.log(`Escaneamento concluído. ${this.foundFiles.size} arquivos encontrados.`);
    return Array.from(this.foundFiles.values());
  }
}

