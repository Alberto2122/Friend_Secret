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

// Carregar configurações padrão se .env não existir
try {
  require('./config.js');
} catch (e) {
  // Ignorar se config.js não existir
}

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use(session({
  secret: process.env.SESSION_SECRET || 'seu-secret-super-seguro-aqui',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Configurar multer para upload de imagens
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas!'));
    }
  }
});

// Armazenar usuários conectados e status
const connectedUsers = new Map(); // socketId -> userData
const userStatus = new Map(); // username -> { online: bool, lastSeen: timestamp, firstSeen: timestamp }

// Arquivos
const USERS_FILE = path.join(__dirname, 'users.json');
const ADMIN_FILE = path.join(__dirname, 'admin.json');
const SECRET_FRIEND_FILE = path.join(__dirname, 'secretFriend.json');

// Username do administrador padrão
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = 'AlbertoGostoso1010';

// Funções de arquivo
async function loadUsers() {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

async function saveUsers(users) {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

async function loadAdmin() {
  try {
    const data = await fs.readFile(ADMIN_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { secretFriend: [] };
  }
}

async function saveAdmin(data) {
  await fs.writeFile(ADMIN_FILE, JSON.stringify(data, null, 2), 'utf8');
}

async function loadSecretFriend() {
  try {
    const data = await fs.readFile(SECRET_FRIEND_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { pairs: [] };
  }
}

async function saveSecretFriend(data) {
  await fs.writeFile(SECRET_FRIEND_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Middleware de autenticação
function requireAuth(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.status(401).json({ error: 'Não autenticado' });
  }
}

// Middleware de administrador
function requireAdmin(req, res, next) {
  if (req.session.user && (req.session.user.isAdmin || req.session.user.username === 'Admin' || req.session.user.username === ADMIN_USERNAME)) {
    next();
  } else {
    res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
  }
}

// Rota de registro
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Nome de usuário e senha são obrigatórios' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'Nome de usuário deve ter pelo menos 3 caracteres' });
    }

    if (password.length < 4) {
      return res.status(400).json({ error: 'Senha deve ter pelo menos 4 caracteres' });
    }

    const users = await loadUsers();

    if (users[username]) {
      return res.status(400).json({ error: 'Nome de usuário já existe' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const isAdmin = username === ADMIN_USERNAME;

    const newUser = {
      username: username,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      photo: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=FF6B35&color=fff`,
      isAdmin: isAdmin
    };

    users[username] = newUser;
    await saveUsers(users);

    req.session.user = {
      id: username,
      username: username,
      name: username,
      photo: newUser.photo,
      isAdmin: isAdmin
    };

    res.json({
      success: true,
      user: req.session.user
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

// Rota de login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Nome de usuário e senha são obrigatórios' });
    }

    // Verificar se é o administrador padrão (Admin com senha específica)
    let isAdmin = false;
    let user = null;
    
    if (username === 'Admin' && password === ADMIN_PASSWORD) {
      isAdmin = true;
      
      // Criar ou atualizar usuário admin se não existir
      const users = await loadUsers();
      if (!users['Admin']) {
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
        users['Admin'] = {
          username: 'Admin',
          password: hashedPassword,
          createdAt: new Date().toISOString(),
          photo: `https://ui-avatars.com/api/?name=Admin&background=FF6B35&color=fff`,
          isAdmin: true
        };
        await saveUsers(users);
      } else {
        // Atualizar flag de admin
        users['Admin'].isAdmin = true;
        await saveUsers(users);
      }
      
      user = users['Admin'];
    } else {
      // Login normal
      const users = await loadUsers();
      user = users[username];

      if (!user) {
        return res.status(401).json({ error: 'Nome de usuário ou senha incorretos' });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Nome de usuário ou senha incorretos' });
      }

      isAdmin = username === ADMIN_USERNAME || user.isAdmin || false;
    }

    req.session.user = {
      id: username,
      username: username,
      name: username,
      photo: user.photo,
      isAdmin: isAdmin
    };

    res.json({
      success: true,
      user: req.session.user
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// Rota de logout
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao fazer logout' });
    }
    res.json({ success: true });
  });
});

// Rota para obter usuário atual
app.get('/api/user', (req, res) => {
  if (req.session.user) {
    res.json(req.session.user);
  } else {
    res.status(401).json({ error: 'Não autenticado' });
  }
});

// Upload de imagem
app.post('/api/upload', requireAuth, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem enviada' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      imageUrl: imageUrl
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ error: 'Erro ao fazer upload da imagem' });
  }
});

