const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const { google } = require('googleapis');
const SpotifyWebApi = require('spotify-web-api-node');
const SoundCloud = require('soundcloud-downloader').default;
const fs = require('fs');
const path = require('path');

// Configuración del bot
const config = {
    token: 'TU_TOKEN_DE_DISCORD',
    youtube: {
        apiKey: 'TU_API_KEY_DE_YOUTUBE'
    },
    spotify: {
        clientId: 'TU_SPOTIFY_CLIENT_ID',
        clientSecret: 'TU_SPOTIFY_CLIENT_SECRET'
    },
    defaultPrefix: 'm!'
};

// Inicializar cliente de Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

// Inicializar APIs
const youtube = google.youtube({ version: 'v3', auth: config.youtube.apiKey });
const spotifyApi = new SpotifyWebApi({
    clientId: config.spotify.clientId,
    clientSecret: config.spotify.clientSecret
});

// Base de datos simple para prefijos personalizados
const guildPrefixes = new Map();
const musicQueues = new Map();
const audioPlayers = new Map();

// Cargar prefijos guardados
function loadPrefixes() {
    try {
        if (fs.existsSync('prefixes.json')) {
            const data = fs.readFileSync('prefixes.json', 'utf8');
            const prefixes = JSON.parse(data);
            for (const [guildId, prefix] of Object.entries(prefixes)) {
                guildPrefixes.set(guildId, prefix);
            }
        }
    } catch (error) {
        console.error('Error cargando prefijos:', error);
    }
}

// Guardar prefijos
function savePrefixes() {
    try {
        const prefixObject = Object.fromEntries(guildPrefixes);
        fs.writeFileSync('prefixes.json', JSON.stringify(prefixObject, null, 2));
    } catch (error) {
        console.error('Error guardando prefijos:', error);
    }
}

// Obtener prefijo del servidor
function getPrefix(guildId) {
    return guildPrefixes.get(guildId) || config.defaultPrefix;
}

// Configurar Spotify
async function setupSpotify() {
    try {
        const data = await spotifyApi.clientCredentialsGrant();
        spotifyApi.setAccessToken(data.body['access_token']);
        console.log('Spotify API configurado correctamente');
        
        // Renovar token cada hora
        setInterval(async () => {
            try {
                const data = await spotifyApi.clientCredentialsGrant();
                spotifyApi.setAccessToken(data.body['access_token']);
            } catch (error) {
                console.error('Error renovando token de Spotify:', error);
            }
        }, 3600000);
    } catch (error) {
        console.error('Error configurando Spotify:', error);
    }
}

// Clase para manejar la cola de música
class MusicQueue {
    constructor(guildId) {
        this.guildId = guildId;
        this.queue = [];
        this.currentSong = null;
        this.isPlaying = false;
        this.volume = 0.5;
        this.loop = false;
        this.connection = null;
        this.player = null;
    }

    add(song) {
        this.queue.push(song);
    }

    next() {
        if (this.loop && this.currentSong) {
            return this.currentSong;
        }
        return this.queue.shift();
    }

    clear() {
        this.queue = [];
        this.currentSong = null;
    }
}

// Buscar en YouTube
async function searchYouTube(query, maxResults = 5) {
    try {
        const response = await youtube.search.list({
            part: 'snippet',
            q: query,
            type: 'video',
            maxResults: maxResults
        });

        return response.data.items.map(item => ({
            title: item.snippet.title,
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
            thumbnail: item.snippet.thumbnails.medium.url,
            duration: 'N/A',
            platform: 'YouTube'
        }));
    } catch (error) {
        console.error('Error buscando en YouTube:', error);
        return [];
    }
}

// Buscar en Spotify
async function searchSpotify(query, maxResults = 5) {
    try {
        const response = await spotifyApi.searchTracks(query, { limit: maxResults });
        const tracks = response.body.tracks.items;

        return tracks.map(track => ({
            title: `${track.artists[0].name} - ${track.name}`,
            url: track.external_urls.spotify,
            thumbnail: track.album.images[1]?.url || track.album.images[0]?.url,
            duration: Math.floor(track.duration_ms / 1000),
            platform: 'Spotify',
            spotifyId: track.id
        }));
    } catch (error) {
        console.error('Error buscando en Spotify:', error);
        return [];
    }
}

