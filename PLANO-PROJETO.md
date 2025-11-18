# 🚀 PLANO: Ferramenta de Escaneamento e Download de Domínio

## 📋 Objetivo
Criar uma ferramenta web que:
1. Recebe uma URL de uma página
2. Escaneia TODO o código/arquivos daquele domínio
3. Lista todos os arquivos encontrados
4. Permite copiar/baixar arquivos individuais ou em lote

## 🏗️ Arquitetura Proposta

### **Stack Tecnológica:**
- **Frontend:** Next.js 14 (React) + TypeScript + Tailwind CSS
- **Backend:** Next.js API Routes (serverless)
- **Crawling:** Puppeteer ou Cheerio + Axios
- **Download:** Node.js fs + stream

### **Estrutura do Projeto:**
```
gambiarra/
├── app/
│   ├── page.tsx              # Interface principal
│   ├── api/
│   │   ├── scan/route.ts     # Endpoint para escanear domínio
│   │   └── download/route.ts # Endpoint para download
│   └── layout.tsx
├── lib/
│   ├── crawler.ts            # Lógica de crawling
│   ├── file-discovery.ts     # Descoberta de arquivos
│   └── downloader.ts         # Lógica de download
├── types/
│   └── index.ts              # Tipos TypeScript
└── package.json
```

## 🔄 Fluxo de Funcionamento

### **Etapa 1: Entrada do Usuário**
- Interface com campo de input para URL
- Botão "Escanear Domínio"
- Validação de URL

### **Etapa 2: Escaneamento (Backend)**
1. **Crawling Inicial:**
   - Acessa a URL fornecida
   - Extrai HTML da página
   - Identifica o domínio base

2. **Descoberta de Arquivos:**
   - Analisa HTML para encontrar:
     - Links internos (`<a href>`)
     - Scripts (`<script src>`)
     - Estilos (`<link rel="stylesheet">`)
     - Imagens (`<img src>`)
     - Fontes (`@font-face`, `<link rel="font">`)
     - Assets diversos (vídeos, PDFs, etc.)

3. **Crawling Recursivo:**
   - Visita cada link interno encontrado
   - Mantém lista de URLs já visitadas (evitar loops)
   - Respeita robots.txt (opcional)
   - Limita profundidade (configurável)

4. **Coleta de Arquivos:**
   - Lista todos os arquivos únicos encontrados
   - Categoriza por tipo (HTML, CSS, JS, Imagens, etc.)
   - Extrai metadados (tamanho, tipo MIME, URL completa)

### **Etapa 3: Exibição (Frontend)**
- Lista de arquivos encontrados
- Filtros por tipo de arquivo
- Busca/filtro de arquivos
- Contador de arquivos por categoria
- Status do escaneamento (progresso)

### **Etapa 4: Download**
- **Download Individual:**
  - Botão ao lado de cada arquivo
  - Download direto do arquivo original

- **Download em Lote:**
  - Botão "Baixar Todos"
  - Cria estrutura de pastas local
  - Baixa todos os arquivos mantendo estrutura
  - Gera ZIP com todos os arquivos (opcional)

## 🛠️ Funcionalidades Detalhadas

### **1. Crawler Inteligente**
- ✅ Respeita CORS e políticas do site
- ✅ Detecta SPA (Single Page Applications)
- ✅ Suporta JavaScript renderizado (Puppeteer)
- ✅ Evita loops infinitos
- ✅ Limite de requisições por segundo (rate limiting)
- ✅ Timeout configurável

### **2. Descoberta de Arquivos**
- ✅ HTML, CSS, JavaScript
- ✅ Imagens (JPG, PNG, SVG, WebP, etc.)
- ✅ Fontes (WOFF, WOFF2, TTF, etc.)
- ✅ Vídeos e áudios
- ✅ Documentos (PDF, DOC, etc.)
- ✅ Arquivos de dados (JSON, XML, etc.)
- ✅ Arquivos estáticos diversos

### **3. Interface do Usuário**
- ✅ Design moderno e responsivo
- ✅ Indicador de progresso do escaneamento
- ✅ Lista filtrada e pesquisável
- ✅ Preview de arquivos (quando possível)
- ✅ Estatísticas (total de arquivos, tamanho, etc.)

### **4. Sistema de Download**
- ✅ Download individual
- ✅ Download em lote
- ✅ Manutenção da estrutura de pastas
- ✅ Geração de ZIP (opcional)
- ✅ Barra de progresso para downloads

## ⚠️ Considerações Importantes

### **Limitações Legais e Éticas:**
- ⚠️ Respeitar termos de uso dos sites
- ⚠️ Não usar para sites que proíbem scraping
- ⚠️ Rate limiting para não sobrecarregar servidores
- ⚠️ Aviso legal na interface

### **Desafios Técnicos:**
- 🔴 Sites com autenticação
- 🔴 Conteúdo gerado dinamicamente via JS
- 🔴 Arquivos protegidos por CORS
- 🔴 Sites muito grandes (limite de tempo/memória)
- 🔴 Arquivos em CDNs externos

## 📦 Dependências Necessárias

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "typescript": "^5.0.0",
    "puppeteer": "^21.0.0",
    "cheerio": "^1.0.0",
    "axios": "^1.6.0",
    "jszip": "^3.10.0",
    "mime-types": "^2.1.0"
  }
}
```

## 🎯 Próximos Passos

1. ✅ Criar estrutura do projeto Next.js
2. ✅ Configurar TypeScript e dependências
3. ✅ Implementar interface básica
4. ✅ Criar crawler básico
5. ✅ Implementar descoberta de arquivos
6. ✅ Criar interface de listagem
7. ✅ Implementar sistema de download
8. ✅ Adicionar funcionalidades avançadas
9. ✅ Testes e refinamentos

