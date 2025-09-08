# 🚀 Guía de Despliegue en Render

## 📋 Prerrequisitos

1. **Cuenta en Render**: [render.com](https://render.com)
2. **Proyecto en GitHub**: Tu repositorio debe estar sincronizado
3. **Variables de entorno**: Tener configurado Google Drive API

## 🔧 PASO 1: Configurar Google Drive para Producción

### 1.1 Actualizar OAuth2 en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Selecciona tu proyecto
3. Ve a **APIs & Services** > **Credentials**
4. Edita tu OAuth2 Client ID
5. **IMPORTANTE**: Agrega tu dominio de Render a "Authorized redirect URIs":
   ```
   https://tu-app.onrender.com/api/googledrive/callback
   ```

### 1.2 Obtener nuevo Refresh Token

1. Ejecuta localmente: `npm run dev`
2. Ve a: `http://localhost:3001/admin`
3. Pestaña "Google Drive" > "🔐 Autorizar Google Drive"
4. Copia el nuevo `refreshToken`

## 🌐 PASO 2: Crear Servicio en Render

### 2.1 Crear nuevo Web Service

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Haz clic en **"New +"** > **"Web Service"**
3. Conecta tu repositorio de GitHub
4. Selecciona el repositorio: `chichermo/heliopsisvideo`

### 2.2 Configuración del Servicio

- **Name**: `heliopsis-video` (o el nombre que prefieras)
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: `Free` (para empezar)

## 🔑 PASO 3: Configurar Variables de Entorno

### 3.1 En el Dashboard de Render

1. Ve a tu servicio web
2. Pestaña **"Environment"**
3. Agrega estas variables:

```env
GOOGLE_CLIENT_ID=tu_client_id_aqui
GOOGLE_CLIENT_SECRET=tu_client_secret_aqui
GOOGLE_REDIRECT_URI=https://tu-app.onrender.com/api/googledrive/callback
GOOGLE_REFRESH_TOKEN=tu_nuevo_refresh_token_aqui
VIDEO_FILE_ID=tu_video_file_id_de_google_drive
PORT=10000
JWT_SECRET=tu_jwt_secret_super_seguro_aqui
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
DB_PATH=./database/access_tokens.db
```

### 3.2 Variables Críticas

- **GOOGLE_REDIRECT_URI**: Debe coincidir con tu dominio de Render
- **GOOGLE_REFRESH_TOKEN**: El nuevo token obtenido en paso 1.2
- **PORT**: Render usa puerto 10000 por defecto

## 🚀 PASO 4: Desplegar

### 4.1 Despliegue Automático

1. Render detectará automáticamente los cambios en GitHub
2. Se ejecutará `npm install` para instalar dependencias
3. Se ejecutará `npm start` para iniciar el servicio

### 4.2 Verificar Despliegue

1. Ve a la pestaña **"Events"** para ver el progreso
2. Espera a que aparezca **"Deploy successful"**
3. Tu URL será: `https://tu-app.onrender.com`

## ✅ PASO 5: Verificar Funcionamiento

### 5.1 Probar Endpoints

- **Panel Admin**: `https://tu-app.onrender.com/admin`
- **API Status**: `https://tu-app.onrender.com/`
- **Health Check**: Render verificará automáticamente

### 5.2 Probar Google Drive

1. Ve a tu panel admin
2. Pestaña "Google Drive"
3. Verifica que muestre "Conectado"
4. Prueba generar un token

## 🔧 PASO 6: Configuración Avanzada

### 6.1 Custom Domain (Opcional)

1. Ve a **"Settings"** > **"Custom Domains"**
2. Agrega tu dominio personalizado
3. Configura DNS según las instrucciones

### 6.2 Auto-Deploy

- **Branch**: `main` (se despliega automáticamente)
- **Pull Request**: Se puede configurar para preview

## 🚨 Solución de Problemas

### Error: "Build failed"

- Verifica que `package.json` tenga `"start": "node server.js"`
- Revisa los logs de build en Render

### Error: "Application error"

- Verifica las variables de entorno
- Revisa los logs de runtime en Render
- Asegúrate de que `PORT=10000`

### Error: "Google Drive no conecta"

- Verifica `GOOGLE_REDIRECT_URI` en Google Cloud Console
- Obtén un nuevo `GOOGLE_REFRESH_TOKEN`
- Verifica que las variables estén correctas en Render

## 📊 Monitoreo

### Logs en Tiempo Real

1. Ve a tu servicio en Render
2. Pestaña **"Logs"**
3. Monitorea errores y actividad

### Métricas

- **Uptime**: Render muestra el estado del servicio
- **Response Time**: Monitorea el rendimiento
- **Errors**: Revisa logs para problemas

## 🔒 Seguridad en Producción

### Variables Sensibles

- **NUNCA** subas `.env` a GitHub
- Usa variables de entorno de Render
- Rota `JWT_SECRET` regularmente

### Rate Limiting

- Configurado automáticamente
- Ajusta según tus necesidades en `render.env.example`

## 🎉 ¡Listo!

Tu sistema de control de acceso a videos está ahora:
- ✅ **Desplegado en la nube**
- ✅ **Accesible desde internet**
- ✅ **Con SSL automático**
- ✅ **Con monitoreo automático**
- ✅ **Listo para eventos de pago**

## 📞 Soporte

- **Render Docs**: [docs.render.com](https://docs.render.com)
- **Render Support**: [support.render.com](https://support.render.com)
- **GitHub Issues**: Para problemas del código
