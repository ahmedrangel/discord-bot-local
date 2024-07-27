# Discord YouTube Player
Bot de música para Discord capaz de reproducir contenido de YouTube y operar en múltiples servidores simultáneamente. (discord.js v14)

# Instalar
```sh
# install dependencies
pnpm i

# run server (http://localhost:3000)
pnpm start

```

# Características de bot
- Operar en múltiples servidores simultáneamente
- Usuarios pueden solicitar canciones mediante texto o links con el comando (`!gplay` por defecto)
- Embeds con buen diseño
- Reproductor interactivo a través de botones.
    - <img src="https://github.com/ahmedrangel/discord-youtube-player/assets/50090595/f8121fd0-0125-498a-adb1-29f298ba88ed" width="24"> `Apagar`
    - <img src="https://github.com/ahmedrangel/discord-youtube-player/assets/50090595/7da2d88e-fee0-4cf1-8098-c2870bb352ec" width="24"> / <img src="https://github.com/ahmedrangel/discord-youtube-player/assets/50090595/e8074770-54f8-4952-b5be-21b82ea34e55" width="24"> `Pausar`/`Reproducir`
    - <img src="https://github.com/ahmedrangel/discord-youtube-player/assets/50090595/f7607641-6c9b-4330-b6fa-1dfd86bb55fa" width="24"> `Saltar`
    - <img src="https://github.com/ahmedrangel/discord-youtube-player/assets/50090595/7625fef4-055d-4675-ae9d-f5ced82ec373" width="24"> `Listar` cola de canciones
    - <img src="https://github.com/ahmedrangel/discord-youtube-player/assets/50090595/88978ee0-2b81-4a26-b167-ba5a4920d993" width="24"> `Limpiar` cola de canciones
- Deshabilitación de botones cuando ya no son necesarios
- Se desconecta cuando finaliza la última canción

# Características de aplicación
- Los reproductores y las colas de canciones de cada servidor se guardan como datos KV (key/value) en un archivo `db.sqlite` con el ID del servidor de discord que pertenece cada uno
- Los reproductores se eliminan al reiniciar la aplicación para evitar errores, pero la cola de canciones se mantiene guardada

# Variables de ambiente ENV
- `DISCORD_TOKEN`: El token del bot

# Capturas
![image](https://github.com/ahmedrangel/discord-youtube-player/assets/50090595/13cb220d-4f12-40f4-9944-02df44c7a8a6)
