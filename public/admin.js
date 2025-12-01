let currentUser = null;
let secretFriendPairs = [];

document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticação e admin
    try {
        const response = await fetch('/api/user');
        if (!response.ok) {
            window.location.href = '/';
            return;
        }
        
        currentUser = await response.json();
        
        if (!currentUser.isAdmin) {
            alert('Acesso negado. Apenas administradores podem acessar este painel.');
            window.location.href = '/chat.html';
            return;
        }
        
        setupEventListeners();
        loadStats();
        loadSecretFriend();
        
    } catch (error) {
        console.error('Erro:', error);
        window.location.href = '/';
    }
});

function setupEventListeners() {
    const tabs = document.querySelectorAll('.admin-tab');
    const tabContents = document.querySelectorAll('.admin-tab-content');
    const refreshBtn = document.getElementById('refreshStatsBtn');
    const loadBtn = document.getElementById('loadSecretFriendBtn');
    const saveBtn = document.getElementById('saveSecretFriendBtn');
    const addPairBtn = document.getElementById('addPairBtn');
    const backBtn = document.getElementById('backToChatBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Tabs
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(tc => tc.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(`${targetTab}-tab`).classList.add('active');
        });
    });
    
    // Refresh stats
    refreshBtn.addEventListener('click', loadStats);
    
    // Secret friend
    loadBtn.addEventListener('click', loadSecretFriend);
    saveBtn.addEventListener('click', saveSecretFriend);
    const shuffleBtn = document.getElementById('shuffleSecretFriendBtn');
    shuffleBtn.addEventListener('click', shuffleSecretFriend);
    addPairBtn.addEventListener('click', addPair);
    
    // Navigation
    backBtn.addEventListener('click', () => {
        window.location.href = '/chat.html';
    });
    
    logoutBtn.addEventListener('click', async () => {
        try {
            await fetch('/api/logout', { method: 'POST' });
            window.location.href = '/';
        } catch (error) {
            window.location.href = '/';
        }
    });
}

async function loadStats() {
    try {
        const response = await fetch('/api/admin/stats');
        const data = await response.json();
        
        if (data.success) {
            displayStats(data.stats);
        }
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        document.getElementById('statsTableBody').innerHTML = 
            '<tr><td colspan="5" class="error-text">Erro ao carregar estatísticas</td></tr>';
    }
}

function displayStats(stats) {
    const tbody = document.getElementById('statsTableBody');
    
    if (stats.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-text">Nenhum usuário encontrado</td></tr>';
        return;
    }
    
    tbody.innerHTML = stats.map(stat => {
        const statusBadge = stat.isOnline 
            ? '<span class="status-badge online">● Online</span>'
            : '<span class="status-badge offline">○ Offline</span>';
        
        const lastSeen = stat.lastSeen 
            ? new Date(stat.lastSeen).toLocaleString('pt-BR')
            : 'Nunca';
        
        const firstSeen = stat.firstSeen
            ? new Date(stat.firstSeen).toLocaleString('pt-BR')
            : 'Nunca';
        
        const timeOffline = stat.timeOffline || '-';
        
        // Não mostrar botão de excluir para o próprio admin
        const deleteButton = (stat.username === 'Admin' || stat.username === currentUser.username)
            ? '<span class="delete-disabled">-</span>'
            : `<button class="delete-user-btn" onclick="deleteUser('${escapeHtml(stat.username)}')" title="Excluir usuário">🗑️</button>`;
        
        return `
            <tr>
                <td>
                    <div class="user-cell">
                        <img src="${stat.photo}" alt="${stat.username}" class="user-avatar-small">
                        <span>${escapeHtml(stat.username)}</span>
                    </div>
                </td>
                <td>${statusBadge}</td>
                <td>${firstSeen}</td>
                <td>${lastSeen}</td>
                <td>${timeOffline}</td>
                <td>${deleteButton}</td>
            </tr>
        `;
    }).join('');
}

async function loadSecretFriend() {
    try {
        const response = await fetch('/api/admin/secret-friend');
        const data = await response.json();
        
        if (data.success) {
            secretFriendPairs = data.pairs || [];
            displaySecretFriend();
        }
    } catch (error) {
        console.error('Erro ao carregar amigo secreto:', error);
        alert('Erro ao carregar pares de amigo secreto');
    }
}

function displaySecretFriend() {
    const pairsList = document.getElementById('pairsList');
    
    if (secretFriendPairs.length === 0) {
        pairsList.innerHTML = `
            <div class="empty-state">
                <p>Nenhum par adicionado ainda.</p>
                <p>Clique em "Adicionar Par" para começar.</p>
            </div>
        `;
        return;
    }
    
    pairsList.innerHTML = secretFriendPairs.map((pair, index) => `
        <div class="pair-item">
            <div class="pair-inputs">
                <input 
                    type="text" 
                    class="pair-input" 
                    placeholder="Pessoa 1" 
                    value="${escapeHtml(pair.person1 || '')}"
                    data-index="${index}"
                    data-field="person1"
                >
                <span class="pair-arrow">→</span>
                <input 
                    type="text" 
                    class="pair-input" 
                    placeholder="Pessoa 2" 
                    value="${escapeHtml(pair.person2 || '')}"
                    data-index="${index}"
                    data-field="person2"
                >
            </div>
            <button class="remove-pair-btn" onclick="removePair(${index})">✕</button>
        </div>
    `).join('');
    
    // Adicionar event listeners
    pairsList.querySelectorAll('.pair-input').forEach(input => {
        input.addEventListener('input', (e) => {
            const index = parseInt(e.target.dataset.index);
            const field = e.target.dataset.field;
            if (secretFriendPairs[index]) {
                secretFriendPairs[index][field] = e.target.value;
            }
        });
    });
}

function addPair() {
    secretFriendPairs.push({ person1: '', person2: '' });
    displaySecretFriend();
}

function removePair(index) {
    secretFriendPairs.splice(index, 1);
    displaySecretFriend();
}

async function saveSecretFriend() {
    try {
        const response = await fetch('/api/admin/secret-friend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ pairs: secretFriendPairs })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Pares de amigo secreto salvos com sucesso!');
        } else {
            alert('Erro ao salvar pares');
        }
    } catch (error) {
        console.error('Erro ao salvar:', error);
        alert('Erro ao salvar pares de amigo secreto');
    }
}

async function deleteUser(username) {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${username}"?\n\nEsta ação não pode ser desfeita!`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/user/${encodeURIComponent(username)}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Usuário excluído com sucesso!');
            loadStats(); // Recarregar estatísticas
        } else {
            alert(data.error || 'Erro ao excluir usuário');
        }
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        alert('Erro ao excluir usuário');
    }
}

async function shuffleSecretFriend() {
    if (!confirm('Deseja sortear o amigo secreto?\n\nOs pares atuais serão embaralhados e novos pares serão criados.')) {
        return;
    }
    
    try {
        const response = await fetch('/api/admin/secret-friend/shuffle', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            secretFriendPairs = data.pairs;
            displaySecretFriend();
            alert('Amigo secreto sorteado com sucesso!');
        } else {
            alert(data.error || 'Erro ao sortear amigo secreto');
        }
    } catch (error) {
        console.error('Erro ao sortear:', error);
        alert('Erro ao sortear amigo secreto');
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

