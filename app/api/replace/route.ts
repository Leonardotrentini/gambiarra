import { NextRequest, NextResponse } from 'next/server';
import { ContentAnalyzer } from '@/lib/content-analyzer';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, type, selector, newContent, action, newHref, pixelType, newPixelHtml, newPixelToken } = body;

    if (!url || !selector) {
      return NextResponse.json(
        { error: 'URL e seletor são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar HTML da página
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      validateStatus: (status) => status < 400,
    });

    let modifiedHtml = response.data;

    if (action === 'remove') {
      // Remover elemento (principalmente para pixels)
      modifiedHtml = ContentAnalyzer.removePixel(modifiedHtml, selector);
    } else if (type === 'button') {
      // Substituir texto do botão e/ou link
      if (!newContent) {
        return NextResponse.json(
          { error: 'Novo conteúdo é obrigatório para substituição' },
          { status: 400 }
        );
      }
      modifiedHtml = ContentAnalyzer.replaceButtonText(modifiedHtml, selector, newContent, newHref);
    } else if (type === 'pixel') {
      // Substituir código do pixel
      if (!newPixelHtml && !newPixelToken) {
        return NextResponse.json(
          { error: 'HTML do pixel ou Token/ID da API é obrigatório' },
          { status: 400 }
        );
      }
      
      modifiedHtml = ContentAnalyzer.replacePixel(
        modifiedHtml, 
        selector, 
        pixelType || 'facebook',
        newPixelHtml,
        newPixelToken
      );
    }

    return NextResponse.json({
      success: true,
      modifiedHtml,
      originalUrl: url,
    });
  } catch (error: any) {
    console.error('Erro na substituição:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao substituir conteúdo' },
      { status: 500 }
    );
  }
}