// Buscar en SoundCloud
async function searchSoundCloud(query, maxResults = 5) {
    try {
        const tracks = await SoundCloud.search({
            query: query,
            limit: maxResults,
            resourceType: 'tracks'
        });

        return tracks.map(track => ({
            title: `${track.user.username} - ${track.title}`,
            url: track.permalink_url,
            thumbnail: track.artwork_url,
            duration: Math.floor(track.duration / 1000),
            platform: 'SoundCloud'
        }));
    } catch (error) {
        console.error('Error buscando en SoundCloud:', error);
        return [];
    }
}

// Reproducir música
async function playMusic(guildId, voiceChannel, textChannel) {
    const queue = musicQueues.get(guildId);
    if (!queue || queue.queue.length === 0) {
        queue.isPlaying = false;
        return;
    }

    const song = queue.next();
    queue.currentSong = song;
    queue.isPlaying = true;

    try {
        // Conectar al canal de voz si no está conectado
        if (!queue.connection) {
            queue.connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: guildId,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            });
        }

        // Crear reproductor si no existe
        if (!queue.player) {
            queue.player = createAudioPlayer();
            queue.connection.subscribe(queue.player);
        }

        let resource;
        
        // Obtener recurso según la plataforma
        if (song.platform === 'YouTube') {
            const stream = ytdl(song.url, {
                filter: 'audioonly',
                highWaterMark: 1 << 25
            });
            resource = createAudioResource(stream, { inputType: 'webm/opus' });
        } else if (song.platform === 'SoundCloud') {
            const stream = await SoundCloud.downloadFormat(song.url, SoundCloud.FORMATS.MP3);
            resource = createAudioResource(stream);
        } else {
            // Para Spotify, buscar equivalente en YouTube
            const youtubeResults = await searchYouTube(song.title, 1);
            if (youtubeResults.length > 0) {
                const stream = ytdl(youtubeResults[0].url, {
                    filter: 'audioonly',
                    highWaterMark: 1 << 25
                });
                resource = createAudioResource(stream, { inputType: 'webm/opus' });
            }
        }

        if (resource) {
            queue.player.play(resource);

            // Embed de "Reproduciendo ahora"
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('🎵 Reproduciendo ahora')
                .setDescription(`**${song.title}**`)
                .addFields(
                    { name: 'Plataforma', value: song.platform, inline: true },
                    { name: 'Duración', value: formatDuration(song.duration), inline: true }
                )
                .setThumbnail(song.thumbnail)
                .setTimestamp();

            textChannel.send({ embeds: [embed] });

            // Manejar eventos del reproductor
            queue.player.on(AudioPlayerStatus.Idle, () => {
                if (!queue.loop) {
                    queue.currentSong = null;
                }
                playMusic(guildId, voiceChannel, textChannel);
            });
        }
    } catch (error) {
        console.error('Error reproduciendo música:', error);
        textChannel.send('❌ Error al reproducir la canción');
        playMusic(guildId, voiceChannel, textChannel);
    }
}

