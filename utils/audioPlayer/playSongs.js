import { createAudioResource, VoiceConnectionStatus } from "@discordjs/voice";
import { ComponentType } from "discord.js";
import ytdl from "ytdl-core";
import emojis from "../../emojis.js";
import playerButtons from "./playerButtons.js";
import CONSTANTS from "../../constants.js";
import _dirname from "../../projectPath.js";
import Keyv from "keyv";
import { totalDuration } from "../functions.js";
import ytdlReqConfig from "./ytdlReqConfig.js";

const keyv = new Keyv("sqlite://" + _dirname + "/db.sqlite");
const { color } = CONSTANTS;
let response = {}, connected = {};
let globalEmbeds = {}, globalComponents = {};

export const playSongs = async (player, message, connection, isIdle) => {
  const embeds = [], fields = [], components = [];
  const musicQueue = JSON.parse(await keyv.get(`musicQueue-${message.guildId}`)); // get Queue
  const nextSong = musicQueue[0]; // get Current Song
  const isPlaying = await keyv.get(`player-${message.guildId}`);
  connected[message.guildId] = !connection ? false : true;
  // if idle disable all buttons
  if (isIdle) {
    await keyv.set(`player-${message.guildId}`, false);
    playerButtons.forEach ((b) => {
      b.disabled = true;
    });
    globalComponents[message.guildId][0].components = playerButtons;
    response[message.guildId].edit({
      components: globalComponents[message.guildId],
    });
  };
  // if not playing and connected[message.guildId] enable buttons and start music
  if (!isPlaying && connected[message.guildId]) {
    playerButtons.forEach ((b) => { b.disabled = false; }); // enable all buttons
    musicQueue.shift();
    await keyv.set(`musicQueue-${message.guildId}`, JSON.stringify(musicQueue));
    const stream = ytdl(nextSong.url, { filter: "audioonly", quality: "highestaudio", highWaterMark: 1 << 25, requestOptions: ytdlReqConfig });
    const resource = createAudioResource(stream, { inlineVolume: true });
    resource.volume.setVolume(0.4);
    player.play(resource);
    connection.subscribe(player);
    await keyv.set(`player-${message.guildId}`, true);
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
    response[message.guildId] = await message.channel.send({
      content: "",
      embeds: embeds,
      components: components,
    });

    // create collector
    const collector = response[message.guildId].createMessageComponentCollector();
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
        response[message.guildId].edit({
          components: components,
        });
        await keyv.set(`player-${message.guildId}`, false);
        break;
      // if pause/unpause button is pressed
      case "btn_togglePause":
        await i.deferUpdate();
        const isPaused = player.pause();
        isPaused ? null : player.unpause();
        playerButtons.forEach ((b) => {
          if (b.custom_id === "btn_togglePause") {
            b.emoji = {
              name: isPaused ? emojis.play.name : emojis.pause.name,
              id: isPaused ? emojis.play.id : emojis.pause.id,
            };
          }
        });
        embeds[0].title = isPaused ? `🛑 El reproductor ha sido pausado por: ${i.user.globalName}` : "♪ Ahora estás escuchando:",
        response[message.guildId].edit({
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
        response[message.guildId].edit({
          embeds: embeds,
          components: components,
        });
        message.channel.send({
          content: "",
          embeds: [{
            description: `⏭️ **${i.user.globalName}** ha skipeado \`${nextSong.title}\`.`
          }],
        });
        break;
      // if playlist button is pressed
      case "btn_playlist":
        await i.deferUpdate();
        const queue = JSON.parse(await keyv.get(`musicQueue-${message.guildId}`));
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
        message.channel.send({
          content: "",
          embeds: [playlistEmbed]
        });
        break;
      // if cleanList button is pressed
      case "btn_cleanList":
        await i.deferUpdate();
        await keyv.set(`musicQueue-${message.guildId}`, JSON.stringify([]));
        message.channel.send({
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
        response[message.guildId].edit({
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
      response[message.guildId].edit({
        components: components,
      });
    });
    globalEmbeds[message.guildId] = embeds;
    globalComponents[message.guildId] = components;
  } else if (isPlaying && nextSong) {
    // if playing and there is a next song, enable cleanList button and edit message
    const updatedQueue = JSON.parse(await keyv.get(`musicQueue-${message.guildId}`));
    globalEmbeds[message.guildId][0].fields = [
      { name: "Duración",
        value: `\`${nextSong.duration}\``,
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
    globalComponents[message.guildId][0].components = playerButtons;
    response[message.guildId].edit({
      embeds: globalEmbeds[message.guildId],
      components: globalComponents[message.guildId],
    });
  } else {
    await keyv.set(`player-${message.guildId}`, false);
  }
};