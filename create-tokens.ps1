Write-Host "🚀 CREANDO TOKENS EN RENDER PARA USUARIOS PERDIDOS..." -ForegroundColor Green
Write-Host ""

# Lista de emails de usuarios
$emails = @(
    "Moens_Tamara@hotmail.com",
    "chiara@brandstoffenslabbinck.com", 
    "johnnycoppejans@hotmail.com",
    "verraes-dhooghe@skynet.be",
    "schiettecatte.nathalie@gmail.com",
    "lizzy.litaer@gmail.com",
    "info@knokke-interiors.be",
    "kellefleerackers@hotmail.com",
    "evy_verstrynge@hotmail.com",
    "eline.degroote08@icloud.com",
    "melissa_lamote@hotmail.com",
    "tantefie2109@hotmail.com",
    "emilydelcroix123@gmail.com",
    "verbouwsandra@gmail.com",
    "sam_bogaert@outlook.com",
    "jessie-westyn@hotmail.com",
    "France.dekeyser@hotmail.com",
    "ella8300@icloud.com",
    "sofiehertsens@hotmail.com",
    "w-elshout@hotmail.com",
    "joyavantorre@gmail.com",
    "vstaal@hotmail.com",
    "kurzieboy@hotmail.com",
    "marjolijnrotsaert@hotmail.com",
    "shana.moyaert@hotmail.com",
    "ymkevanherpe@hotmail.com",
    "fauve.muyllaert@gmail.com",
    "christy.de.graeve@icloud.com",
    "lindeversporten@gmail.com",
    "Carole.scrivens@gmail.com"
)

Write-Host "📊 Total de usuarios: $($emails.Count)" -ForegroundColor Yellow
Write-Host ""

$successCount = 0
$errorCount = 0
$createdTokens = @()

foreach ($email in $emails) {
    try {
        Write-Host "🔄 Creando token para: $email" -ForegroundColor Cyan
        
        $body = @{
            email = $email
            video_ids = "1-38V037fiJbvUytXNPhAtQQ10bPNeLnD,1gb3uJnvBvpZ1ob51uiOiwtrpo4MvGbdE"
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest -Uri "https://heliopsis-video.onrender.com/api/video-simple/create-simple" -Method POST -ContentType "application/json" -Body $body -TimeoutSec 30
        
        if ($response.StatusCode -eq 200) {
            $data = $response.Content | ConvertFrom-Json
            
            if ($data.success) {
                Write-Host "✅ Token creado exitosamente:" -ForegroundColor Green
                Write-Host "   Email: $($data.data.email)"
                Write-Host "   Token: $($data.data.token)"
                Write-Host "   Password: $($data.data.password)"
                Write-Host "   Link: $($data.data.watchUrl)"
                Write-Host "   Max Views: $($data.data.max_views)"
                Write-Host "   Permanent: $($data.data.is_permanent)"
                Write-Host ""
                
                $createdTokens += @{
                    email = $data.data.email
                    token = $data.data.token
                    password = $data.data.password
                    link = $data.data.watchUrl
                }
                
                $successCount++
            } else {
                Write-Host "❌ Error en respuesta: $($data.error)" -ForegroundColor Red
                $errorCount++
            }
        } else {
            Write-Host "❌ Error HTTP: $($response.StatusCode)" -ForegroundColor Red
            $errorCount++
        }
        
        # Pausa entre requests
        Start-Sleep -Seconds 1
        
    } catch {
        Write-Host "❌ Error creando token para $email : $($_.Exception.Message)" -ForegroundColor Red
        $errorCount++
    }
}

Write-Host ""
Write-Host "📈 RESUMEN FINAL:" -ForegroundColor Yellow
Write-Host "   ✅ Tokens creados exitosamente: $successCount/$($emails.Count)"
Write-Host "   ❌ Errores: $errorCount"

if ($successCount -gt 0) {
    Write-Host ""
    Write-Host "🎉 ¡$successCount tokens creados en Render!" -ForegroundColor Green
    Write-Host "🔗 Links de acceso para usuarios:" -ForegroundColor Cyan
    Write-Host "================================================" -ForegroundColor White
    
    for ($i = 0; $i -lt $createdTokens.Count; $i++) {
        $token = $createdTokens[$i]
        Write-Host "$($i + 1). $($token.email)" -ForegroundColor White
        Write-Host "   Link: $($token.link)" -ForegroundColor Blue
        Write-Host "   Password: $($token.password)" -ForegroundColor Yellow
        Write-Host ""
    }
    
    Write-Host "================================================" -ForegroundColor White
    Write-Host "🔒 Todos los tokens son permanentes (999999 views)" -ForegroundColor Green
}
