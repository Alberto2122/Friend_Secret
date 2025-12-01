document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerBtn = document.getElementById('registerBtn');
    const errorMessage = document.getElementById('errorMessage');
    const loginBtn = document.getElementById('loginBtn');
    
    // Verificar se já está autenticado
    fetch('/api/user')
        .then(res => {
            if (res.ok) {
                return res.json();
            }
            throw new Error('Não autenticado');
        })
        .then(user => {
            // Redirecionar para o chat se já estiver autenticado
            window.location.href = '/chat.html';
        })
        .catch(() => {
            // Não autenticado, continuar na página de login
        });
    
    // Evento de submit do formulário
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        
        // Validação básica
        if (!username || !password) {
            showError('Por favor, preencha todos os campos');
            return;
        }
        
        // Desabilitar botão e mostrar loading
        loginBtn.disabled = true;
        const btnText = loginBtn.querySelector('span');
        const originalText = btnText.textContent;
        btnText.textContent = 'Entrando...';
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                // Login bem-sucedido
                window.location.href = '/chat.html';
            } else {
                // Erro no login
                showError(data.error || 'Erro ao fazer login');
                loginBtn.disabled = false;
                btnText.textContent = originalText;
            }
        } catch (error) {
            console.error('Erro:', error);
            showError('Erro de conexão. Tente novamente.');
            loginBtn.disabled = false;
            btnText.textContent = originalText;
        }
    });
    
    // Botão de registro
    registerBtn.addEventListener('click', () => {
        window.location.href = '/register.html';
    });
    
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }
});