// API de administração - Estatísticas de usuários
app.get('/api/admin/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await loadUsers();
    const stats = [];

    for (const [username, userData] of Object.entries(users)) {
      const status = userStatus.get(username) || {
        online: false,
        lastSeen: null,
        firstSeen: null
      };

      let timeOffline = null;
      if (!status.online && status.lastSeen) {
        const diff = Date.now() - new Date(status.lastSeen).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
          timeOffline = `${days} dia(s)`;
        } else if (hours > 0) {
          timeOffline = `${hours} hora(s)`;
        } else {
          timeOffline = `${minutes} minuto(s)`;
        }
      }

      stats.push({
        username: username,
        createdAt: userData.createdAt,
        isOnline: status.online,
        lastSeen: status.lastSeen,
        firstSeen: status.firstSeen,
        timeOffline: timeOffline,
        photo: userData.photo
      });
    }

    res.json({ success: true, stats: stats });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ error: 'Erro ao obter estatísticas' });
  }
});

// API de amigo secreto - Listar
app.get('/api/admin/secret-friend', requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = await loadSecretFriend();
    const pairs = data.pairs || [];
    
    // Criar mensagem com os pares carregados
    let pairsMessage = `📥 Administrador carregou os pares de amigo secreto!\n\n`;
    
    if (pairs.length > 0) {
      pairsMessage += `📋 Pares carregados (${pairs.length}):\n\n`;
      pairs.forEach((pair, index) => {
        const person1 = pair.person1 || 'Não definido';
        const person2 = pair.person2 || 'Não definido';
        pairsMessage += `${index + 1}. ${person1} → ${person2}\n`;
      });
    } else {
      pairsMessage += `Nenhum par cadastrado ainda.`;
    }
    
    // Enviar notificação no chat quando carregar
    io.emit('message', {
      username: 'Sistema',
      message: pairsMessage,
      timestamp: new Date().toISOString(),
      photo: 'https://ui-avatars.com/api/?name=Sistema&background=FF6B35&color=fff'
    });
    
    res.json({ success: true, pairs: pairs });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar amigo secreto' });
  }
});

// API de amigo secreto - Criar/Atualizar
app.post('/api/admin/secret-friend', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { pairs } = req.body;
    
    if (!Array.isArray(pairs)) {
      return res.status(400).json({ error: 'Pairs deve ser um array' });
    }

    await saveSecretFriend({ pairs: pairs });
    
    // Criar mensagem com os pares salvos
    let pairsMessage = `💾 Pares de amigo secreto foram salvos pelo administrador!\n\n`;
    pairsMessage += `📋 Pares salvos (${pairs.length}):\n\n`;
    
    pairs.forEach((pair, index) => {
      const person1 = pair.person1 || 'Não definido';
      const person2 = pair.person2 || 'Não definido';
      pairsMessage += `${index + 1}. ${person1} → ${person2}\n`;
    });
    
    // Enviar notificação no chat
    io.emit('message', {
      username: 'Sistema',
      message: pairsMessage,
      timestamp: new Date().toISOString(),
      photo: 'https://ui-avatars.com/api/?name=Sistema&background=FF6B35&color=fff'
    });
    
    res.json({ success: true, pairs: pairs });
  } catch (error) {
    console.error('Erro ao salvar amigo secreto:', error);
    res.status(500).json({ error: 'Erro ao salvar amigo secreto' });
  }
});

