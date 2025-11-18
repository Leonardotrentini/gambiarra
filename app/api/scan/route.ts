import { NextRequest, NextResponse } from 'next/server';
import { DomainCrawler } from '@/lib/crawler';
import { ScanResult } from '@/types';

export const maxDuration = 300; // 5 minutos para operações longas

export async function POST(request: NextRequest) {
  try {
    const { url, maxDepth, maxPages, usePuppeteer } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL é obrigatória' },
        { status: 400 }
      );
    }

    // Validar URL
    let validUrl: string;
    try {
      validUrl = new URL(url).href;
    } catch {
      return NextResponse.json(
        { error: 'URL inválida' },
        { status: 400 }
      );
    }

    const crawler = new DomainCrawler(validUrl, {
      maxDepth: maxDepth || 5,
      maxPages: maxPages || 100,
      usePuppeteer: usePuppeteer !== false,
    });

    const files = await crawler.scan();

    // Calcular estatísticas
    const categories: Record<string, number> = {};
    let totalSize = 0;

    files.forEach((file) => {
      categories[file.category] = (categories[file.category] || 0) + 1;
      if (file.size) totalSize += file.size;
    });

    const result: ScanResult = {
      files,
      domain: new URL(validUrl).hostname,
      totalFiles: files.length,
      totalSize,
      categories,
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erro no escaneamento:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao escanear domínio' },
      { status: 500 }
    );
  }
}

