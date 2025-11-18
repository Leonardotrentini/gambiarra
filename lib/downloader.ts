import axios from 'axios';
import JSZip from 'jszip';
import { ScannedFile } from '@/types';

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

