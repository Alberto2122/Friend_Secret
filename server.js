const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const session = require('express-session');
const cors = require('cors');
const bcrypt = require('bcrypt');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
require('dotenv').config();

// Carregar configurações (ignora erro se não existir)
try { require('./config.js'); } catch (e) {}

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// --- CORREÇÃO AQUI ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. Libera todos os arquivos da pasta raiz (CSS, JS, Imagens)
app.use(express.static(__dirname));

// 2. Libera a pasta de uploads especificamente
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 3. Força a entrega do index.html quando acessar a raiz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
// ---------------------

app.use(session({
  secret: process.env.SESSION_SECRET || 'seu-secret-super-seguro-aqui',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// Configuração do Multer (Uploads)
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) { cb(error); }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    if (allowedTypes.test(path.extname(file.originalname).toLowerCase()) && allowedTypes.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas!'));
    }
  }
});

// Estruturas de dados em memória
const connectedUsers = new Map();
const userStatus = new Map();
const USERS_FILE = path.join(__dirname, 'users.json');
const ADMIN_FILE = path.join(__dirname, 'admin.json');
const SECRET_FRIEND_FILE = path.join(__dirname, 'secretFriend.json');
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = 'AlbertoGostoso1010';

// Funções Auxiliares
async function loadUsers() {
  try { return JSON.parse(await fs.readFile(USERS_FILE, 'utf8')); } catch (e) { return {}; }
}
async function saveUsers(users) {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}
async function loadSecretFriend() {
  try { return JSON.parse(await fs.readFile(SECRET_FRIEND_FILE, 'utf8')); } catch (e) { return { pairs: [] }; }
}
async function saveSecretFriend(data) {
  await fs.writeFile(SECRET_FRIEND_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Middlewares de Proteção
function requireAuth(req, res, next) {
  if (req.session.user) next();
  else res.status(401).json({ error: 'Não autenticado' });
}
function requireAdmin(req, res, next) {
  if (req.session.user && (req.session.user.isAdmin || req.session.user.username === 'Admin' || req.session.user.username === ADMIN_USERNAME)) next();
  else res.status(403).json({ error: 'Acesso negado.' });
}

// --- ROTAS DA API ---

app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Preencha todos os campos' });
    if (username.length < 3) return res.status(400).json({ error: 'Usuário muito curto' });
    if (password.length < 4) return res.status(400).json({ error: 'Senha muito curta' });

    const users = await loadUsers();
    if (users[username]) return res.status(400).json({ error: 'Usuário já existe' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const isAdmin = username === ADMIN_USERNAME;
    
    users[username] = {
      username,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      photo: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=FF6B35&color=fff`,
      isAdmin
    };
    await saveUsers(users);

    req.session.user = { id: username, username, name: username, photo: users[username].photo, isAdmin };
    res.json({ success: true, user: req.session.user });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao registrar' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Preencha todos os campos' });

    let user = null;
    let isAdmin = false;

    if (username === 'Admin' && password === ADMIN_PASSWORD) {
      isAdmin = true;
      const users = await loadUsers();
      if (!users['Admin']) {
        users['Admin'] = {
          username: 'Admin',
          password: await bcrypt.hash(ADMIN_PASSWORD, 10),
          createdAt: new Date().toISOString(),
          photo: `https://ui-avatars.com/api/?name=Admin&background=FF6B35&color=fff`,
          isAdmin: true
        };
        await saveUsers(users);
      }
      user = users['Admin'];
    } else {
      const users = await loadUsers();
      user = users[username];
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Usuário ou senha incorretos' });
      }
      isAdmin = user.isAdmin || username === ADMIN_USERNAME;
    }

    req.session.user = { id: username, username, name: username, photo: user.photo, isAdmin };
    res.json({ success: true, user: req.session.user });
  } catch (error) {
    res.status(500).json({ error: 'Erro no login' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

app.get('/api/user', (req, res) => {
  if (req.session.user) res.json(req.session.user);
  else res.status(401).json({ error: 'Não autenticado' });
});

app.post('/api/upload', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhuma imagem enviada' });
  res.json({ success: true, imageUrl: `/uploads/${req.file.filename}` });
});

// Admin Routes
app.get('/api/admin/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await loadUsers();
    const stats = Object.entries(users).map(([username, userData]) => {
      const status = userStatus.get(username) || { online: false };
      return {
        username,
        createdAt: userData.createdAt,
        isOnline: status.online,
        lastSeen: status.lastSeen,
        photo: userData.photo
      };
    });
    res.json({ success: true, stats });
  } catch (e) { res.status(500).json({ error: 'Erro' }); }
});

app.get('/api/admin/secret-friend', requireAuth, requireAdmin, async (req, res) => {
  const data = await loadSecretFriend();
  res.json({ success: true, pairs: data.pairs || [] });
});

app.post('/api/admin/secret-friend', requireAuth, requireAdmin, async (req, res) => {
  await saveSecretFriend({ pairs: req.body.pairs });
  res.json({ success: true });
});

app.post('/api/admin/secret-friend/shuffle', requireAuth, requireAdmin, async (req, res) => {
  const data = await loadSecretFriend();
  let pairs = data.pairs || [];
  if(pairs.length === 0) return res.status(400).json({error: 'Sem pares'});
  
  // Lógica simples de embaralhar
  const shuffled = [...pairs];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  const newPairs = [];
  for (let i = 0; i < shuffled.length; i++) {
    const p1 = shuffled[i].person1 || shuffled[i].person2;
    const p2 = shuffled[(i + 1) % shuffled.length].person1 || shuffled[(i + 1) % shuffled.length].person2;
    newPairs.push({ person1: p1, person2: p2 });
  }
  
  await saveSecretFriend({ pairs: newPairs });
  res.json({ success: true, pairs: newPairs });
});

app.delete('/api/admin/user/:username', requireAuth, requireAdmin, async (req, res) => {
  const { username } = req.params;
  if(username === 'Admin') return res.status(400).json({error: 'Não pode apagar admin'});
  const users = await loadUsers();
  delete users[username];
  await saveUsers(users);
  res.json({ success: true });
});

// --- SOCKET.IO ---
io.on('connection', (socket) => {
  socket.on('join', (userData) => {
    const username = userData.name;
    userStatus.set(username, { online: true, lastSeen: new Date().toISOString() });
    connectedUsers.set(socket.id, { ...userData, username });
    
    socket.broadcast.emit('userJoined', { username, message: `${username} entrou`, timestamp: new Date() });
    io.emit('usersList', Array.from(connectedUsers.values()));
  });

  socket.on('message', (data) => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      io.emit('message', {
        username: user.name,
        message: data.message,
        imageUrl: data.imageUrl,
        timestamp: new Date(),
        photo: user.photo
      });
    }
  });

  socket.on('typing', (data) => {
    const user = connectedUsers.get(socket.id);
    if(user) socket.broadcast.emit('typing', { username: user.name, isTyping: data.isTyping });
  });

  socket.on('disconnect', () => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      userStatus.set(user.username, { online: false, lastSeen: new Date().toISOString() });
      connectedUsers.delete(socket.id);
      socket.broadcast.emit('userLeft', { username: user.name, message: `${user.name} saiu`, timestamp: new Date() });
      io.emit('usersList', Array.from(connectedUsers.values()));
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});