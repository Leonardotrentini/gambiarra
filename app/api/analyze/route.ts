import { NextRequest, NextResponse } from 'next/server';
import { ContentAnalyzer } from '@/lib/content-analyzer';

export const maxDuration = 60; // 1 minuto para análise

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

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

    const analysis = await ContentAnalyzer.analyzePage(validUrl);

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error('Erro na análise:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao analisar conteúdo' },
      { status: 500 }
    );
  }
}

