# 🔧 Guia de Configuração

## Configuração do Google OAuth

Para usar o login com Google, você precisa configurar as credenciais OAuth:

### Passo 1: Criar Projeto no Google Cloud Console

1. Acesse: https://console.cloud.google.com/
2. Clique em "Criar Projeto" ou selecione um projeto existente
3. Dê um nome ao projeto (ex: "Chat Online")

### Passo 2: Configurar OAuth Consent Screen

1. No menu lateral, vá em "APIs e Serviços" > "Tela de consentimento OAuth"
2. Escolha "Externo" e clique em "Criar"
3. Preencha as informações básicas:
   - Nome do aplicativo: "Chat Online"
   - Email de suporte: seu email
   - Email do desenvolvedor: seu email
4. Clique em "Salvar e continuar"
5. Na etapa de "Escopos", clique em "Salvar e continuar"
6. Na etapa de "Usuários de teste", adicione seu email e clique em "Salvar e continuar"
7. Revise e volte ao painel

### Passo 3: Criar Credenciais OAuth

1. Vá em "APIs e Serviços" > "Credenciais"
2. Clique em "Criar credenciais" > "ID do cliente OAuth"
3. Escolha "Aplicativo da Web"
4. Configure:
   - Nome: "Chat Online Web Client"
   - URIs de redirecionamento autorizados:
     - `http://localhost:3000/auth/google/callback`
     - (Para produção, adicione também: `https://seudominio.com/auth/google/callback`)
5. Clique em "Criar"
6. Copie o **ID do Cliente** e o **Segredo do Cliente**

### Passo 4: Criar Arquivo .env

Crie um arquivo chamado `.env` na raiz do projeto com o seguinte conteúdo:

```
GOOGLE_CLIENT_ID=seu_client_id_aqui
GOOGLE_CLIENT_SECRET=seu_client_secret_aqui
SESSION_SECRET=qualquer_string_aleatoria_segura_aqui
PORT=3000
```

**Exemplo:**
```
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
SESSION_SECRET=minha_chave_secreta_super_segura_123456
PORT=3000
```

### Passo 5: Instalar Dependências e Executar

```bash
npm install
npm start
```

Acesse: http://localhost:3000

## ⚠️ Importante

- **Nunca compartilhe** seu arquivo `.env` ou suas credenciais
- O arquivo `.env` já está no `.gitignore` para não ser commitado
- Para produção, configure as URLs de redirecionamento corretas no Google Console

## 🐛 Solução de Problemas

### Erro: "redirect_uri_mismatch"
- Verifique se a URL de redirecionamento no Google Console está exatamente igual a: `http://localhost:3000/auth/google/callback`
- Certifique-se de que não há espaços ou caracteres extras

### Erro: "invalid_client"
- Verifique se o `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` estão corretos no arquivo `.env`
- Certifique-se de que não há espaços extras ou aspas nas credenciais

### Porta já em uso
- Altere a `PORT` no arquivo `.env` para outra porta (ex: 3001, 8080)
- Ou feche o processo que está usando a porta 3000

