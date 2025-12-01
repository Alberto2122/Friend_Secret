# 🚀 Guia de Deploy

Este guia mostra como fazer deploy do chat online em plataformas gratuitas.

## 📦 Opção 1: Render (Recomendado - Gratuito)

### Passos:

1. **Criar conta no Render**
   - Acesse: https://render.com
   - Crie uma conta gratuita (pode usar GitHub)

2. **Conectar repositório**
   - No dashboard do Render, clique em "New +" > "Web Service"
   - Conecte seu repositório GitHub (ou faça upload dos arquivos)
   - Se não tiver repositório, crie um no GitHub primeiro

3. **Configurar o serviço**
   - **Name**: `chat-online` (ou qualquer nome)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

4. **Variáveis de Ambiente**
   - Adicione estas variáveis:
     - `NODE_ENV` = `production`
     - `PORT` = `10000` (Render usa porta dinâmica, mas 10000 funciona)
     - `SESSION_SECRET` = (gere uma string aleatória longa)

5. **Deploy**
   - Clique em "Create Web Service"
   - O deploy será automático
   - Aguarde alguns minutos

6. **Acessar**
   - Você receberá uma URL como: `https://chat-online.onrender.com`
   - O site ficará online 24/7 (pode ter um pequeno delay no primeiro acesso após inatividade)

---

## 📦 Opção 2: Railway (Gratuito com créditos)

### Passos:

1. **Criar conta**
   - Acesse: https://railway.app
   - Faça login com GitHub

2. **Novo projeto**
   - Clique em "New Project"
   - Selecione "Deploy from GitHub repo"
   - Escolha seu repositório

3. **Configuração automática**
   - Railway detecta automaticamente que é Node.js
   - O deploy começa automaticamente

4. **Variáveis de Ambiente**
   - Vá em "Variables"
   - Adicione:
     - `SESSION_SECRET` = (string aleatória)
     - `PORT` = (Railway define automaticamente)

5. **Acessar**
   - Railway fornece uma URL automática
   - Exemplo: `https://seu-projeto.up.railway.app`

---

## 📦 Opção 3: Vercel (Gratuito)

### Passos:

1. **Instalar Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Fazer deploy**
   ```bash
   vercel
   ```

3. **Seguir instruções**
   - A Vercel fará perguntas sobre configuração
   - O deploy será automático

**Nota**: Vercel é mais focado em sites estáticos, mas funciona com Node.js também.

---

## 📦 Opção 4: Heroku (Gratuito limitado)

### Passos:

1. **Instalar Heroku CLI**
   - Baixe em: https://devcenter.heroku.com/articles/heroku-cli

2. **Login**
   ```bash
   heroku login
   ```

3. **Criar app**
   ```bash
   heroku create seu-nome-app
   ```

4. **Configurar variáveis**
   ```bash
   heroku config:set SESSION_SECRET=sua_chave_secreta
   ```

5. **Deploy**
   ```bash
   git push heroku main
   ```

---

## ⚙️ Configurações Importantes

### Variáveis de Ambiente Necessárias:

```env
NODE_ENV=production
PORT=10000 (ou deixar a plataforma definir)
SESSION_SECRET=sua_chave_secreta_muito_longa_e_aleatoria
```

### Gerar SESSION_SECRET:

Você pode gerar uma chave segura usando:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📝 Notas Importantes

1. **Arquivo users.json**: Será criado automaticamente no servidor
2. **Persistência**: Em plataformas gratuitas, dados podem ser perdidos se o serviço reiniciar
3. **Timeout**: Algumas plataformas gratuitas têm timeout após inatividade
4. **HTTPS**: Todas as plataformas fornecem HTTPS automaticamente

---

## 🔧 Troubleshooting

### Erro: "Port already in use"
- Deixe a plataforma definir a porta automaticamente
- Use `process.env.PORT || 3000` no código (já está assim)

### Erro: "Module not found"
- Certifique-se de que `package.json` tem todas as dependências
- Execute `npm install` localmente para testar

### Site não carrega
- Verifique os logs na plataforma
- Certifique-se de que o servidor está rodando na porta correta
- Verifique se todas as variáveis de ambiente estão configuradas

---

## 🎉 Pronto!

Após o deploy, seu chat estará online 24/7 e acessível de qualquer lugar!