// API de amigo secreto - Sortear
app.post('/api/admin/secret-friend/shuffle', requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = await loadSecretFriend();
    const pairs = data.pairs || [];
    
    if (pairs.length === 0) {
      return res.status(400).json({ error: 'Nenhum par cadastrado para sortear' });
    }
    
    // Embaralhar os pares
    const shuffled = [...pairs];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // Criar novos pares embaralhados
    const newPairs = [];
    for (let i = 0; i < shuffled.length; i++) {
      const nextIndex = (i + 1) % shuffled.length;
      newPairs.push({
        person1: shuffled[i].person1 || shuffled[i].person2,
        person2: shuffled[nextIndex].person1 || shuffled[nextIndex].person2
      });
    }
    
    await saveSecretFriend({ pairs: newPairs });
    
    // Criar mensagem com os pares
    let pairsMessage = `🎲 Amigo secreto foi sorteado pelo administrador!\n\n`;
    pairsMessage += `📋 Pares criados (${newPairs.length}):\n\n`;
    
    newPairs.forEach((pair, index) => {
      const person1 = pair.person1 || 'Não definido';
      const person2 = pair.person2 || 'Não definido';
      pairsMessage += `${index + 1}. ${person1} → ${person2}\n`;
    });
    
    // Enviar notificação no chat
    io.emit('message', {
      username: 'Sistema',
      message: pairsMessage,
      timestamp: new Date().toISOString(),
      photo: 'https://ui-avatars.com/api/?name=Sistema&background=FF6B35&color=fff'
    });
    
    res.json({ success: true, pairs: newPairs });
  } catch (error) {
    console.error('Erro ao sortear amigo secreto:', error);
    res.status(500).json({ error: 'Erro ao sortear amigo secreto' });
  }
});

// API de administração - Excluir usuário
app.delete('/api/admin/user/:username', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { username } = req.params;
    
    // Não permitir excluir o próprio admin
    if (username === 'Admin' || username === ADMIN_USERNAME) {
      return res.status(400).json({ error: 'Não é possível excluir o administrador' });
    }
    
    const users = await loadUsers();
    
    if (!users[username]) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    // Remover usuário
    delete users[username];
    await saveUsers(users);
    
    // Remover status
    userStatus.delete(username);
    
    // Desconectar usuário se estiver online
    for (const [socketId, userData] of connectedUsers.entries()) {
      if (userData.username === username) {
        const socket = io.sockets.sockets.get(socketId);
        if (socket) {
          socket.disconnect();
        }
        connectedUsers.delete(socketId);
      }
    }
    
    // Enviar notificação no chat
    io.emit('message', {
      username: 'Sistema',
      message: `⚠️ O usuário "${username}" foi removido pelo administrador.`,
      timestamp: new Date().toISOString(),
      photo: 'https://ui-avatars.com/api/?name=Sistema&background=FF6B35&color=fff'
    });
    
    res.json({ success: true, message: 'Usuário excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    res.status(500).json({ error: 'Erro ao excluir usuário' });
  }
});

// Socket.io - Chat em tempo real
io.on('connection', (socket) => {
  console.log('Usuário conectado:', socket.id);

  socket.on('join', (userData) => {
    const username = userData.name;
    
    // Atualizar status
    const status = userStatus.get(username) || {};
    status.online = true;
    status.lastSeen = new Date().toISOString();
    if (!status.firstSeen) {
      status.firstSeen = new Date().toISOString();
    }
    userStatus.set(username, status);

    connectedUsers.set(socket.id, { ...userData, username: username });
    
    socket.broadcast.emit('userJoined', {
      username: userData.name,
      message: `${userData.name} entrou no chat`,
      timestamp: new Date().toISOString()
    });
    
    const usersList = Array.from(connectedUsers.values());
    io.emit('usersList', usersList);
  });

  socket.on('message', (data) => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      io.emit('message', {
        username: user.name,
        message: data.message,
        imageUrl: data.imageUrl,
        timestamp: new Date().toISOString(),
        photo: user.photo
      });
    }
  });

  socket.on('typing', (data) => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      socket.broadcast.emit('typing', {
        username: user.name,
        isTyping: data.isTyping
      });
    }
  });

  socket.on('disconnect', () => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      const username = user.username || user.name;
      
      // Atualizar status
      const status = userStatus.get(username) || {};
      status.online = false;
      status.lastSeen = new Date().toISOString();
      userStatus.set(username, status);

      connectedUsers.delete(socket.id);
      socket.broadcast.emit('userLeft', {
        username: user.name,
        message: `${user.name} saiu do chat`,
        timestamp: new Date().toISOString()
      });
      
      const usersList = Array.from(connectedUsers.values());
      io.emit('usersList', usersList);
    }
    console.log('Usuário desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`Servidor em produção`);
  } else {
    console.log(`Acesse: http://localhost:${PORT}`);
  }
  console.log(`Administrador padrão: ${ADMIN_USERNAME}`);
});
