// config.example.js
// Copia este archivo como config.js y completa tus credenciales

module.exports = {
    // Token del bot de Discord
    // Obtén uno en: https://discord.com/developers/applications
    token: 'TU_TOKEN_DE_DISCORD_AQUI',
    
    // Configuración de YouTube API
    // Obtén una API key en: https://console.developers.google.com/
    youtube: {
        apiKey: 'TU_API_KEY_DE_YOUTUBE_AQUI'
    },
    
    // Configuración de Spotify API
    // Obtén las credenciales en: https://developer.spotify.com/dashboard/
    spotify: {
        clientId: 'TU_SPOTIFY_CLIENT_ID_AQUI',
        clientSecret: 'TU_SPOTIFY_CLIENT_SECRET_AQUI'
    },
    
    // Prefijo por defecto del bot
    defaultPrefix: 'm!',
    
    // Configuración opcional
    options: {
        // Volumen por defecto (0.0 - 1.0)
        defaultVolume: 0.5,
        
        // Máximo de canciones en cola por usuario
        maxQueueSize: 100,
        
        // Tiempo de inactividad antes de desconectar (en minutos)
        inactivityTimeout: 5,
        
        // Activar logs detallados
        debug: false
    },
    
    // Configuración de permisos
    permissions: {
        // Roles que pueden usar comandos de administración
        adminRoles: ['Admin', 'Moderador', 'DJ'],
        
        // Usuarios con permisos especiales (por ID)
        superUsers: ['TU_USER_ID_AQUI'],
        
        // Canales donde el bot puede responder (vacío = todos)
        allowedChannels: []
    }
};
