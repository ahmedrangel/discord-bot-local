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

export const playSongs = async (player, message, connection) => {
  const musicQueue = JSON.parse(await keyv.get("musicQueue"));
  const nextSong = musicQueue.shift();
  await keyv.set("musicQueue", JSON.stringify(musicQueue));
  const embeds = [], fields = [], components = [];
  playerButtons.forEach ((b) => {
    b.disabled = false;
  });
  if (nextSong) {
    const stream = ytdl(nextSong.url, { filter: "audioonly", quality: "highestaudio", highWaterMark: 1 << 25 });
    const resource = createAudioResource(stream, { inlineVolume: true });
    resource.volume.setVolume(0.4);
    player.play(resource);
    connection.subscribe(player);
    await keyv.set("isPlaying", true);
    player.on(VoiceConnectionStatus.Idle, async() => {
      console.log("idle");
      connection.destroy();
      await keyv.set("isPlaying", false);
    });
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
    playerButtons.forEach ((b) => {
      if (!musicQueue.length && b.custom_id === "btn_cleanList") {
        b.disabled = true;
      }
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
    const response = await message.channel.send({
      content: "",
      embeds: embeds,
      components: components,
    });

    const collector = response.createMessageComponentCollector({ time: 300000 });

    collector.on("collect", async (i) => {
      console.log(i.customId);
      switch (i.customId) {
      case "btn_dc":
        await i.deferUpdate();
        connection.destroy();
        playerButtons.forEach ((b) => {
          b.disabled = true;
        });
        response.edit({
          content: "",
          embeds: embeds,
          components: components,
        });
        break;
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
          content: "",
          embeds: embeds,
          components: components,
        });
        break;
      case "btn_skip":
        await i.deferUpdate();
        player.stop();
        playerButtons.forEach ((b) => {
          b.disabled = true;
        });
        response.edit({
          content: "",
          embeds: embeds,
          components: components,
        });
        message.channel.send({
          content: "",
          embeds: [{
            description: `⏭️ **${i.user.globalName}** ha skipeado \`${nextSong.title}\`.`
          }],
        });
        await playSongs(player, message, connection);
        break;
      case "btn_playlist":
        await i.deferUpdate();
        const queue = JSON.parse(await keyv.get("musicQueue"));
        const playlistEmbed = {
          color: color,
          title: "📄 Lista de reproducción:",
          description: `1. **\`${nextSong.author}\` | [${nextSong.title}](${nextSong.url})** \`${nextSong.duration}\`\n` + queue.map((song, index) => `${index + 2}. **\`${song.author}\` | [${song.title}](${song.url})** \`${song.duration}\``).join("\n"),
        };
        message.channel.send({
          content: "",
          embeds: [playlistEmbed]
        });
        break;
      case "btn_cleanList":
        await i.deferUpdate();
        await keyv.set("musicQueue", JSON.stringify([]));
        playerButtons.forEach ((b) => {
          if (b.custom_id === "btn_cleanList") {
            b.disabled = true;
          }
        });
        response.edit({
          content: "",
          embeds: embeds,
          components: components,
        });
        console.log(i);
        message.channel.send({
          content: "",
          embeds: [{
            description: `🧹 **${i.user.globalName}** ha limpiado la lista.`
          }],
        });
        break;
      default:
        null;
      }
    });

    collector.on("end", () => {
      playerButtons.forEach ((b) => {
        b.disabled = true;
      });
      response.edit({
        content: "",
        embeds: embeds,
        components: components,
      });
    });
  } else {
    await keyv.set("isPlaying", false);
  }
};