// Formatear duración
function formatDuration(seconds) {
    if (seconds === 'N/A' || !seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Crear menú principal
function createMainMenu(prefix) {
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('🎵 Bot de Música - Menú Principal')
        .setDescription('Selecciona una categoría para ver los comandos disponibles')
        .addFields(
            { name: '🎶 Reproducción', value: `Comandos de reproducción de música`, inline: true },
            { name: '📝 Cola', value: `Gestión de la cola de reproducción`, inline: true },
            { name: '⚙️ Configuración', value: `Configuración del bot`, inline: true },
            { name: '🔍 Búsqueda', value: `Búsqueda en diferentes plataformas`, inline: true },
            { name: '🎛️ Control', value: `Control de reproducción`, inline: true },
            { name: 'ℹ️ Información', value: `Información y ayuda`, inline: true }
        )
        .setFooter({ text: `Prefijo actual: ${prefix}` })
        .setTimestamp();

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('menu_playback')
                .setLabel('🎶 Reproducción')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('menu_queue')
                .setLabel('📝 Cola')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('menu_config')
                .setLabel('⚙️ Config')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('menu_search')
                .setLabel('🔍 Búsqueda')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('menu_control')
                .setLabel('🎛️ Control')
                .setStyle(ButtonStyle.Primary)
        );

    return { embeds: [embed], components: [row] };
}

// Crear submenús
function createSubMenu(type, prefix) {
    const embeds = {
        playback: new EmbedBuilder()
            .setColor('#ff6b6b')
            .setTitle('🎶 Comandos de Reproducción')
            .addFields(
                { name: `${prefix}play <url/búsqueda>`, value: 'Reproduce una canción o la añade a la cola' },
                { name: `${prefix}join`, value: 'Une el bot a tu canal de voz' },
                { name: `${prefix}leave`, value: 'Desconecta el bot del canal de voz' },
                { name: `${prefix}nowplaying`, value: 'Muestra la canción actual' }
            ),
        queue: new EmbedBuilder()
            .setColor('#4ecdc4')
            .setTitle('📝 Gestión de Cola')
            .addFields(
                { name: `${prefix}queue`, value: 'Muestra la cola actual' },
                { name: `${prefix}clear`, value: 'Limpia toda la cola' },
                { name: `${prefix}remove <número>`, value: 'Elimina una canción de la cola' },
                { name: `${prefix}shuffle`, value: 'Mezcla la cola aleatoriamente' }
            ),
        config: new EmbedBuilder()
            .setColor('#45b7d1')
            .setTitle('⚙️ Configuración')
            .addFields(
                { name: `${prefix}setprefix <nuevo_prefijo>`, value: 'Cambia el prefijo del bot' },
                { name: `${prefix}volume <0-100>`, value: 'Ajusta el volumen' },
                { name: `${prefix}loop`, value: 'Activa/desactiva el modo bucle' }
            ),
        search: new EmbedBuilder()
            .setColor('#f7b731')
            .setTitle('🔍 Búsqueda')
            .addFields(
                { name: `${prefix}youtube <búsqueda>`, value: 'Busca en YouTube' },
                { name: `${prefix}spotify <búsqueda>`, value: 'Busca en Spotify' },
                { name: `${prefix}soundcloud <búsqueda>`, value: 'Busca en SoundCloud' },
                { name: `${prefix}search <búsqueda>`, value: 'Busca en todas las plataformas' }
            ),
        control: new EmbedBuilder()
            .setColor('#5f27cd')
            .setTitle('🎛️ Control de Reproducción')
            .addFields(
                { name: `${prefix}pause`, value: 'Pausa la reproducción' },
                { name: `${prefix}resume`, value: 'Reanuda la reproducción' },
                { name: `${prefix}skip`, value: 'Salta a la siguiente canción' },
                { name: `${prefix}stop`, value: 'Detiene la reproducción y limpia la cola' }
            )
    };

    const backButton = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('menu_back')
                .setLabel('⬅️ Volver')
                .setStyle(ButtonStyle.Secondary)
        );

    return { embeds: [embeds[type]], components: [backButton] };
}

// Eventos del cliente
client.once('ready', async () => {
    console.log(`✅ ${client.user.tag} está online!`);
    loadPrefixes();
    await setupSpotify();
    
    // Establecer estado del bot
    client.user.setActivity('música 🎵', { type: 'LISTENING' });
});

