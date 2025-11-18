import axios from 'axios';
import JSZip from 'jszip';
import { ScannedFile } from '@/types';
import { ContentAnalyzer } from './content-analyzer';

export class FileDownloader {
  static async downloadFile(url: string): Promise<Buffer> {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      return Buffer.from(response.data);
    } catch (error) {
      throw new Error(`Erro ao baixar ${url}: ${error}`);
    }
  }

  static async downloadFileAsText(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        validateStatus: (status) => status < 400,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Erro ao baixar ${url}: ${error}`);
    }
  }

  static async downloadAllAsZip(files: ScannedFile[]): Promise<Buffer> {
    const zip = new JSZip();
    const domain = new URL(files[0]?.url || '').hostname;

    console.log(`Criando ZIP com ${files.length} arquivos...`);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        console.log(`Baixando ${i + 1}/${files.length}: ${file.path}`);
        const buffer = await this.downloadFile(file.url);
        
        // Criar estrutura de pastas no ZIP
        const zipPath = file.path.startsWith('/') ? file.path.slice(1) : file.path;
        zip.file(zipPath, buffer);
      } catch (error) {
        console.error(`Erro ao baixar ${file.url}:`, error);
        // Continuar mesmo se um arquivo falhar
      }
    }

    return await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  }

  static async downloadAllAsZipWithReplacements(
    files: ScannedFile[],
    buttonReplacements: Map<string, Array<{ selector: string; newText: string; newHref?: string }>>,
    pixelReplacements: Map<string, Array<{ selector: string; pixelType: string; newPixelHtml?: string; newPixelToken?: string; action?: 'replace' | 'remove' }>>
  ): Promise<Buffer> {
    const zip = new JSZip();
    const domain = new URL(files[0]?.url || '').hostname;

    console.log(`Criando ZIP com ${files.length} arquivos e substituições aplicadas...`);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        console.log(`Processando ${i + 1}/${files.length}: ${file.path}`);

        // Se for arquivo HTML, aplicar substituições
        if (file.category === 'html' || file.mimeType === 'text/html') {
          let htmlContent = await this.downloadFileAsText(file.url);
          
          // Aplicar substituições de botões
          if (buttonReplacements.has(file.url)) {
            const buttonRepls = buttonReplacements.get(file.url)!;
            for (const repl of buttonRepls) {
              htmlContent = ContentAnalyzer.replaceButtonText(
                htmlContent,
                repl.selector,
                repl.newText,
                repl.newHref
              );
            }
          }

          // Aplicar substituições/remoções de pixels
          if (pixelReplacements.has(file.url)) {
            const pixelRepls = pixelReplacements.get(file.url)!;
            for (const repl of pixelRepls) {
              if (repl.action === 'remove') {
                htmlContent = ContentAnalyzer.removePixel(htmlContent, repl.selector);
              } else {
                htmlContent = ContentAnalyzer.replacePixel(
                  htmlContent,
                  repl.selector,
                  repl.pixelType,
                  repl.newPixelHtml,
                  repl.newPixelToken
                );
              }
            }
          }

          // Converter HTML modificado para buffer
          const buffer = Buffer.from(htmlContent, 'utf-8');
          const zipPath = file.path.startsWith('/') ? file.path.slice(1) : file.path;
          zip.file(zipPath, buffer);
        } else {
          // Para arquivos não-HTML, baixar normalmente
          const buffer = await this.downloadFile(file.url);
          const zipPath = file.path.startsWith('/') ? file.path.slice(1) : file.path;
          zip.file(zipPath, buffer);
        }
      } catch (error) {
        console.error(`Erro ao processar ${file.url}:`, error);
        // Continuar mesmo se um arquivo falhar
      }
    }

    return await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  }

  static getFileNameFromPath(path: string): string {
    const parts = path.split('/');
    return parts[parts.length - 1] || 'index.html';
  }

  static getFileExtension(path: string): string {
    const fileName = this.getFileNameFromPath(path);
    const parts = fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : '';
  }
}

