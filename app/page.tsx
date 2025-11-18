'use client';

import { useState } from 'react';
import { ScannedFile, ScanResult } from '@/types';

export default function Home() {
  const [url, setUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);

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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao escanear domínio');
      }

      const data: ScanResult = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao escanear domínio');
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
            <button
              onClick={handleScan}
              disabled={scanning || !url.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-colors"
            >
              {scanning ? 'Escanando...' : 'Escanear Domínio'}
            </button>
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
        </div>

        {result && (
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
                </div>
                <button
                  onClick={handleDownloadAll}
                  disabled={downloading === 'all'}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-colors"
                >
                  {downloading === 'all' ? 'Baixando...' : '📥 Baixar Todos (ZIP)'}
                </button>
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
      </div>
    </div>
  );
}

