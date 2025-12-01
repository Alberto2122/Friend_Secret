# Script de Deploy Automático
Write-Host "`n🚀 Iniciando preparação para deploy...`n" -ForegroundColor Cyan

# Verificar Node.js
Write-Host "📦 Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js não encontrado!" -ForegroundColor Red
    Write-Host "   Instale em: https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

# Verificar dependências
Write-Host "`n📦 Verificando dependências..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "✅ node_modules encontrado" -ForegroundColor Green
} else {
    Write-Host "📥 Instalando dependências..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Dependências instaladas" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro ao instalar dependências" -ForegroundColor Red
        exit 1
    }
}

# Verificar arquivos
Write-Host "`n📋 Verificando arquivos..." -ForegroundColor Yellow
$files = @("server.js", "package.json", "render.yaml", "Procfile")
$allOk = $true
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file não encontrado" -ForegroundColor Red
        $allOk = $false
    }
}

if (-not $allOk) {
    Write-Host "`n❌ Arquivos faltando!" -ForegroundColor Red
    exit 1
}

# Verificar pasta public
if (Test-Path "public") {
    Write-Host "✅ public/ encontrado" -ForegroundColor Green
} else {
    Write-Host "❌ pasta public/ não encontrada" -ForegroundColor Red
    exit 1
}

# Gerar SESSION_SECRET
Write-Host "`n🔐 Gerando SESSION_SECRET..." -ForegroundColor Yellow
try {
    $secret = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
    Write-Host "✅ SESSION_SECRET gerado!" -ForegroundColor Green
    Write-Host "`n📝 SESSION_SECRET:" -ForegroundColor Cyan
    Write-Host $secret -ForegroundColor White
    Write-Host ""
    
    # Salvar em arquivo
    $secret | Out-File -FilePath "SESSION_SECRET.txt" -Encoding UTF8 -NoNewline
    Write-Host "✅ Salvo em SESSION_SECRET.txt" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao gerar SESSION_SECRET" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Preparacao concluida!" -ForegroundColor Green
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor Cyan
Write-Host "1. Abra DEPLOY-AGORA.md para instrucoes detalhadas" -ForegroundColor White
Write-Host "2. Acesse https://render.com" -ForegroundColor White
Write-Host "3. Use o SESSION_SECRET acima nas variaveis de ambiente" -ForegroundColor White
Write-Host ""
