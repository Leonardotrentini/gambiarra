import { NextRequest, NextResponse } from 'next/server';
import { FileDownloader } from '@/lib/downloader';
import { ScannedFile, Replacements, PixelReplacementMapValue } from '@/types';
import { ContentAnalyzer } from '@/lib/content-analyzer';
import axios from 'axios';

export const maxDuration = 300; // 5 minutos

export async function POST(request: NextRequest) {
  try {
    const { files, replacements } = await request.json();

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: 'Lista de arquivos é obrigatória' },
        { status: 400 }
      );
    }

    const scannedFiles: ScannedFile[] = files;
    const replacementsData: Replacements = replacements || { buttons: [], pixels: [] };

    // Agrupar substituições por URL
    const buttonReplacementsByUrl = new Map<string, Array<{ selector: string; newText: string; newHref?: string }>>();
    const pixelReplacementsByUrl = new Map<string, Array<PixelReplacementMapValue>>();

    replacementsData.buttons.forEach(replacement => {
      if (!buttonReplacementsByUrl.has(replacement.url)) {
        buttonReplacementsByUrl.set(replacement.url, []);
      }
      buttonReplacementsByUrl.get(replacement.url)!.push({
        selector: replacement.selector,
        newText: replacement.newText,
        newHref: replacement.newHref,
      });
    });

    replacementsData.pixels.forEach(replacement => {
      if (!pixelReplacementsByUrl.has(replacement.url)) {
        pixelReplacementsByUrl.set(replacement.url, []);
      }
      // Criar objeto com tipo explícito para evitar erro de inferência do TypeScript
      const pixelReplacement: PixelReplacementMapValue = {
        selector: replacement.selector,
        pixelType: replacement.pixelType,
        newPixelHtml: replacement.newPixelHtml,
        newPixelToken: replacement.newPixelToken,
        action: replacement.action || 'replace',
      };
      pixelReplacementsByUrl.get(replacement.url)!.push(pixelReplacement);
    });

    // Baixar e processar arquivos com substituições
    const zipBuffer = await FileDownloader.downloadAllAsZipWithReplacements(
      scannedFiles,
      buttonReplacementsByUrl,
      pixelReplacementsByUrl
    );

    const domain = new URL(scannedFiles[0].url).hostname;
    
    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${domain}-wordpress-ready.zip"`,
      },
    });
  } catch (error: any) {
    console.error('Erro no download com substituições:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao gerar ZIP com substituições' },
      { status: 500 }
    );
  }
}

