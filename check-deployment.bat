@echo off
echo 🔍 Verificando estado del repositorio...
echo.

echo 📋 Estado de Git:
git status
echo.

echo 📊 Últimos commits:
git log --oneline -3
echo.

echo 🌐 Estado del repositorio remoto:
git remote -v
echo.

echo 📤 Intentando push...
git push origin main
echo.

echo ✅ Verificación completada
pause
