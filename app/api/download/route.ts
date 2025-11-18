import { NextRequest, NextResponse } from 'next/server';
import { FileDownloader } from '@/lib/downloader';
import { ScannedFile } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { url, files } = await request.json();

    if (url) {
      // Download de arquivo único
      const buffer = await FileDownloader.downloadFile(url);
      const fileName = FileDownloader.getFileNameFromPath(new URL(url).pathname);
      
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    }

    if (files && Array.isArray(files) && files.length > 0) {
      // Download de múltiplos arquivos como ZIP
      const scannedFiles: ScannedFile[] = files;
      const zipBuffer = await FileDownloader.downloadAllAsZip(scannedFiles);
      const domain = new URL(scannedFiles[0].url).hostname;
      
      return new NextResponse(zipBuffer, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${domain}-files.zip"`,
        },
      });
    }

    return NextResponse.json(
      { error: 'URL ou lista de arquivos é obrigatória' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Erro no download:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao baixar arquivo(s)' },
      { status: 500 }
    );
  }
}

