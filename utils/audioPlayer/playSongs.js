import { createAudioResource, VoiceConnectionStatus } from "@discordjs/voice";
import { ComponentType } from "discord.js";
import ytdl from "ytdl-core";
import emojis from "../../emojis.js";
import playerButtons from "./playerButtons.js";
import CONSTANTS from "../../constants.js";
import _dirname from "../../projectPath.js";
import Keyv from "keyv";

const keyv = new Keyv("sqlite://" + _dirname + "/db.sqlite");
const { color } = CONSTANTS;
let response, connected;
let globalEmbeds, globalComponents;

export const playSongs = async (player, message, connection, isIdle) => {
  const embeds = [], fields = [], components = [];
  const musicQueue = JSON.parse(await keyv.get("musicQueue")); // get Queue
  const nextSong = musicQueue[0]; // get Current Song
  const isPlaying = await keyv.get("isPlaying");
  connected = !connection ? false : true;
  // if idle disable all buttons
  if (isIdle) {
    await keyv.set("isPlaying", false);
    playerButtons.forEach ((b) => {
      b.disabled = true;
    });
    globalComponents[0].components = playerButtons;
    response.edit({
      components: globalComponents,
    });
  };
  // if not playing and connected enable buttons and start music
  if (!isPlaying && connected) {
    playerButtons.forEach ((b) => { b.disabled = false; }); // enable all buttons
    musicQueue.shift();
    await keyv.set("musicQueue", JSON.stringify(musicQueue));
    const stream = ytdl(nextSong.url, { filter: "audioonly", quality: "highestaudio", highWaterMark: 1 << 25 });
    const resource = createAudioResource(stream, { inlineVolume: true });
    resource.volume.setVolume(0.4);
    player.play(resource);
    connection.subscribe(player);
    await keyv.set("isPlaying", true);
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
    response = await message.channel.send({
      content: "",
      embeds: embeds,
      components: components,
    });

    // create collector
    const collector = response.createMessageComponentCollector();
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
        response.edit({
          components: components,
        });
        await keyv.set("isPlaying", false);
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
        response.edit({
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
        response.edit({
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
        const queue = JSON.parse(await keyv.get("musicQueue"));
        const nowPlaying = `♪. **\`${nextSong.author}\` | [${nextSong.title}](${nextSong.url})** \`${nextSong.duration}\`\n`;
        const nextSongs = queue.map((song, index) => `${index + 1}. **\`${song.author}\` | [${song.title}](${song.url})** \`${song.duration}\``).join("\n");
        const playlistEmbed = {
          color: color,
          title: "📄 Lista de reproducción:",
          description: nowPlaying + nextSongs,
        };
        message.channel.send({
          content: "",
          embeds: [playlistEmbed]
        });
        break;
      // if cleanList button is pressed
      case "btn_cleanList":
        await i.deferUpdate();
        await keyv.set("musicQueue", JSON.stringify([]));
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
        response.edit({
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
      response.edit({
        components: components,
      });
    });
    globalEmbeds = embeds;
    globalComponents = components;
  } else if (isPlaying && nextSong) {
    // if playing and there is a next song, enable cleanList button and edit message
    const updatedQueue = JSON.parse(await keyv.get("musicQueue"));
    globalEmbeds[0].fields = [
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
    globalComponents[0].components = playerButtons;
    response.edit({
      embeds: globalEmbeds,
      components: globalComponents,
    });
  } else {
    await keyv.set("isPlaying", false);
  }
};