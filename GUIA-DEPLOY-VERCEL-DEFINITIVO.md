# 🚀 Guia Definitivo - Deploy na Vercel

## ✅ Verificações Antes do Deploy

### 1. Código Corrigido
- ✅ Erro TypeScript corrigido em `app/api/download-with-replacements/route.ts`
- ✅ Tipo `PixelReplacementMapValue` definido corretamente
- ✅ Uso de tipo explícito para evitar inferência incorreta

### 2. Arquivos de Configuração
- ✅ `vercel.json` configurado
- ✅ `next.config.js` limpo (sem `output: 'standalone'`)
- ✅ `package.json` com script `vercel-build`

## 📋 Passo a Passo para Deploy na Vercel

### PASSO 1: Preparar o Código Localmente

```bash
# 1. Verificar se está no diretório correto
cd "C:\Users\Leonardo trentini\Desktop\gambiarra"

# 2. Verificar status do Git
git status

# 3. Adicionar todas as mudanças
git add -A

# 4. Fazer commit
git commit -m "fix: Corrige erro TypeScript definitivamente com tipo explícito"

# 5. Push para o repositório
git push origin main
```

### PASSO 2: Conectar Projeto na Vercel

1. **Acesse https://vercel.com**
2. **Faça login** (ou crie uma conta)
3. **Clique em "Add New Project"** ou **"New Project"**
4. **Importe o repositório** do GitHub:
   - Se ainda não conectou, clique em "Import Git Repository"
   - Autorize a Vercel a acessar seu GitHub
   - Selecione o repositório `gambiarra` (ou o nome que você usou)

### PASSO 3: Configurar o Projeto na Vercel

**IMPORTANTE: Configure exatamente assim:**

#### Framework Preset
- **Framework Preset**: `Next.js` (deve detectar automaticamente)

#### Build and Output Settings
- **Root Directory**: `./` (deixe VAZIO ou coloque apenas `./`)
  - ❌ **NÃO** use `/vercel/path0/run` ou qualquer outro caminho
  - ❌ **NÃO** deixe em branco se houver opção de preencher

#### Build Command
- **Build Command**: `npm run build` (ou deixe vazio para usar o padrão)
  - A Vercel deve detectar automaticamente `next build`

#### Output Directory
- **Output Directory**: `.next` (ou deixe vazio para usar o padrão)

#### Install Command
- **Install Command**: `npm install` (ou deixe vazio para usar o padrão)

#### Environment Variables
- **Não precisa configurar nada** por enquanto

### PASSO 4: Deploy

1. **Clique em "Deploy"**
2. **Aguarde o build** (pode levar 3-5 minutos na primeira vez)
3. **Monitore os logs** em tempo real

### PASSO 5: Verificar o Deploy

#### Se o Build Falhar

**Erro TypeScript:**
- Verifique se o commit foi feito corretamente
- Na Vercel, vá em **Settings → Git** e verifique se está usando o branch `main`
- Clique em **"Redeploy"** e selecione o commit mais recente

**Erro de Build Command:**
- Vá em **Settings → General**
- Verifique se o **Build Command** está como `npm run build`
- Verifique se o **Root Directory** está como `./` ou vazio

**Limpar Cache:**
- Vá em **Deployments**
- Clique nos três pontos (⋯) do último deploy
- Selecione **"Redeploy"**
- Marque a opção **"Use existing Build Cache"** como **DESMARCADA**

#### Se o Build Passar

1. **Acesse a URL** fornecida pela Vercel (ex: `gambiarra.vercel.app`)
2. **Teste a aplicação**:
   - Digite uma URL
   - Clique em "Escanear"
   - Verifique se funciona

## 🔧 Configurações Importantes

### vercel.json (já configurado)

```json
{
  "buildCommand": "npm run vercel-build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 300
    }
  },
  "regions": ["gru1"]
}
```

### package.json (já configurado)

```json
{
  "scripts": {
    "build": "next build",
    "vercel-build": "next build"
  }
}
```

## ⚡ Dicas para Deploy Rápido

### 1. Usar Preview Deploys
- **Cada push** em qualquer branch cria um preview automaticamente
- **Mais rápido** que production deploy
- **Teste antes** de fazer merge para `main`

### 2. Limpar Cache se Precisar
- Se o build falhar repetidamente:
  1. Vá em **Settings → General**
  2. Role até **"Build & Development Settings"**
  3. Clique em **"Clear Build Cache"**

### 3. Verificar Logs em Tempo Real
- Durante o build, monitore os logs
- Se aparecer erro TypeScript, pare o build e verifique o código localmente

## 🐛 Troubleshooting

### Erro: "Type error: Object literal may only specify known properties"

**Solução:**
1. Verifique se o arquivo `app/api/download-with-replacements/route.ts` tem o tipo explícito:
   ```typescript
   const pixelReplacement: PixelReplacementMapValue = {
     selector: replacement.selector,
     pixelType: replacement.pixelType,
     newPixelHtml: replacement.newPixelHtml,
     newPixelToken: replacement.newPixelToken,
     action: replacement.action || 'replace',
   };
   ```

2. Verifique se o tipo está definido em `types/index.ts`:
   ```typescript
   export type PixelReplacementMapValue = {
     selector: string;
     pixelType: string;
     newPixelHtml?: string;
     newPixelToken?: string;
     action?: 'replace' | 'remove';
   };
   ```

3. Faça commit e push novamente:
   ```bash
   git add -A
   git commit -m "fix: Garante tipo explícito para PixelReplacementMapValue"
   git push origin main
   ```

### Erro: "Invalid project directory provided"

**Solução:**
- Na Vercel, vá em **Settings → General**
- Verifique se **Root Directory** está como `./` ou vazio
- **NÃO** use `/vercel/path0/run` ou qualquer outro caminho

### Build Muito Lento

**Soluções:**
1. **Limpar cache** (veja seção acima)
2. **Usar preview deploy** primeiro (mais rápido)
3. **Verificar dependências** - pode estar baixando muitas coisas

## ✅ Checklist Final

Antes de fazer deploy, confirme:

- [ ] Código commitado e pushado para `main`
- [ ] `vercel.json` existe e está correto
- [ ] `next.config.js` não tem `output: 'standalone'`
- [ ] `package.json` tem script `vercel-build`
- [ ] Tipo `PixelReplacementMapValue` está definido em `types/index.ts`
- [ ] Arquivo `app/api/download-with-replacements/route.ts` usa tipo explícito
- [ ] Root Directory na Vercel está como `./` ou vazio

## 🎯 Próximos Passos Após Deploy

1. **Testar a aplicação** na URL fornecida
2. **Verificar logs** se houver erros
3. **Configurar domínio customizado** (opcional)
4. **Monitorar uso** na dashboard da Vercel

---

**Última atualização:** 19/11/2025
**Status:** ✅ Código corrigido e pronto para deploy

