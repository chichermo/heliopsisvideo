# 🚀 Guía Completa de Despliegue - Heliopsis Video

## 📋 Resumen del Sistema

**Sistema Simple Funcionando:**
- ✅ Streaming de video desde Google Drive
- ✅ Tokens únicos por email
- ✅ Panel de administración simple
- ✅ URLs dinámicas para producción
- ✅ Seguridad básica implementada

## 🌐 Despliegue en Render (Recomendado)

### Paso 1: Preparar el Repositorio

1. **Asegúrate de que todo esté en GitHub:**
```bash
git add .
git commit -m "Sistema simple funcionando - listo para producción"
git push origin main
```

2. **Verifica que tengas estos archivos:**
- ✅ `server.js`
- ✅ `routes/video-simple.js`
- ✅ `public/admin-simple.html`
- ✅ `public/player-simple.html`
- ✅ `package.json`
- ✅ `.env.example`

### Paso 2: Configurar Render

1. **Crear cuenta en Render:**
   - Ve a [render.com](https://render.com)
   - Regístrate con tu cuenta de GitHub

2. **Crear nuevo Web Service:**
   - Click en "New +" → "Web Service"
   - Conecta tu repositorio `heliopsisvideo`
   - Selecciona la rama `main`

3. **Configurar el servicio:**
   - **Name:** `heliopsis-video`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** `Free`

### Paso 3: Variables de Entorno

En la sección "Environment Variables", agrega:

```env
# Google Drive API (OBLIGATORIAS)
GOOGLE_CLIENT_ID=tu_client_id_de_google_cloud
GOOGLE_CLIENT_SECRET=tu_client_secret_de_google_cloud
GOOGLE_REDIRECT_URI=https://tu-app.onrender.com/api/googledrive/callback
GOOGLE_REFRESH_TOKEN=tu_refresh_token_de_google

# Servidor (OBLIGATORIAS)
PORT=10000
JWT_SECRET=tu_jwt_secret_super_seguro_y_largo_de_al_menos_32_caracteres

# Entorno (OBLIGATORIAS)
NODE_ENV=production
RENDER=true

# Opcionales
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Paso 4: Desplegar

1. **Click en "Create Web Service"**
2. **Espera 5-10 minutos** para que se complete el despliegue
3. **Verifica que la app esté funcionando**

## 🔗 URLs de Producción

Una vez desplegado, tendrás acceso a:

- **🌐 URL Principal:** `https://tu-app.onrender.com`
- **📺 Panel de Administración:** `https://tu-app.onrender.com/admin-simple`
- **🎬 Reproductor de Video:** `https://tu-app.onrender.com/watch-simple/[TOKEN]`
- **🔧 API:** `https://tu-app.onrender.com/api/`

## 🧪 Probar el Sistema

### 1. Verificar el Panel de Administración
- Ve a: `https://tu-app.onrender.com/admin-simple`
- Deberías ver la interfaz de administración
- Los videos de Google Drive deberían cargarse

### 2. Generar un Token de Prueba
- Completa el formulario con:
  - **Email:** `test@ejemplo.com`
  - **Video:** Selecciona cualquier video de la lista
- Click en "🔑 Generar Token"
- Copia el link generado

### 3. Probar el Reproductor
- Abre el link generado en una nueva pestaña
- El video debería reproducirse correctamente
- Verifica que funcione en diferentes dispositivos

## 🔧 Solución de Problemas

### Error: "Cannot find module"
- **Solución:** Verifica que `package.json` tenga todas las dependencias
- **Comando:** `npm install` en local para verificar

### Error: "Google Drive API"
- **Solución:** Verifica las variables de entorno de Google Drive
- **Verificar:** Que el `GOOGLE_REFRESH_TOKEN` sea válido

### Error: "Port already in use"
- **Solución:** Cambia `PORT` a `10000` en las variables de entorno
- **Nota:** Render usa puerto 10000 por defecto

### Error: "Database"
- **Solución:** El sistema simple no usa base de datos
- **Verificar:** Que estés usando `/admin-simple` y no `/admin`

## 📱 Uso en Producción

### Para Administradores:
1. **Acceder al panel:** `https://tu-app.onrender.com/admin-simple`
2. **Generar tokens** para cada usuario
3. **Compartir links** con los usuarios

### Para Usuarios:
1. **Recibir el link** por email
2. **Abrir el link** en cualquier dispositivo
3. **Ver el video** inmediatamente

## 🔒 Seguridad en Producción

✅ **HTTPS Automático:** Render incluye SSL  
✅ **Tokens Únicos:** Cada token es específico para un email  
✅ **No Descarga:** Videos protegidos contra descarga  
✅ **Rate Limiting:** Protección contra abuso  
✅ **Headers de Seguridad:** Protección adicional  

## 📊 Monitoreo

### Logs de Render:
- Ve a tu servicio en Render
- Click en "Logs" para ver actividad
- Monitorea errores y uso

### Métricas:
- **Uptime:** Disponibilidad del servicio
- **Response Time:** Velocidad de respuesta
- **Error Rate:** Tasa de errores

## 🔄 Actualizaciones

### Para actualizar el sistema:
1. **Hacer cambios en local**
2. **Commit y push a GitHub**
3. **Render se actualiza automáticamente**

### Rollback:
- Ve a "Deploys" en Render
- Selecciona una versión anterior
- Click en "Rollback"

## 💰 Costos

### Plan Gratuito de Render:
- ✅ **Hasta 750 horas/mes** (suficiente para uso moderado)
- ✅ **512MB RAM** (suficiente para el sistema)
- ✅ **HTTPS incluido**
- ✅ **Dominio personalizado** (opcional)

### Si necesitas más:
- **Plan Starter:** $7/mes
- **Plan Standard:** $25/mes

## 🎯 Próximos Pasos

1. **Desplegar en Render** siguiendo esta guía
2. **Probar con usuarios reales**
3. **Configurar dominio personalizado** (opcional)
4. **Implementar analytics** (opcional)
5. **Escalar según necesidad**

---

**¡Tu sistema estará listo para usuarios externos en menos de 30 minutos!** 🚀
