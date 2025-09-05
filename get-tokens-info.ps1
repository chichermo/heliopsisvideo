Write-Host "🔍 EXTRAYENDO INFORMACIÓN DE TOKENS DESDE BASE DE DATOS..." -ForegroundColor Green
Write-Host ""

# Verificar si el servidor está funcionando
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/video-simple/stats-simple" -Method GET -TimeoutSec 5
    $data = $response.Content | ConvertFrom-Json
    
    Write-Host "📊 Total de tokens en base de datos: $($data.data.total)" -ForegroundColor Yellow
    Write-Host "🔒 Tokens permanentes: $($data.data.permanent)" -ForegroundColor Yellow
    Write-Host ""
    
    # Obtener lista completa de tokens
    $listResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/video-simple/list-simple" -Method GET -TimeoutSec 5
    $tokensData = $listResponse.Content | ConvertFrom-Json
    
    # Filtrar tokens reales
    $realTokens = $tokensData.data | Where-Object { 
        $_.email -notlike "*example*" -and 
        $_.email -notlike "*test*" -and 
        $_.email -ne "test-nuevo@example.com" 
    }
    
    Write-Host "📋 TOKENS REALES ENCONTRADOS: $($realTokens.Count)" -ForegroundColor Cyan
    Write-Host "=================================================" -ForegroundColor White
    
    $realTokens | ForEach-Object {
        Write-Host "Email: $($_.email)" -ForegroundColor White
        Write-Host "Token: $($_.token)" -ForegroundColor Blue
        Write-Host "Password: $($_.password)" -ForegroundColor Yellow
        Write-Host "Link: https://heliopsis-video.onrender.com/watch-simple/$($_.token)" -ForegroundColor Green
        Write-Host "Max Views: $($_.max_views)" -ForegroundColor Magenta
        Write-Host "Status: $($_.is_active)" -ForegroundColor Cyan
        Write-Host "Notes: $($_.notes)" -ForegroundColor Gray
        Write-Host "---" -ForegroundColor White
    }
    
    Write-Host "=================================================" -ForegroundColor White
    Write-Host "🎉 ¡$($realTokens.Count) tokens listos para usuarios!" -ForegroundColor Green
    Write-Host "🔒 Todos los tokens son permanentes (999999 views)" -ForegroundColor Green
    Write-Host "📝 Los tokens están guardados en la base de datos local" -ForegroundColor Yellow
    Write-Host "🚀 Para que estén disponibles en Render, necesitas subir los cambios a git" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Error conectando al servidor: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "🔄 Asegúrate de que el servidor esté funcionando con: npm start" -ForegroundColor Yellow
}
