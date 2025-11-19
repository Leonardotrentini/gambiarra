# 🔧 Correção Urgente - Erro de Build na Vercel

## ❌ Erro Atual
```
npm error Missing script: "vercel-build"
Error: Command "npm run vercel-build" exited with 1
```

## 🔍 Causa
A Vercel está tentando executar `npm run vercel-build`, mas esse script não existe mais no `package.json`. Isso pode acontecer porque:

1. **Configuração na Interface da Vercel** está sobrescrevendo o `vercel.json`
2. **Cache do Build** está usando configuração antiga
3. **Settings do Projeto** têm um Build Command customizado

## ✅ Solução 1: Verificar Configuração na Interface da Vercel

### Passo a Passo:

1. **Acesse o Dashboard da Vercel**
   - Vá em https://vercel.com
   - Entre no seu projeto `gambiarra`

2. **Vá em Settings → General**
   - Role até a seção **"Build & Development Settings"**

3. **Verifique o campo "Build Command"**
   - Se estiver preenchido com `npm run vercel-build`, **APAGUE** esse campo
   - Deixe **VAZIO** para usar a detecção automática
   - Ou mude para `npm run build`

4. **Verifique o campo "Output Directory"**
   - Deve estar como `.next` ou vazio

5. **Verifique o campo "Install Command"**
   - Deve estar como `npm install` ou vazio

6. **Salve as alterações**

7. **Faça um novo Deploy**
   - Vá em **Deployments**
   - Clique nos três pontos (⋯) do último deploy
   - Selecione **"Redeploy"**
   - **IMPORTANTE**: Desmarque **"Use existing Build Cache"**
   - Clique em **"Redeploy"**

## ✅ Solução 2: Adicionar Script como Fallback

Se a Solução 1 não funcionar, o script `vercel-build` foi adicionado ao `package.json` como fallback. Mas o ideal é usar a Solução 1.

## 📋 Checklist

Antes de fazer deploy, confirme:

- [ ] **Build Command** na interface da Vercel está **VAZIO** ou como `npm run build`
- [ ] **Output Directory** está como `.next` ou vazio
- [ ] **Root Directory** está como `./` ou vazio
- [ ] **Framework Preset** está como `Next.js`
- [ ] Cache do build foi **LIMPO** antes do redeploy

## 🚨 Se Ainda Não Funcionar

1. **Delete o projeto na Vercel** (Settings → General → Delete Project)
2. **Crie um novo projeto** importando o mesmo repositório
3. **Deixe TODAS as configurações como padrão** (não mexa em nada)
4. **Faça o deploy**

---

**Última atualização:** 19/11/2025
**Status:** ⚠️ Requer verificação na interface da Vercel

