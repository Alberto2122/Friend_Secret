let socket;
let currentUser = null;
let typingTimeout;

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticação
    try {
        const response = await fetch('/api/user');
        if (!response.ok) {
            window.location.href = '/';
            return;
        }
        
        currentUser = await response.json();
        displayUserInfo(currentUser);
        
        // Conectar ao Socket.io
        socket = io();
        
        // Entrar no chat
        socket.emit('join', {
            name: currentUser.name,
            photo: currentUser.photo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(currentUser.name)
        });
        
        setupEventListeners();
        setupSocketListeners();
        
    } catch (error) {
        console.error('Erro ao carregar usuário:', error);
        window.location.href = '/';
    }
});

function displayUserInfo(user) {
    document.getElementById('userName').textContent = user.name;
    const userPhoto = document.getElementById('userPhoto');
    if (user.photo) {
        userPhoto.src = user.photo;
    } else {
        userPhoto.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff`;
    }
}

function setupEventListeners() {
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const adminBtn = document.getElementById('adminBtn');
    const emojiBtn = document.getElementById('emojiBtn');
    const imageBtn = document.getElementById('imageBtn');
    const imageInput = document.getElementById('imageInput');
    const emojiPicker = document.getElementById('emojiPicker');
    
    // Mostrar botão admin se for administrador
    if (currentUser && currentUser.isAdmin) {
        adminBtn.style.display = 'block';
        adminBtn.addEventListener('click', () => {
            window.location.href = '/admin.html';
        });
    }
    
    // Upload de imagem
    imageBtn.addEventListener('click', () => {
        imageInput.click();
    });
    
    imageInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.size > 5 * 1024 * 1024) {
            alert('Imagem muito grande! Máximo 5MB.');
            return;
        }
        
        const formData = new FormData();
        formData.append('image', file);
        
        try {
            imageBtn.disabled = true;
            imageBtn.textContent = '⏳';
            
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Enviar mensagem com imagem
                if (socket) {
                    socket.emit('message', {
                        message: '',
                        imageUrl: data.imageUrl
                    });
                }
            } else {
                alert('Erro ao fazer upload da imagem');
            }
        } catch (error) {
            console.error('Erro no upload:', error);
            alert('Erro ao fazer upload da imagem');
        } finally {
            imageBtn.disabled = false;
            imageBtn.textContent = '📷';
            imageInput.value = '';
        }
    });
    
    // Seletor de emojis
    setupEmojiPicker();
    
    // Toggle emoji picker
    emojiBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        emojiPicker.classList.toggle('active');
    });
    
    // Fechar emoji picker ao clicar fora
    document.addEventListener('click', (e) => {
        if (!emojiPicker.contains(e.target) && e.target !== emojiBtn) {
            emojiPicker.classList.remove('active');
        }
    });
    
    // Enviar mensagem
    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Indicador de digitação
    messageInput.addEventListener('input', () => {
        socket.emit('typing', { isTyping: true });
        
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            socket.emit('typing', { isTyping: false });
        }, 1000);
    });
    
    // Logout
    logoutBtn.addEventListener('click', async () => {
        try {
            await fetch('/api/logout', { method: 'POST' });
            window.location.href = '/';
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
            window.location.href = '/';
        }
    });
}

function setupEmojiPicker() {
    const emojiGrid = document.getElementById('emojiGrid');
    const categoryBtns = document.querySelectorAll('.emoji-category-btn');
    
    // Emojis por categoria
    const emojis = {
        smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓'],
        gestures: ['👋', '🤚', '🖐', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃'],
        people: ['👶', '👧', '🧒', '👦', '👩', '🧑', '👨', '👩‍🦱', '👨‍🦱', '👩‍🦰', '👨‍🦰', '👱‍♀️', '👱', '👩‍🦳', '👨‍🦳', '👩‍🦲', '👨‍🦲', '🧔', '👵', '🧓', '👴', '🙍', '🙎', '🙅', '🙆', '💁', '🙋', '🧏', '🤦', '🤷', '👮', '🕵️', '💂', '🥷', '👷', '🤴', '👸', '👳', '👲', '🧕', '🤵', '👰', '🤰', '🤱', '👼', '🎅', '🤶', '🦸', '🦹', '🧙', '🧚', '🧛', '🧜', '🧝', '🧞', '🧟'],
        animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🐈', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝', '🦨', '🦡', '🦦', '🦥', '🐁', '🐀', '🐿️'],
        food: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🌽', '🥕', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🥞', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🌮', '🌯', '🥗', '🥘', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '☕️', '🍵', '🥤', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🍾', '🧃', '🧉', '🧊'],
        travel: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🛴', '🚲', '🛵', '🏍', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '✈️', '🛫', '🛬', '🛩', '💺', '🚁', '🚟', '🚠', '🚡', '🛰', '🚀', '🛸', '🛎', '🚪', '🛏', '🛋', '🚿', '🛁', '🧴', '🧷', '🧹', '🧺', '🧻', '🧼', '🧽', '🧯', '🛒', '🚬', '⚰️', '⚱️', '🗿', '🏧', '🚮', '🚰', '♿️', '🚹', '🚺', '🚻', '🚼', '🚾', '🛂', '🛃', '🛄', '🛅'],
        objects: ['⌚️', '📱', '📲', '💻', '⌨️', '🖥', '🖨', '🖱', '🖲', '🕹', '🗜', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽', '🎞', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙', '🎚', '🎛', '⏱', '⏲', '⏰', '🕰', '⌛️', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯', '🧯', '🛢', '💸', '💵', '💴', '💶', '💷', '💰', '💳', '💎', '⚖️', '🧰', '🔧', '🔨', '⚒', '🛠', '⛏', '🔩', '⚙️', '🧱', '⛓', '🧲', '🔫', '💣', '🧨', '🔪', '🗡', '⚔️', '🛡', '🚬', '⚰️', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳', '💊', '💉', '🧬', '🦠', '🧫', '🧪', '🌡', '🧹', '🧺', '🧻', '🚽', '🚰', '🚿', '🛁', '🧼', '🧽', '🧴', '🧷', '🧹', '🛋', '🛏', '🚪', '🛎', '🧸', '🎈', '🎉', '🎊', '🎁', '🎀', '🏆', '🥇', '🥈', '🥉', '⚽️', '🏀', '🏈', '⚾️', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥅', '🏒', '🏑', '🏏', '⛳️', '🏹', '🎣', '🥊', '🥋', '🎽', '⛸', '🥌', '🛷', '🎿', '⛷', '🏂', '🏋️', '🤼', '🤸', '🤺', '⛹️', '🤹', '🧘', '🏄', '🏊', '🤽', '🏇', '🧗', '🚵', '🚴', '🏆', '🥇', '🥈', '🥉', '🎖', '🏵', '🎗', '🎫', '🎟', '🎪', '🤹', '🎭', '🩰', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🎲', '♟', '🎯', '🎳', '🎮', '🎰', '🧩'],
        symbols: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈️', '♉️', '♊️', '♋️', '♌️', '♍️', '♎️', '♏️', '♐️', '♑️', '♒️', '♓️', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚️', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕️', '🛑', '⛔️', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗️', '❓', '❕', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯️', '💹', '❇️', '✳️', '❎', '🌐', '💠', 'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿️', '🅿️', '🈳', '🈂️', '🛂', '🛃', '🛄', '🛅', '🚹', '🚺', '🚼', '🚻', '🚮', '🎦', '📶', '🈁', '🔣', 'ℹ️', '🔤', '🔡', '🔠', '🔢', '🔟', '🔢', '9️⃣', '8️⃣', '7️⃣', '6️⃣', '5️⃣', '4️⃣', '3️⃣', '2️⃣', '1️⃣', '0️⃣', '#️⃣', '*️⃣', '⏏️', '▶️', '⏸', '⏯', '⏹', '⏺', '⏭', '⏮', '⏩', '⏪', '⏫', '⏬', '◀️', '🔼', '🔽', '➡️', '⬅️', '⬆️', '⬇️', '↗️', '↖️', '↘️', '↙️', '↔️', '↕️', '🔄', '🔃', '⏸', '🔙', '🔚', '🔛', '🔜', '🔝', '⚠️', '🚸', '⛔️', '🚫', '🚳', '🚭', '🚯', '🚱', '🚷', '📵', '🔞', '☢️', '☣️']
    };
    
    let currentCategory = 'smileys';
    
    // Renderizar emojis
    function renderEmojis(category) {
        emojiGrid.innerHTML = '';
        emojis[category].forEach(emoji => {
            const emojiItem = document.createElement('div');
            emojiItem.className = 'emoji-item';
            emojiItem.textContent = emoji;
            emojiItem.addEventListener('click', () => {
                const messageInput = document.getElementById('messageInput');
                messageInput.value += emoji;
                messageInput.focus();
                emojiPicker.classList.remove('active');
            });
            emojiGrid.appendChild(emojiItem);
        });
    }
    
    // Event listeners para categorias
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            renderEmojis(currentCategory);
        });
    });
    
    // Renderizar emojis iniciais
    renderEmojis(currentCategory);
}

function setupSocketListeners() {
    // Receber mensagens
    socket.on('message', (data) => {
        addMessage(data, data.username === currentUser.name || data.username === currentUser.username);
    });
    
    // Usuário entrou
    socket.on('userJoined', (data) => {
        addSystemMessage(data.message);
    });
    
    // Usuário saiu
    socket.on('userLeft', (data) => {
        addSystemMessage(data.message);
    });
    
    // Lista de usuários online
    socket.on('usersList', (users) => {
        updateUsersList(users);
    });
    
    // Indicador de digitação
    socket.on('typing', (data) => {
        showTypingIndicator(data.username, data.isTyping);
    });
}

function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (message && socket) {
        socket.emit('message', { message });
        messageInput.value = '';
        
        // Parar indicador de digitação
        socket.emit('typing', { isTyping: false });
    }
}

function addMessage(data, isOwn = false) {
    const messagesContainer = document.getElementById('messages');
    
    // Remover mensagem de boas-vindas se existir
    const welcomeMsg = messagesContainer.querySelector('.welcome-message');
    if (welcomeMsg) {
        welcomeMsg.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isOwn ? 'own' : ''}`;
    
    const time = new Date(data.timestamp).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const avatarSrc = data.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.username)}&background=FF6B35&color=fff`;
    
    let messageContent = '';
    if (data.imageUrl) {
        messageContent = `<img src="${data.imageUrl}" alt="Imagem" class="message-image" onclick="window.open('${data.imageUrl}', '_blank')">`;
    }
    if (data.message) {
        messageContent += `<div class="message-text">${escapeHtml(data.message)}</div>`;
    }
    
    // Verificar se é mensagem do sistema (com quebras de linha)
    const isSystemMessage = data.username === 'Sistema' && data.message.includes('\n');
    
    messageDiv.innerHTML = `
        <img src="${avatarSrc}" alt="${data.username}" class="message-avatar">
        <div class="message-content">
            <div class="message-header">
                <span class="message-username">${escapeHtml(data.username)}</span>
                <span class="message-time">${time}</span>
            </div>
            <div class="message-bubble ${isSystemMessage ? 'system-bubble' : ''}">${messageContent || formatMessageText(data.message)}</div>
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function addSystemMessage(message) {
    const messagesContainer = document.getElementById('messages');
    
    const systemDiv = document.createElement('div');
    systemDiv.className = 'system-message';
    systemDiv.textContent = message;
    
    messagesContainer.appendChild(systemDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function updateUsersList(users) {
    const usersList = document.getElementById('usersList');
    
    if (users.length === 0) {
        usersList.innerHTML = '<div class="loading-users">Nenhum usuário online</div>';
        return;
    }
    
    usersList.innerHTML = users.map(user => {
        const avatarSrc = user.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff`;
        return `
            <div class="user-item">
                <img src="${avatarSrc}" alt="${escapeHtml(user.name)}">
                <span>${escapeHtml(user.name)}</span>
            </div>
        `;
    }).join('');
}

function showTypingIndicator(username, isTyping) {
    const typingIndicator = document.getElementById('typingIndicator');
    
    if (isTyping && username !== currentUser.name) {
        typingIndicator.textContent = `${username} está digitando...`;
    } else {
        typingIndicator.textContent = '';
    }
}

function formatMessageText(text) {
    if (!text) return '<span class="message-text">Imagem enviada</span>';
    
    // Converter quebras de linha em <br>
    const formatted = escapeHtml(text).replace(/\n/g, '<br>');
    return `<span class="message-text">${formatted}</span>`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

