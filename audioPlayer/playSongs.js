import { createAudioResource } from "@discordjs/voice";
import { ComponentType, ButtonStyle } from "discord.js";
import ytdl from "ytdl-core";
import { playerEmojis } from "../utils/emojis.js";
import { playerButtons } from "../utils/playerButtons.js";
import { CONSTANTS } from "../utils/constants.js";
import { _dirname } from "../projectPath.js";
import Keyv from "keyv";
import { totalDuration } from "../utils/helpers.js";
import { reqConfig } from "../utils/ytdlReqConfig.js";

const keyv = new Keyv("sqlite://" + _dirname + "/db.sqlite");
const { color } = CONSTANTS;
let response = {}, connected = {};
let globalEmbeds = {}, globalComponents = {};
let previousSong;

export const playSongs = async (player, event, connection, isIdle) => {
  const embeds = [], fields = [], components = [];
  const musicQueue = JSON.parse(await keyv.get(`musicQueue-${event.guildId}`)); // get Queue
  const nextSong = musicQueue[0]; // get Current Song
  const isPlaying = await keyv.get(`player-${event.guildId}`);
  connected[event.guildId] = !connection ? false : true;
  // if idle disable all buttons
  if (isIdle) {
    await keyv.set(`player-${event.guildId}`, false);
    playerButtons.forEach ((b) => {
      b.disabled = true;
    });
    globalComponents[event.guildId][0].components = playerButtons;
    response[event.guildId].edit({
      components: globalComponents[event.guildId],
    });
  };
  // if not playing and connected[event.guildId] enable buttons and start music
  if (!isPlaying && connected[event.guildId]) {
    playerButtons.forEach ((b) => { b.disabled = false; }); // enable all buttons
    musicQueue.shift();
    previousSong = nextSong;
    await keyv.set(`musicQueue-${event.guildId}`, JSON.stringify(musicQueue));
    const stream = ytdl(nextSong.url, { filter: "audioonly", quality: "highestaudio", highWaterMark: 1 << 25, requestOptions: reqConfig });
    const resource = createAudioResource(stream, { inlineVolume: true });
    resource.volume.setVolume(0.4);
    player.play(resource);
    connection.subscribe(player);
    await keyv.set(`player-${event.guildId}`, true);
    fields.push(
      { name: "Duración",
        value: `\`${nextSong.duration}\``,
        inline: true
      },
      { name: "En cola:",
        value: `\`${musicQueue.length} canci${musicQueue.length === 1 ? "ón" : "ones"}\``,
        inline: true
      }
    );
    // if musicQueue is empty disable cleanList button
    playerButtons.forEach ((b) => {
      !musicQueue.length && b.custom_id === "btn_cleanList" ? b.disabled = true : null;
    });
    components.push({
      type: ComponentType.ActionRow,
      components: playerButtons
    });
    embeds.push({
      color: color,
      title: "♪ Ahora estás escuchando:",
      description: `**\`${nextSong.author}\` | [${nextSong.title}](${nextSong.url})**`,
      footer: {
        text: "Pedido por: " + nextSong.username,
        icon_url: nextSong.profileImage
      },
      thumbnail: {
        url: nextSong.thumbnail,
      },
      fields: fields
    });
    response[event.guildId] = await event.channel.send({
      content: "",
      embeds: embeds,
      components: components,
    });

    // create collector
    const collector = response[event.guildId].createMessageComponentCollector();
    // collector events
    collector.on("collect", async (i) => {
      console.log(i.customId);
      switch (i.customId) {
      // if disconnect button is pressed
      case "btn_dc":
        await i.deferUpdate();
        connection.disconnect();
        playerButtons.forEach ((b) => {
          b.disabled = true;
        });
        response[event.guildId].edit({
          components: components,
        });
        await keyv.set(`player-${event.guildId}`, false);
        break;
      // if pause/unpause button is pressed
      case "btn_togglePause":
        await i.deferUpdate();
        const isPaused = player.pause();
        isPaused ? null : player.unpause();
        playerButtons.forEach ((b) => {
          if (b.custom_id === "btn_togglePause") {
            b.emoji = {
              name: isPaused ? playerEmojis.play.name : playerEmojis.pause.name,
              id: isPaused ? playerEmojis.play.id : playerEmojis.pause.id,
            };
            b.style = isPaused ? ButtonStyle.Success : ButtonStyle.Primary;
          }
        });
        embeds[0].title = isPaused ? `🛑 El reproductor ha sido pausado por: ${i.user.globalName}` : "♪ Ahora estás escuchando:",
        response[event.guildId].edit({
          embeds: embeds,
          components: components,
        });
        break;
      // if skip button is pressed
      case "btn_skip":
        await i.deferUpdate();
        player.stop();
        playerButtons.forEach ((b) => {
          b.disabled = true;
        });
        response[event.guildId].edit({
          embeds: embeds,
          components: components,
        });
        event.channel.send({
          content: "",
          embeds: [{
            description: `⏭️ **${i.user.globalName}** ha skipeado \`${nextSong.title}\`.`
          }],
        });
        break;
      // if playlist button is pressed
      case "btn_playlist":
        await i.deferUpdate();
        const queue = JSON.parse(await keyv.get(`musicQueue-${event.guildId}`));
        const nowPlaying = `♪. **\`${nextSong.author}\` | [${nextSong.title}](${nextSong.url})** \`${nextSong.duration}\`\n`;
        const nextSongs = queue.map((song, index) => `${index + 1}. **\`${song.author}\` | [${song.title}](${song.url})** \`${song.duration}\``).join("\n") + "\n";
        const duration = [];
        if (queue[0]) {
          queue.forEach((s, i) => {
            i === 0 ? duration.push(nextSong?.duration, s?.duration) : duration.push(s?.duration);
          });
        } else {
          duration.push(nextSong?.duration);
        }
        const playlistEmbed = {
          color: color,
          title: "📄 Lista de reproducción:",
          description: nowPlaying + nextSongs + `**Duración total: \`${totalDuration(duration)}\`**`,
        };
        event.channel.send({
          content: "",
          embeds: [playlistEmbed]
        });
        break;
      // if cleanList button is pressed
      case "btn_cleanList":
        await i.deferUpdate();
        await keyv.set(`musicQueue-${event.guildId}`, JSON.stringify([]));
        event.channel.send({
          content: "",
          embeds: [{
            description: `🧹 **${i.user.globalName}** ha limpiado la lista.`
          }],
        });
        playerButtons.forEach ((b) => {
          b.custom_id === "btn_cleanList" ? b.disabled = true : null;
        });
        embeds[0].fields = [
          { name: "Duración",
            value: `\`${nextSong.duration}\``,
            inline: true
          },
          { name: "En cola:",
            value: "`0 canciones`",
            inline: true
          }
        ];
        response[event.guildId].edit({
          embeds: embeds,
          components: components,
        });
        break;
      default:
        null;
      }
    });
    // collector end
    collector.on("end", () => {
      playerButtons.forEach ((b) => {
        b.disabled = true;
      });
      response[event.guildId].edit({
        components: components,
      });
    });
    globalEmbeds[event.guildId] = embeds;
    globalComponents[event.guildId] = components;
  } else if (isPlaying && nextSong) {
    // if playing and there is a next song, enable cleanList button and edit message
    const updatedQueue = JSON.parse(await keyv.get(`musicQueue-${event.guildId}`));
    globalEmbeds[event.guildId][0].fields = [
      { name: "Duración",
        value: `\`${previousSong.duration}\``,
        inline: true
      },
      { name: "En cola:",
        value: `\`${updatedQueue.length} canci${updatedQueue.length === 1 ? "ón" : "ones"}\``,
        inline: true
      }
    ];
    playerButtons.forEach ((b) => {
      b.custom_id === "btn_cleanList" ? b.disabled = false : null;
    });
    globalComponents[event.guildId][0].components = playerButtons;
    response[event.guildId].edit({
      embeds: globalEmbeds[event.guildId],
      components: globalComponents[event.guildId],
    });
  } else {
    await keyv.set(`player-${event.guildId}`, false);
  }
};