// Manejar mensajes
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const prefix = getPrefix(message.guild.id);
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // Comando del menú principal
    if (command === '' || command === 'help' || command === 'menu') {
        const menuMessage = createMainMenu(prefix);
        return message.reply(menuMessage);
    }

    // Comando para cambiar prefijo
    if (command === 'setprefix') {
        if (!message.member.permissions.has('MANAGE_GUILD')) {
            return message.reply('❌ No tienes permisos para cambiar el prefijo');
        }

        const newPrefix = args[0];
        if (!newPrefix) {
            return message.reply(`❌ Uso: ${prefix}setprefix <nuevo_prefijo>`);
        }

        guildPrefixes.set(message.guild.id, newPrefix);
        savePrefixes();
        return message.reply(`✅ Prefijo cambiado a: \`${newPrefix}\``);
    }

    // Inicializar cola de música si no existe
    if (!musicQueues.has(message.guild.id)) {
        musicQueues.set(message.guild.id, new MusicQueue(message.guild.id));
    }

    const queue = musicQueues.get(message.guild.id);

    // Comandos de música
    switch (command) {
        case 'play':
        case 'p':
            if (!args.length) {
                return message.reply(`❌ Uso: ${prefix}play <url o búsqueda>`);
            }

            const voiceChannel = message.member.voice.channel;
            if (!voiceChannel) {
                return message.reply('❌ Debes estar en un canal de voz');
            }

            const query = args.join(' ');
            let songs = [];

            // Detectar si es una URL o búsqueda
            if (query.includes('youtube.com') || query.includes('youtu.be')) {
                songs = [{ title: 'Video de YouTube', url: query, platform: 'YouTube' }];
            } else if (query.includes('spotify.com')) {
                songs = [{ title: 'Pista de Spotify', url: query, platform: 'Spotify' }];
            } else if (query.includes('soundcloud.com')) {
                songs = [{ title: 'Pista de SoundCloud', url: query, platform: 'SoundCloud' }];
            } else {
                songs = await searchYouTube(query, 1);
            }

            if (songs.length === 0) {
                return message.reply('❌ No se encontraron resultados');
            }

            queue.add(songs[0]);
            message.reply(`✅ Añadido a la cola: **${songs[0].title}**`);

            if (!queue.isPlaying) {
                playMusic(message.guild.id, voiceChannel, message.channel);
            }
            break;

        case 'skip':
        case 's':
            if (!queue.isPlaying) {
                return message.reply('❌ No hay música reproduciéndose');
            }
            queue.player.stop();
            message.reply('⏭️ Canción saltada');
            break;

        case 'stop':
            queue.clear();
            if (queue.player) queue.player.stop();
            if (queue.connection) queue.connection.destroy();
            queue.connection = null;
            queue.player = null;
            queue.isPlaying = false;
            message.reply('⏹️ Reproducción detenida y cola limpia');
            break;

        case 'queue':
        case 'q':
            if (queue.queue.length === 0) {
                return message.reply('📝 La cola está vacía');
            }

            const queueEmbed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('📝 Cola de Reproducción')
                .setDescription(
                    queue.queue.slice(0, 10).map((song, index) => 
                        `${index + 1}. **${song.title}** (${song.platform})`
                    ).join('\n')
                )
                .setFooter({ text: `${queue.queue.length} canciones en total` });

            message.reply({ embeds: [queueEmbed] });
            break;

        case 'clear':
            queue.clear();
            message.reply('🗑️ Cola limpia');
            break;

        case 'nowplaying':
        case 'np':
            if (!queue.currentSong) {
                return message.reply('❌ No hay música reproduciéndose');
            }

            const npEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('🎵 Reproduciendo ahora')
                .setDescription(`**${queue.currentSong.title}**`)
                .addFields(
                    { name: 'Plataforma', value: queue.currentSong.platform, inline: true },
                    { name: 'Bucle', value: queue.loop ? 'Activado' : 'Desactivado', inline: true }
                )
                .setThumbnail(queue.currentSong.thumbnail);

            message.reply({ embeds: [npEmbed] });
            break;

        case 'loop':
            queue.loop = !queue.loop;
            message.reply(`🔄 Bucle ${queue.loop ? 'activado' : 'desactivado'}`);
            break;

        case 'search':
            if (!args.length) {
                return message.reply(`❌ Uso: ${prefix}search <búsqueda>`);
            }

            const searchQuery = args.join(' ');
            const [ytResults, spotifyResults, scResults] = await Promise.all([
                searchYouTube(searchQuery, 3),
                searchSpotify(searchQuery, 3),
                searchSoundCloud(searchQuery, 3)
            ]);

            const searchEmbed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`🔍 Resultados para: ${searchQuery}`)
                .addFields(
                    { 
                        name: '🎥 YouTube', 
                        value: ytResults.length > 0 ? ytResults.map((r, i) => `${i+1}. ${r.title}`).join('\n') : 'Sin resultados',
                        inline: false
                    },
                    { 
                        name: '🎵 Spotify', 
                        value: spotifyResults.length > 0 ? spotifyResults.map((r, i) => `${i+1}. ${r.title}`).join('\n') : 'Sin resultados',
                        inline: false
                    },
                    { 
                        name: '🔊 SoundCloud', 
                        value: scResults.length > 0 ? scResults.map((r, i) => `${i+1}. ${r.title}`).join('\n') : 'Sin resultados',
                        inline: false
                    }
                );

            message.reply({ embeds: [searchEmbed] });
            break;

        default:
            message.reply(`❌ Comando no reconocido. Usa \`${prefix}\` para ver el menú`);
    }
});

// Manejar interacciones de botones
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    const prefix = getPrefix(interaction.guild.id);

    switch (interaction.customId) {
        case 'menu_back':
            const mainMenu = createMainMenu(prefix);
            await interaction.update(mainMenu);
            break;
        
        case 'menu_playback':
        case 'menu_queue':
        case 'menu_config':
        case 'menu_search':
        case 'menu_control':
            const menuType = interaction.customId.split('_')[1];
            const subMenu = createSubMenu(menuType, prefix);
            await interaction.update(subMenu);
            break;
    }
});

// Iniciar el bot
client.login(config.token);

// Exportar para uso modular
module.exports = {
    client,
    config,
    MusicQueue,
    searchYouTube,
    searchSpotify,
    searchSoundCloud
};
