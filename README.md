# 💬 Chat Online com Login Google

Um chat em tempo real moderno e interativo com autenticação via Google OAuth. Quando um usuário faz login, um nome aleatório é gerado automaticamente para ele.

## ✨ Funcionalidades

- 🔐 **Login com Google** - Autenticação segura via OAuth 2.0
- 🎲 **Nome Automático** - Geração de nomes únicos e criativos para cada usuário
- 💬 **Chat em Tempo Real** - Comunicação instantânea usando Socket.io
- 👥 **Usuários Online** - Visualização de quem está conectado
- ⌨️ **Indicador de Digitação** - Veja quando alguém está digitando
- 📱 **Totalmente Responsivo** - Funciona perfeitamente em desktop e mobile
- 🎨 **Design Moderno** - Interface bonita e interativa

## 🚀 Como Usar

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Google OAuth

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a API "Google+ API" ou "Google Identity"
4. Vá em "Credenciais" e crie uma credencial OAuth 2.0
5. Adicione as URLs autorizadas:
   - URI de redirecionamento: `http://localhost:3000/auth/google/callback`
   - (Para produção, adicione também a URL do seu domínio)

### 3. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` e adicione suas credenciais:

```
GOOGLE_CLIENT_ID=seu_client_id_aqui
GOOGLE_CLIENT_SECRET=seu_client_secret_aqui
SESSION_SECRET=sua_chave_secreta_aleatoria_aqui
PORT=3000
```

### 4. Iniciar o Servidor

```bash
npm start
```

Ou para desenvolvimento com auto-reload:

```bash
npm run dev
```

### 5. Acessar a Aplicação

Abra seu navegador em: `http://localhost:3000`

## 📁 Estrutura do Projeto

```
Projeto_ Teste/
├── server.js          # Servidor Express e Socket.io
├── package.json       # Dependências do projeto
├── .env              # Variáveis de ambiente (criar)
├── public/           # Arquivos estáticos
│   ├── index.html    # Página de login
│   ├── chat.html     # Página do chat
│   ├── styles.css    # Estilos CSS
│   ├── login.js      # Lógica da página de login
│   └── chat.js       # Lógica do chat
└── README.md         # Este arquivo
```

## 🛠️ Tecnologias Utilizadas

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **Socket.io** - Comunicação em tempo real
- **Passport.js** - Autenticação
- **Google OAuth 2.0** - Login com Google
- **HTML5/CSS3** - Interface moderna
- **JavaScript (ES6+)** - Lógica do frontend

## 📝 Notas

- Os nomes são gerados aleatoriamente combinando adjetivos e substantivos
- Cada usuário recebe um nome único ao fazer login
- O chat funciona em tempo real usando WebSockets
- A interface é totalmente responsiva e funciona em dispositivos móveis

## 🔒 Segurança

- Sessões seguras com express-session
- Autenticação OAuth 2.0
- Sanitização de mensagens (XSS protection)
- CORS configurado adequadamente

## 📱 Responsividade

O site é totalmente responsivo e se adapta a:
- Desktop (1920px+)
- Tablet (768px - 1024px)
- Mobile (< 768px)

## 🎨 Personalização

Você pode personalizar:
- Cores no arquivo `styles.css` (variáveis CSS)
- Nomes gerados em `server.js` (arrays `adjectives` e `nouns`)
- Porta do servidor no arquivo `.env`

## 📄 Licença

Este projeto é de código aberto e está disponível para uso livre.


