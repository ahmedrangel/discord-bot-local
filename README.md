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
- Reproductor interactivo a través de botones
    - `Apagar`
    - `Pausar`/`Reproducir`
    - `Saltar`
    - `Listar` cola de canciones
    - `Limpiar` cola de canciones
- Deshabilitación de botones cuando ya no son necesarios
- Se desconecta cuando finaliza la última canción

# Características de servidor
- Los reproductores y las colas de canciones de cada servidor se guardan como datos KV (key/value) en un archivo `db.sqlite` con el ID del servidor de discord que pertenece cada uno
- Los reproductores se eliminan al reiniciar la aplicación para evitar errores, pero la cola de canciones se mantiene guardada

# Variables de ambiente ENV
- `DISCORD_TOKEN`: El token del bot
- `YT_COOKIE` (*opcional*): Cookies de una cuenta de YouTube para la posibilidad de reproducir videos con restricciones (edad, privado, etc.)
- `YT_ID_TOKEN` (*opcional*): Si usas las cookies de una cuenta, también será necesario su Identity Token. [Aquí](https://github.com/fent/node-ytdl-core/issues/661#issuecomment-654042939) comentan como obtenerlo