# 🔍 Gambiarra Scraper

Ferramenta web para escanear e baixar todos os arquivos de um domínio completo.

## 🚀 Funcionalidades

- ✅ **Escanamento Completo**: Escaneia todo o domínio, descobrindo páginas, arquivos CSS, JavaScript, imagens, fontes e mais
- ✅ **Crawling Inteligente**: Suporta sites com JavaScript (usando Puppeteer)
- ✅ **Descoberta Automática**: Encontra automaticamente todos os arquivos estáticos
- ✅ **Download Individual**: Baixe arquivos específicos
- ✅ **Download em Lote**: Baixe todos os arquivos de uma vez em um ZIP
- ✅ **Interface Moderna**: Interface responsiva e fácil de usar
- ✅ **Filtros e Busca**: Filtre por tipo de arquivo e busque arquivos específicos

## 📦 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/Leonardotrentini/gambiarra.git
cd gambiarra
```

2. Instale as dependências:
```bash
npm install
```

## 🏃 Como Usar

1. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

2. Abra [http://localhost:3000](http://localhost:3000) no navegador

3. Cole a URL do site que deseja escanear e clique em "Escanear Domínio"

4. Aguarde o escaneamento (pode levar alguns minutos dependendo do tamanho do site)

5. Use os filtros para encontrar arquivos específicos

6. Baixe arquivos individuais ou todos de uma vez

## 🛠️ Tecnologias

- **Next.js 14** - Framework React
- **TypeScript** - Tipagem estática
- **Puppeteer** - Crawling de sites com JavaScript
- **Cheerio** - Análise de HTML
- **Axios** - Requisições HTTP
- **JSZip** - Criação de arquivos ZIP
- **Tailwind CSS** - Estilização

## ⚠️ Avisos Importantes

- ⚠️ Use esta ferramenta apenas em sites que você tem permissão para escanear
- ⚠️ Respeite os termos de uso dos sites
- ⚠️ Não use para fazer scraping de sites que proíbem essa prática
- ⚠️ A ferramenta implementa rate limiting para não sobrecarregar servidores

## 📝 Estrutura do Projeto

```
gambiarra/
├── app/
│   ├── api/
│   │   ├── scan/route.ts      # API de escaneamento
│   │   └── download/route.ts   # API de download
│   ├── page.tsx                # Interface principal
│   ├── layout.tsx              # Layout da aplicação
│   └── globals.css             # Estilos globais
├── lib/
│   ├── crawler.ts              # Lógica de crawling
│   └── downloader.ts           # Lógica de download
├── types/
│   └── index.ts                # Tipos TypeScript
└── package.json
```

## 🔧 Configurações

Você pode ajustar os parâmetros de escaneamento na interface ou modificando o código:

- `maxDepth`: Profundidade máxima do crawling (padrão: 5)
- `maxPages`: Número máximo de páginas a escanear (padrão: 100)
- `usePuppeteer`: Usar Puppeteer para renderizar JavaScript (padrão: true)

## 📄 Licença

Este projeto é de código aberto e está disponível sob a licença MIT.

