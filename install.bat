@echo off
chcp 65001 >nul
echo.
echo ========================================
echo 🎥 INSTALADOR DEL SISTEMA DE CONTROL DE ACCESO
echo ========================================
echo.

:: Verificar si Node.js está instalado
echo 🔍 Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js no está instalado.
    echo.
    echo 📥 Por favor, instala Node.js desde: https://nodejs.org/
    echo    Recomendamos la versión LTS (Long Term Support)
    echo.
    pause
    exit /b 1
)

:: Verificar si npm está instalado
echo 🔍 Verificando npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm no está instalado o no funciona correctamente.
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js y npm están instalados correctamente.
echo.

:: Mostrar versiones
echo 📋 Versiones instaladas:
node --version
npm --version
echo.

:: Instalar dependencias
echo 🚀 Instalando dependencias del servidor...
npm install

if %errorlevel% neq 0 (
    echo ❌ Error al instalar dependencias del servidor.
    echo.
    pause
    exit /b 1
)

echo ✅ Dependencias del servidor instaladas correctamente.
echo.

:: Crear directorios necesarios
echo 📁 Creando directorios necesarios...
if not exist "database" mkdir database
if not exist "public" mkdir public
if not exist "logs" mkdir logs

echo ✅ Directorios creados correctamente.
echo.

:: Verificar si existe archivo .env
if not exist ".env" (
    echo 📝 Creando archivo de configuración .env...
    copy "env.example" ".env" >nul 2>&1
    if exist ".env" (
        echo ✅ Archivo .env creado correctamente.
        echo.
        echo ⚠️  IMPORTANTE: Debes configurar las variables de entorno en el archivo .env
        echo.
        echo 🔧 Variables que necesitas configurar:
        echo    - ONEDRIVE_CLIENT_ID: Tu Client ID de Azure
        echo    - ONEDRIVE_CLIENT_SECRET: Tu Client Secret de Azure  
        echo    - ONEDRIVE_ACCESS_TOKEN: Tu token de acceso de OneDrive
        echo    - VIDEO_FILE_ID: ID del archivo de video en OneDrive
        echo.
        echo 📖 Consulta el README.md para instrucciones detalladas.
        echo.
    ) else (
        echo ❌ Error al crear archivo .env
        echo.
    )
) else (
    echo ✅ Archivo .env ya existe.
    echo.
)

:: Mostrar instrucciones de uso
echo ========================================
echo 🎯 INSTALACIÓN COMPLETADA
echo ========================================
echo.
echo ✅ El sistema está listo para usar.
echo.
echo 🚀 Para iniciar el servidor:
echo    npm start
echo.
echo 🔧 Para desarrollo (con recarga automática):
echo    npm run dev
echo.
echo 🌐 URLs del sistema:
echo    - Servidor: http://localhost:3000
echo    - Panel de administración: http://localhost:3000/admin
echo    - API: http://localhost:3000/api/
echo.
echo 📋 Próximos pasos:
echo    1. Configura las variables de entorno en .env
echo    2. Sube tu video a OneDrive
echo    3. Obtén el ID del archivo de video
echo    4. Inicia el servidor
echo    5. Accede al panel de administración
echo    6. Genera tokens de acceso
echo.
echo 📖 Para más información, consulta el README.md
echo.
echo ========================================
echo 🎉 ¡Sistema instalado exitosamente!
echo ========================================
echo.

:: Preguntar si abrir el archivo .env
set /p open_env="¿Quieres abrir el archivo .env para configurarlo ahora? (s/n): "
if /i "%open_env%"=="s" (
    echo.
    echo 🔧 Abriendo archivo .env...
    notepad .env
)

:: Preguntar si iniciar el servidor
echo.
set /p start_server="¿Quieres iniciar el servidor ahora? (s/n): "
if /i "%start_server%"=="s" (
    echo.
    echo 🚀 Iniciando servidor...
    npm start
) else (
    echo.
    echo 💡 Para iniciar el servidor más tarde, ejecuta: npm start
    echo.
    pause
)
