'use client';

import { useState } from 'react';
import { ScannedFile, ScanResult, ContentAnalysis, ButtonContent, PixelTracking, ButtonReplacement, PixelReplacement, Replacements } from '@/types';

export default function Home() {
  const [url, setUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [contentAnalysis, setContentAnalysis] = useState<ContentAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState<'files' | 'content'>('files');
  const [editingButton, setEditingButton] = useState<string | null>(null);
  const [editingPixel, setEditingPixel] = useState<string | null>(null);
  const [newButtonText, setNewButtonText] = useState('');
  const [newButtonHref, setNewButtonHref] = useState('');
  const [newPixelHtml, setNewPixelHtml] = useState('');
  const [newPixelToken, setNewPixelToken] = useState('');
  const [replacements, setReplacements] = useState<Replacements>({ buttons: [], pixels: [] });

  const categoryLabels: Record<string, string> = {
    html: 'HTML',
    css: 'CSS',
    js: 'JavaScript',
    image: 'Imagens',
    font: 'Fontes',
    video: 'Vídeos',
    audio: 'Áudios',
    document: 'Documentos',
    other: 'Outros',
  };

  const categoryColors: Record<string, string> = {
    html: 'bg-blue-100 text-blue-800',
    css: 'bg-purple-100 text-purple-800',
    js: 'bg-yellow-100 text-yellow-800',
    image: 'bg-green-100 text-green-800',
    font: 'bg-pink-100 text-pink-800',
    video: 'bg-red-100 text-red-800',
    audio: 'bg-indigo-100 text-indigo-800',
    document: 'bg-gray-100 text-gray-800',
    other: 'bg-gray-100 text-gray-800',
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Desconhecido';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const handleScan = async () => {
    if (!url.trim()) {
      setError('Por favor, insira uma URL válida');
      return;
    }

    setScanning(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url.trim(),
          maxDepth: 5,
          maxPages: 100,
          usePuppeteer: true,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Erro ao escanear domínio');
      }

      setResult(responseData);
    } catch (err: any) {
      console.error('Erro no escaneamento:', err);
      setError(err.message || 'Erro ao escanear domínio. Verifique o console para mais detalhes.');
    } finally {
      setScanning(false);
    }
  };

  const handleDownloadFile = async (fileUrl: string, fileName: string) => {
    setDownloading(fileUrl);
    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: fileUrl }),
      });

      if (!response.ok) throw new Error('Erro ao baixar arquivo');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(`Erro ao baixar arquivo: ${err.message}`);
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadAll = async () => {
    if (!result) return;

    setDownloading('all');
    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files: result.files }),
      });

      if (!response.ok) throw new Error('Erro ao baixar arquivos');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${result.domain}-files.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(`Erro ao baixar arquivos: ${err.message}`);
    } finally {
      setDownloading(null);
    }
  };

  const handleAnalyzeContent = async () => {
    if (!url.trim()) {
      setError('Por favor, insira uma URL válida');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setContentAnalysis(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Erro ao analisar conteúdo');
      }

      setContentAnalysis(responseData);
      setActiveTab('content');
    } catch (err: any) {
      console.error('Erro na análise:', err);
      setError(err.message || 'Erro ao analisar conteúdo. Verifique o console para mais detalhes.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReplaceButton = async (button: ButtonContent) => {
    if (!newButtonText.trim()) {
      alert('Por favor, insira o novo texto do botão');
      return;
    }

    try {
      // Verificar se a substituição já existe
      const existingIndex = replacements.buttons.findIndex(
        r => r.url === button.url && r.selector === button.selector
      );

      const buttonReplacement: ButtonReplacement = {
        url: button.url,
        selector: button.selector,
        newText: newButtonText.trim(),
        newHref: newButtonHref.trim() || undefined,
      };

      if (existingIndex >= 0) {
        // Atualizar substituição existente
        const updated = [...replacements.buttons];
        updated[existingIndex] = buttonReplacement;
        setReplacements({ ...replacements, buttons: updated });
      } else {
        // Adicionar nova substituição
        setReplacements({
          ...replacements,
          buttons: [...replacements.buttons, buttonReplacement],
        });
      }

      setEditingButton(null);
      setNewButtonText('');
      setNewButtonHref('');
      alert('Substituição de botão salva! Use o botão "Aplicar Tudo e Baixar ZIP" no topo para gerar o arquivo final.');
    } catch (err: any) {
      alert(`Erro ao salvar substituição: ${err.message}`);
    }
  };

  const handleReplacePixel = async (pixel: PixelTracking) => {
    if (!newPixelHtml.trim() && !newPixelToken.trim()) {
      alert('Por favor, preencha pelo menos o HTML do pixel ou o Token/ID da API');
      return;
    }

    try {
      // Verificar se a substituição já existe
      const existingIndex = replacements.pixels.findIndex(
        r => r.url === pixel.url && r.selector === pixel.selector
      );

      const pixelReplacement: PixelReplacement = {
        url: pixel.url,
        selector: pixel.selector,
        pixelType: pixel.type,
        newPixelHtml: newPixelHtml.trim() || undefined,
        newPixelToken: newPixelToken.trim() || undefined,
      };

      if (existingIndex >= 0) {
        // Atualizar substituição existente
        const updated = [...replacements.pixels];
        updated[existingIndex] = pixelReplacement;
        setReplacements({ ...replacements, pixels: updated });
      } else {
        // Adicionar nova substituição
        setReplacements({
          ...replacements,
          pixels: [...replacements.pixels, pixelReplacement],
        });
      }

      setEditingPixel(null);
      setNewPixelHtml('');
      setNewPixelToken('');
      alert('Substituição de pixel salva! Use o botão "Aplicar Tudo e Baixar ZIP" no topo para gerar o arquivo final.');
    } catch (err: any) {
      alert(`Erro ao salvar substituição: ${err.message}`);
    }
  };

  const handleRemovePixel = async (pixel: PixelTracking) => {
    if (!confirm(`Tem certeza que deseja remover este pixel ${pixel.type}?`)) {
      return;
    }

    try {
      // Verificar se a remoção já existe
      const existingIndex = replacements.pixels.findIndex(
        r => r.url === pixel.url && r.selector === pixel.selector
      );

      const pixelReplacement: PixelReplacement = {
        url: pixel.url,
        selector: pixel.selector,
        pixelType: pixel.type,
        action: 'remove',
      };

      if (existingIndex >= 0) {
        // Atualizar substituição existente para remoção
        const updated = [...replacements.pixels];
        updated[existingIndex] = pixelReplacement;
        setReplacements({ ...replacements, pixels: updated });
      } else {
        // Adicionar nova remoção
        setReplacements({
          ...replacements,
          pixels: [...replacements.pixels, pixelReplacement],
        });
      }

      alert('Remoção de pixel salva! Use o botão "Aplicar Tudo e Baixar ZIP" no topo para gerar o arquivo final.');
    } catch (err: any) {
      alert(`Erro ao salvar remoção: ${err.message}`);
    }
  };

  const filteredFiles = result?.files.filter((file) => {
    const matchesFilter = filter === 'all' || file.category === filter;
    const matchesSearch = searchTerm === '' || 
      file.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.path.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  }) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            🔍 Gambiarra Scraper
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Escaneie e baixe todos os arquivos de um domínio
          </p>
        </header>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 mb-6">
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://exemplo.com"
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              onKeyPress={(e) => e.key === 'Enter' && !scanning && handleScan()}
              disabled={scanning}
            />
            <div className="flex gap-2">
              <button
                onClick={handleScan}
                disabled={scanning || analyzing || !url.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-colors"
              >
                {scanning ? 'Escanando...' : 'Escanear Domínio'}
              </button>
              <button
                onClick={handleAnalyzeContent}
                disabled={scanning || analyzing || !url.trim()}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-colors"
              >
                {analyzing ? 'Analisando...' : '🔍 Analisar Conteúdo'}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {scanning && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-300">
                Escaneando domínio... Isso pode levar alguns minutos.
              </p>
            </div>
          )}

          {analyzing && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-300">
                Analisando conteúdo da página...
              </p>
            </div>
          )}
        </div>

        {(result || contentAnalysis) && (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 mb-6">
              <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setActiveTab('files')}
                  className={`px-4 py-2 font-semibold transition-colors ${
                    activeTab === 'files'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  📁 Arquivos
                </button>
                <button
                  onClick={() => setActiveTab('content')}
                  className={`px-4 py-2 font-semibold transition-colors ${
                    activeTab === 'content'
                      ? 'border-b-2 border-purple-600 text-purple-600'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  🔍 Conteúdo (Botões & Pixels)
                </button>
              </div>
            </div>
          </>
        )}

        {result && activeTab === 'files' && (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Resultados do Escaneamento
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    Domínio: <span className="font-semibold">{result.domain}</span>
                  </p>
                  {(replacements.buttons.length > 0 || replacements.pixels.length > 0) && (
                    <div className="mt-2 text-sm text-purple-600 dark:text-purple-400">
                      ✨ {replacements.buttons.length} botão(ões) e {replacements.pixels.length} pixel(is) prontos para substituição
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleDownloadAll}
                    disabled={downloading === 'all'}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-colors"
                  >
                    {downloading === 'all' ? 'Baixando...' : '📥 Baixar Todos (ZIP)'}
                  </button>
                  <button
                    onClick={handleDownloadWithReplacements}
                    disabled={downloading === 'all-with-replacements' || (replacements.buttons.length === 0 && replacements.pixels.length === 0)}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-colors"
                    title={replacements.buttons.length === 0 && replacements.pixels.length === 0 ? 'Faça substituições primeiro' : `Baixar ZIP com ${replacements.buttons.length} botão(ões) e ${replacements.pixels.length} pixel(is) substituídos`}
                  >
                    {downloading === 'all-with-replacements' ? 'Gerando ZIP...' : '🎨 Baixar ZIP com Substituições'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {result.totalFiles}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Arquivos</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatFileSize(result.totalSize)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Tamanho Total</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {Object.keys(result.categories).length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Categorias</div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {result.files.filter(f => f.category === 'html').length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Páginas</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {Object.entries(result.categories).map(([category, count]) => (
                  <button
                    key={category}
                    onClick={() => setFilter(category)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      filter === category
                        ? categoryColors[category] + ' ring-2 ring-offset-2'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {categoryLabels[category]}: {count}
                  </button>
                ))}
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    filter === 'all'
                      ? 'bg-blue-100 text-blue-800 ring-2 ring-offset-2'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Todos
                </button>
              </div>

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar arquivos..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Arquivos Encontrados ({filteredFiles.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">
                        Arquivo
                      </th>
                      <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">
                        Tipo
                      </th>
                      <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">
                        Tamanho
                      </th>
                      <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">
                        Ação
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFiles.map((file, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="py-3 px-4">
                          <div className="max-w-md truncate" title={file.url}>
                            {file.path}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-md">
                            {file.url}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              categoryColors[file.category]
                            }`}
                          >
                            {categoryLabels[file.category]}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {formatFileSize(file.size)}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() =>
                              handleDownloadFile(
                                file.url,
                                file.path.split('/').pop() || 'file'
                              )
                            }
                            disabled={downloading === file.url}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm transition-colors"
                          >
                            {downloading === file.url ? 'Baixando...' : '📥 Baixar'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {contentAnalysis && activeTab === 'content' && (
          <div className="space-y-6">
            {/* Botão Final para Aplicar Tudo */}
            {(replacements.buttons.length > 0 || replacements.pixels.length > 0) && (
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg shadow-xl p-6 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold mb-2">
                      ✨ Alterações Prontas para Aplicar
                    </h3>
                    <p className="text-purple-100">
                      {replacements.buttons.length} botão(ões) e {replacements.pixels.length} pixel(is) serão aplicados
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadWithReplacements}
                    disabled={downloading === 'all-with-replacements' || !result}
                    className="px-8 py-4 bg-white text-purple-700 rounded-lg hover:bg-purple-50 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed font-bold text-lg transition-colors shadow-lg"
                  >
                    {downloading === 'all-with-replacements' ? '⏳ Gerando ZIP...' : '🎨 Aplicar Tudo e Baixar ZIP'}
                  </button>
                </div>
              </div>
            )}

            {/* Seção de Botões */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                🔘 Botões Encontrados ({contentAnalysis.buttons.length})
              </h2>
              {contentAnalysis.buttons.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">Nenhum botão encontrado nesta página.</p>
              ) : (
                <div className="space-y-4">
                  {contentAnalysis.buttons.map((button, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 dark:text-white mb-1">
                            Texto: "{button.text}"
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            Tipo: {button.type || 'button'} | Seletor: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{button.selector}</code>
                          </div>
                          {button.href && (
                            <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">
                              Link: <code className="bg-blue-50 dark:bg-blue-900/30 px-1 rounded break-all">{button.href}</code>
                            </div>
                          )}
                          {button.classes && button.classes.length > 0 && (
                            <div className="text-xs text-gray-500 dark:text-gray-500">
                              Classes: {button.classes.join(', ')}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setEditingButton(editingButton === button.selector ? null : button.selector);
                            setNewButtonText(button.text);
                            setNewButtonHref(button.href || '');
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm transition-colors"
                        >
                          {editingButton === button.selector ? 'Cancelar' : '✏️ Editar'}
                        </button>
                      </div>
                      {editingButton === button.selector && (
                        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Novo Texto do Botão:
                          </label>
                          <input
                            type="text"
                            value={newButtonText}
                            onChange={(e) => setNewButtonText(e.target.value)}
                            placeholder="Digite o novo texto..."
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-3 dark:bg-gray-600 dark:text-white"
                          />
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 mt-4">
                            Novo Link (URL) do Botão:
                          </label>
                          <input
                            type="text"
                            value={newButtonHref}
                            onChange={(e) => setNewButtonHref(e.target.value)}
                            placeholder={button.href || "Digite a nova URL (ex: https://exemplo.com)"}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-3 dark:bg-gray-600 dark:text-white"
                          />
                          {button.href && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                              Link atual: <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">{button.href}</code>
                            </p>
                          )}
                          <button
                            onClick={() => handleReplaceButton(button)}
                            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                          >
                            💾 Salvar Alteração
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Seção de Pixels */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                📊 Pixels de Rastreamento ({contentAnalysis.pixels.length})
              </h2>
              {contentAnalysis.pixels.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">Nenhum pixel encontrado no header desta página.</p>
              ) : (
                <div className="space-y-4">
                  {contentAnalysis.pixels.map((pixel, index) => {
                    const pixelColors: Record<string, string> = {
                      facebook: 'bg-blue-100 text-blue-800',
                      google: 'bg-red-100 text-red-800',
                      tiktok: 'bg-black text-white',
                      pinterest: 'bg-red-100 text-red-800',
                      linkedin: 'bg-blue-100 text-blue-800',
                      other: 'bg-gray-100 text-gray-800',
                    };

                    return (
                      <div
                        key={index}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-3 py-1 rounded text-sm font-semibold ${pixelColors[pixel.type]}`}>
                                {pixel.type.toUpperCase()}
                              </span>
                              {pixel.id && (
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  ID: {pixel.id}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              Seletor: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{pixel.selector}</code>
                            </div>
                            <details className="mt-2">
                              <summary className="cursor-pointer text-sm text-blue-600 dark:text-blue-400 hover:underline">
                                Ver código do pixel
                              </summary>
                              <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-x-auto max-h-40">
                                {pixel.code.substring(0, 500)}
                                {pixel.code.length > 500 && '...'}
                              </pre>
                            </details>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => {
                              setEditingPixel(editingPixel === pixel.selector ? null : pixel.selector);
                              // Preencher com HTML atual se disponível
                              if (pixel.type === 'facebook') {
                                // Se tem script e noscript, montar template completo
                                if (pixel.html.includes('<script') && pixel.html.includes('<noscript')) {
                                  setNewPixelHtml(pixel.html);
                                } else if (pixel.html.includes('<noscript>')) {
                                  // Se só tem noscript, criar template completo com o ID
                                  const pixelId = pixel.id || 'SEU_PIXEL_ID';
                                  setNewPixelHtml(`<!-- Meta Pixel Code -->\n<script>\n!function(f,b,e,v,n,t,s)\n{if(f.fbq)return;n=f.fbq=function(){n.callMethod?\nn.callMethod.apply(n,arguments):n.queue.push(arguments)};\nif(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';\nn.queue=[];t=b.createElement(e);t.async=!0;\nt.src=v;s=b.getElementsByTagName(e)[0];\ns.parentNode.insertBefore(t,s)}(window, document,'script',\n'https://connect.facebook.net/en_US/fbevents.js');\nfbq('init', '${pixelId}');\nfbq('track', 'PageView');\n</script>\n${pixel.html}\n<!-- End Meta Pixel Code -->`);
                                } else {
                                  // Se só tem script, criar template completo
                                  const pixelId = pixel.id || 'SEU_PIXEL_ID';
                                  setNewPixelHtml(`${pixel.html}\n<noscript><img height="1" width="1" style="display:none"\nsrc="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"\n/></noscript>`);
                                }
                              } else {
                                setNewPixelHtml(pixel.html || '');
                              }
                              setNewPixelToken(pixel.id || '');
                            }}
                            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm transition-colors"
                          >
                            {editingPixel === pixel.selector ? 'Cancelar' : '✏️ Substituir'}
                          </button>
                          <button
                            onClick={() => handleRemovePixel(pixel)}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm transition-colors"
                          >
                            🗑️ Remover
                          </button>
                        </div>
                        {editingPixel === pixel.selector && (
                          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-4">
                            {pixel.type === 'facebook' && (
                              <>
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    HTML do Pixel (Formato Facebook - Template Completo):
                                  </label>
                                  <textarea
                                    value={newPixelHtml}
                                    onChange={(e) => setNewPixelHtml(e.target.value)}
                                    placeholder={`<!-- Meta Pixel Code -->\n<script>\n!function(f,b,e,v,n,t,s)\n{if(f.fbq)return;n=f.fbq=function(){n.callMethod?\nn.callMethod.apply(n,arguments):n.queue.push(arguments)};\nif(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';\nn.queue=[];t=b.createElement(e);t.async=!0;\nt.src=v;s=b.getElementsByTagName(e)[0];\ns.parentNode.insertBefore(t,s)}(window, document,'script',\n'https://connect.facebook.net/en_US/fbevents.js');\nfbq('init', 'SEU_PIXEL_ID');\nfbq('track', 'PageView');\n</script>\n<noscript><img height="1" width="1" style="display:none"\nsrc="https://www.facebook.com/tr?id=SEU_PIXEL_ID&ev=PageView&noscript=1"\n/></noscript>\n<!-- End Meta Pixel Code -->`}
                                    rows={12}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-2 dark:bg-gray-600 dark:text-white font-mono text-xs"
                                  />
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Cole o HTML completo do pixel do Facebook (script + noscript). Use o template acima como referência.
                                  </p>
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Token/ID da API Meta (15-16 dígitos):
                                  </label>
                                  <input
                                    type="text"
                                    value={newPixelToken}
                                    onChange={(e) => setNewPixelToken(e.target.value)}
                                    placeholder="898960114187477"
                                    maxLength={16}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-2 dark:bg-gray-600 dark:text-white font-mono"
                                  />
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Digite apenas o ID do pixel (15-16 dígitos). Se preencher ambos, o HTML terá prioridade.
                                  </p>
                                </div>
                              </>
                            )}
                            {pixel.type === 'google' && (
                              <>
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    HTML do Pixel (Formato Google):
                                  </label>
                                  <textarea
                                    value={newPixelHtml}
                                    onChange={(e) => setNewPixelHtml(e.target.value)}
                                    placeholder='Exemplo: <script>gtag("config", "G-XXXXXXXXXX");</script>'
                                    rows={4}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-2 dark:bg-gray-600 dark:text-white font-mono text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    ID da API Google (UA-XXXXX-Y ou G-XXXXXXXXXX):
                                  </label>
                                  <input
                                    type="text"
                                    value={newPixelToken}
                                    onChange={(e) => setNewPixelToken(e.target.value)}
                                    placeholder="G-XXXXXXXXXX ou UA-XXXXX-Y"
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-2 dark:bg-gray-600 dark:text-white font-mono"
                                  />
                                </div>
                              </>
                            )}
                            {(pixel.type !== 'facebook' && pixel.type !== 'google') && (
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                  Novo Código do Pixel:
                                </label>
                                <textarea
                                  value={newPixelHtml}
                                  onChange={(e) => setNewPixelHtml(e.target.value)}
                                  placeholder="Cole o novo código do pixel aqui..."
                                  rows={6}
                                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-3 dark:bg-gray-600 dark:text-white font-mono text-xs"
                                />
                              </div>
                            )}
                            <button
                              onClick={() => handleReplacePixel(pixel)}
                              className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors font-semibold"
                            >
                              💾 Salvar Alteração
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

