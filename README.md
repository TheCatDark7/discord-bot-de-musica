# 🎵 Discord Music Bot

Un bot de Discord avanzado para reproducir música desde **YouTube**, **Spotify** y **SoundCloud** con interfaz interactiva y prefijos personalizables.

[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![Discord.js](https://img.shields.io/badge/Discord.js-14.x-blue.svg)](https://discord.js.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

## ✨ Características

### 🎵 **Múltiples Plataformas**
- **YouTube** - Reproducción directa de videos y búsqueda
- **Spotify** - Integración completa con búsqueda y conversión
- **SoundCloud** - Soporte nativo para pistas

### 🎛️ **Control Avanzado**
- Cola de reproducción inteligente
- Modo bucle para canciones
- Control de volumen dinámico
- Pausa, reanudación y salto de canciones
- Búsqueda multi-plataforma simultánea

### ⚙️ **Personalización**
- **Prefijos personalizables** por servidor (default: `m!`)
- **Menú interactivo** con botones de Discord
- **Configuración persistente** guardada automáticamente
- **Sistema de permisos** configurable

### 📱 **Interfaz Moderna**
- Menú principal con navegación por botones
- Embeds informativos y coloridos
- Respuestas en tiempo real
- Organización intuitiva de comandos

## 🚀 Instalación Rápida

### Prerrequisitos
- [Node.js](https://nodejs.org/) v16 o superior
- [FFmpeg](https://ffmpeg.org/) instalado en el sistema
- Bot de Discord creado
- APIs configuradas (YouTube, Spotify)

### 1. Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/discord-music-bot.git
cd discord-music-bot
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar el Bot
```bash
cp config.example.js config.js
```

Edita `config.js` con tus credenciales:
```javascript
module.exports = {
    token: 'TU_TOKEN_DE_DISCORD',
    youtube: {
        apiKey: 'TU_API_KEY_DE_YOUTUBE'
    },
    spotify: {
        clientId: 'TU_SPOTIFY_CLIENT_ID',
        clientSecret: 'TU_SPOTIFY_CLIENT_SECRET'
    }
};
```

### 4. Ejecutar el Bot
```bash
npm start
```

## 📋 Comandos

### 🎵 **Reproducción**
| Comando | Descripción | Ejemplo |
|---------|-------------|---------|
| `m!play <url/búsqueda>` | Reproduce música o añade a la cola | `m!play bohemian rhapsody` |
| `m!join` | Une el bot a tu canal de voz | `m!join` |
| `m!leave` | Desconecta el bot del canal | `m!leave` |
| `m!nowplaying` | Muestra la canción actual | `m!np` |

### 📝 **Gestión de Cola**
| Comando | Descripción | Ejemplo |
|---------|-------------|---------|
| `m!queue` | Muestra la cola de reproducción | `m!q` |
| `m!clear` | Limpia toda la cola | `m!clear` |
| `m!remove <número>` | Elimina canción específica | `m!remove 3` |
| `m!shuffle` | Mezcla la cola aleatoriamente | `m!shuffle` |

### 🎛️ **Control**
| Comando | Descripción | Ejemplo |
|---------|-------------|---------|
| `m!pause` | Pausa la reproducción | `m!pause` |
| `m!resume` | Reanuda la reproducción | `m!resume` |
| `m!skip` | Salta a la siguiente canción | `m!s` |
| `m!stop` | Detiene y limpia todo | `m!stop` |
| `m!loop` | Activa/desactiva bucle | `m!loop` |

### 🔍 **Búsqueda**
| Comando | Descripción | Ejemplo |
|---------|-------------|---------|
| `m!search <término>` | Busca en todas las plataformas | `m!search imagine dragons` |
| `m!youtube <término>` | Busca solo en YouTube | `m!yt despacito` |
| `m!spotify <término>` | Busca solo en Spotify | `m!spotify taylor swift` |
| `m!soundcloud <término>` | Busca solo en SoundCloud | `m!sc electronic music` |

### ⚙️ **Configuración**
| Comando | Descripción | Ejemplo |
|---------|-------------|---------|
| `m!setprefix <prefijo>` | Cambia el prefijo del servidor | `m!setprefix !` |
| `m!volume <0-100>` | Ajusta el volumen | `m!volume 75` |
| `m!` | Muestra el menú interactivo | `m!help` |

## 🛠️ Configuración de APIs

### 🎥 YouTube Data API

1. Ve a [Google Cloud Console](https://console.developers.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la **YouTube Data API v3**
4. Crea credenciales → **API Key**
5. Copia la API Key a tu `config.js`

### 🎵 Spotify Web API

1. Ve a [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
2. Crea una nueva aplicación
3. Copia el **Client ID** y **Client Secret**
4. Pégalos en tu `config.js`

### 🤖 Discord Bot

1. Ve a [Discord Developer Portal](https://discord.com/developers/applications)
2. Crea una nueva aplicación
3. Ve a la sección **Bot**
4. Crea un bot y copia el **Token**
5. Habilita **Message Content Intent**
6. Invita el bot a tu servidor con permisos necesarios

## 📁 Estructura del Proyecto

```
discord-music-bot/
├── 📄 bot.js                 # Archivo principal del bot
├── 📄 package.json           # Dependencias y scripts
├── 📄 config.example.js      # Plantilla de configuración
├── 📁 commands/              # Comandos organizados (opcional)
├── 📁 events/               # Eventos del bot (opcional)
├── 📁 utils/                # Utilidades y helpers
├── 📄 .gitignore            # Archivos ignorados por Git
├── 📄 README.md             # Este archivo
├── 📄 LICENSE               # Licencia MIT
└── 📄 CHANGELOG.md          # Historial de cambios
```

## 🔧 Scripts NPM

```bash
# Iniciar el bot
npm start

# Modo desarrollo con auto-reinicio
npm run dev

# Verificar sintaxis
npm run lint

# Ejecutar tests (si están configurados)
npm test
```

## 🐳 Docker (Opcional)

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
CMD ["npm", "start"]
```

```bash
# Construir imagen
docker build -t discord-music-bot .

# Ejecutar contenedor
docker run -d --name music-bot discord-music-bot
```

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add: Amazing Feature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

Lee [CONTRIBUTING.md](./CONTRIBUTING.md) para más detalles.

## 📝 Changelog

### v1.0.0 (2025-06-07)
- ✅ Lanzamiento inicial
- ✅ Soporte para YouTube, Spotify y SoundCloud
- ✅ Sistema de prefijos personalizables
- ✅ Menú interactivo con botones
- ✅ Cola de reproducción avanzada
- ✅ Comandos de control completos

Ver [CHANGELOG.md](./CHANGELOG.md) para historial completo.

## ❓ FAQ

### **¿Por qué el bot no reproduce música de Spotify directamente?**
Spotify no permite streaming directo por términos de servicio. El bot busca la canción en YouTube y la reproduce desde ahí.

### **¿Necesito FFmpeg?**
Sí, FFmpeg es necesario para procesar el audio. Instálalo según tu sistema operativo.

### **¿El bot funciona 24/7?**
Depende de dónde lo alojes. Para uso 24/7, considera servicios como Heroku, Railway, o un VPS.

### **¿Puedo modificar el bot?**
¡Por supuesto! El código es open source bajo licencia MIT.

## 🛡️ Seguridad

- **Nunca** compartas tu `config.js` públicamente
- Usa variables de entorno en producción
- Regenera tokens si se comprometen
- Revisa permisos del bot regularmente

## 📞 Soporte

- 🐛 **Reportar bugs**: [Issues](https://github.com/tu-usuario/discord-music-bot/issues)
- 💡 **Sugerir features**: [Discussions](https://github.com/tu-usuario/discord-music-bot/discussions)
- 📧 **Contacto**: tu-email@ejemplo.com

## 📜 Licencia

Este proyecto está bajo la Licencia MIT. Ver [LICENSE](./LICENSE) para más detalles.

## 🌟 Agradecimientos

- [Discord.js](https://discord.js.org/) - Librería principal
- [ytdl-core](https://github.com/fent/node-ytdl-core) - Descarga de YouTube
- [Spotify Web API](https://developer.spotify.com/) - Integración Spotify
- Comunidad de Discord por el feedback

---

⭐ **¡No olvides darle una estrella al repo si te gustó!** ⭐

<div align="center">
  
**[⬆ Volver arriba](#-discord-music-bot)**

Made with ❤️ by [Tu Nombre](https://github.com/tu-usuario)

</div>
