@echo off
echo ========================================
echo    CONFIGURACION DE GOOGLE DRIVE
echo ========================================
echo.
echo 1. Ve a: https://console.cloud.google.com/
echo 2. Crea un proyecto nuevo
echo 3. Habilita Google Drive API
echo 4. Crea credenciales OAuth2
echo 5. Copia Client ID y Client Secret
echo.
echo ========================================
echo.
echo Presiona cualquier tecla para abrir Google Cloud Console...
pause >nul
start https://console.cloud.google.com/
echo.
echo Una vez que tengas las credenciales:
echo 1. Edita el archivo .env
echo 2. Agrega GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET
echo 3. Ejecuta: npm run dev
echo.
pause
