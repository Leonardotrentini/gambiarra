# 🚀 Instruções Rápidas

## Primeira Execução

1. **Instalar dependências:**
```bash
npm install
```

2. **Iniciar o servidor:**
```bash
npm run dev
```

3. **Acessar no navegador:**
```
http://localhost:3000
```

## Como Usar a Ferramenta

1. Cole a URL do site que deseja escanear (ex: `https://exemplo.com`)
2. Clique em "Escanear Domínio"
3. Aguarde o escaneamento (pode levar alguns minutos)
4. Use os filtros para encontrar arquivos específicos
5. Baixe arquivos individuais ou todos de uma vez

## ⚠️ Nota sobre Puppeteer

O Puppeteer baixa o Chromium automaticamente na primeira instalação. Isso pode levar alguns minutos e requer espaço em disco (~300MB).

Se encontrar problemas, você pode:
- Desabilitar Puppeteer (modificar `usePuppeteer: false` no código)
- Ou usar apenas crawling básico com Cheerio

## 🔧 Comandos Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm run start` - Inicia servidor de produção
- `npm run lint` - Verifica erros de código

## 📝 Exemplo de Uso

1. Abra a ferramenta em `http://localhost:3000`
2. Digite: `https://exemplo.com`
3. Clique em "Escanear Domínio"
4. Aguarde os resultados
5. Filtre por tipo (HTML, CSS, JS, etc.)
6. Baixe os arquivos desejados

