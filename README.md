# 🎬 Heliopsis Video - Control de Acceso a Videos

Sistema profesional de control de acceso a videos con Google Drive, diseñado para eventos de pago y distribución controlada de contenido multimedia.

## ✨ Características

- **🔐 Control de Acceso Seguro**: Tokens únicos con restricciones por email
- **☁️ Integración con Google Drive**: Streaming directo desde la nube
- **📊 Panel de Administración**: Gestión completa de tokens y videos
- **🛡️ Seguridad Avanzada**: Validación de email, límites de visualización y dispositivos
- **📱 Responsive**: Funciona en todos los dispositivos
- **⚡ Alto Rendimiento**: Optimizado para videos de gran tamaño (20GB+)

## 🚀 Instalación

### Prerrequisitos
- Node.js 16+ 
- npm o yarn
- Cuenta de Google Cloud con Drive API habilitada

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/chichermo/heliopsisvideo.git
cd heliopsisvideo
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tus credenciales de Google Drive
```

4. **Ejecutar el servidor**
```bash
npm run dev
```

## ⚙️ Configuración

### Variables de Entorno (.env)
```env
# Google Drive API
GOOGLE_CLIENT_ID=tu_client_id
GOOGLE_CLIENT_SECRET=tu_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/googledrive/callback
GOOGLE_REFRESH_TOKEN=tu_refresh_token

# Servidor
PORT=3001
JWT_SECRET=tu_jwt_secret_super_seguro

# Videos
VIDEO_FILE_ID=id_del_video_en_google_drive
```

## 🔧 Uso

### Panel de Administración
- **URL**: `http://localhost:3001/admin`
- **Funcionalidades**:
  - Generar tokens individuales y en lote
  - Gestionar videos permitidos
  - Monitorear estadísticas de uso
  - Control de acceso por email

### Generar Tokens
1. Ve a la pestaña "🔑 Generar Tokens"
2. Completa el formulario con:
   - Email del comprador (OBLIGATORIO)
   - ID del video en Google Drive
   - Tiempo de expiración
   - Máximo de vistas
   - Notas adicionales

### Acceso a Videos
- **URL**: `http://localhost:3001/watch/[TOKEN]`
- **Validación**: Solo el email autorizado puede acceder
- **Seguridad**: Bloqueo de compartir y control de dispositivos

## 🏗️ Arquitectura

```
├── server.js              # Servidor principal
├── routes/                # Rutas de la API
│   ├── access.js         # Control de acceso y tokens
│   ├── googledrive.js    # Integración con Google Drive
│   └── videos.js         # Gestión de videos
├── public/               # Frontend estático
│   ├── admin.html       # Panel de administración
│   └── player.html      # Reproductor de video
├── database/            # Base de datos SQLite
└── config/             # Configuraciones
```

## 🔒 Seguridad

- **Validación de Email**: Acceso restringido por email específico
- **Tokens Únicos**: Cada token es único y no transferible
- **Límites de Uso**: Control de vistas y dispositivos
- **JWT Seguro**: Autenticación robusta
- **Rate Limiting**: Protección contra abuso

## 📱 Despliegue

### Plataformas Recomendadas
- **Render**: Fácil y gratuito para empezar
- **Railway**: Excelente para proyectos Node.js
- **Heroku**: Profesional y escalable

### Variables de Producción
- Cambiar `PORT` según la plataforma
- Configurar `GOOGLE_REDIRECT_URI` para producción
- Usar `JWT_SECRET` fuerte y único

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 📞 Soporte

- **Issues**: [GitHub Issues](https://github.com/chichermo/heliopsisvideo/issues)
- **Email**: [Tu email de contacto]

## 🙏 Agradecimientos

- Google Drive API
- Express.js
- SQLite
- Comunidad de desarrolladores

---

**Desarrollado con ❤️ para eventos profesionales de video**
