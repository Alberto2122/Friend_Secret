document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const loginBtn = document.getElementById('loginBtn');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    const registerSubmitBtn = document.getElementById('registerSubmitBtn');
    
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
            // Não autenticado, continuar na página de registro
        });
    
    // Evento de submit do formulário
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('regUsername').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validação
        if (!username || !password || !confirmPassword) {
            showError('Por favor, preencha todos os campos');
            return;
        }
        
        if (username.length < 3) {
            showError('Nome de usuário deve ter pelo menos 3 caracteres');
            return;
        }
        
        if (password.length < 4) {
            showError('Senha deve ter pelo menos 4 caracteres');
            return;
        }
        
        if (password !== confirmPassword) {
            showError('As senhas não coincidem');
            return;
        }
        
        // Desabilitar botão e mostrar loading
        registerSubmitBtn.disabled = true;
        const btnText = registerSubmitBtn.querySelector('span');
        const originalText = btnText.textContent;
        btnText.textContent = 'Criando conta...';
        
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                // Registro bem-sucedido
                showSuccess('Conta criada com sucesso! Redirecionando...');
                setTimeout(() => {
                    window.location.href = '/chat.html';
                }, 1500);
            } else {
                // Erro no registro
                showError(data.error || 'Erro ao criar conta');
                registerSubmitBtn.disabled = false;
                btnText.textContent = originalText;
            }
        } catch (error) {
            console.error('Erro:', error);
            showError('Erro de conexão. Tente novamente.');
            registerSubmitBtn.disabled = false;
            btnText.textContent = originalText;
        }
    });
    
    // Botão de login
    loginBtn.addEventListener('click', () => {
        window.location.href = '/';
    });
    
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        successMessage.style.display = 'none';
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }
    
    function showSuccess(message) {
        successMessage.textContent = message;
        successMessage.style.display = 'block';
        errorMessage.style.display = 'none';
    }
});


