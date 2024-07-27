import { joinVoiceChannel, AudioPlayerStatus, createAudioPlayer } from "@discordjs/voice";
import ytdl from "@distube/ytdl-core";
import * as yt from "youtube-search-without-api-key";
import { formatDuration } from "../utils/helpers.js";
import { playSongs } from "../audioPlayer/playSongs.js";
import { CONSTANTS } from "../utils/constants.js";
import { _dirname } from "../projectPath.js";
import Keyv from "keyv";
import { agent } from "../utils/ytdlAgent.js";

const keyv = new Keyv("sqlite://" + _dirname + "/db.sqlite");
const { color } = CONSTANTS;
let connection = {};
let player = {};
let idle = {};

export const gPlay = async (event, text) => {
  try {
  // await keyv.delete(`musicQueue-${event.guildId}`);
    const playerCreated = await keyv.get(`player-${event.guildId}`);
    const queueInDB = await keyv.get(`musicQueue-${event.guildId}`);
    queueInDB ? null : await keyv.set(`musicQueue-${event.guildId}`, "[]");
    if (!playerCreated) {
      player[event.guildId] = createAudioPlayer();
      player[event.guildId].on(AudioPlayerStatus.Idle, async () => {
        console.log("audio player idle");
        idle[event.guildId] = true;
        await keyv.set(`player-${event.guildId}`, false);
        const musicQueue = JSON.parse(await keyv.get(`musicQueue-${event.guildId}`));
        if (musicQueue.length) {
          await playSongs(player[event.guildId], event, connection[event.guildId], idle[event.guildId]);
          idle[event.guildId] = false;
        } else {
          connection[event.guildId].disconnect();
          await playSongs(player[event.guildId], event, null, idle[event.guildId]);
          connection[event.guildId].destroy();
          connection[event.guildId] = null;
          idle[event.guildId] = false;
        }
      });
    }
    const voiceChannel = event.member.voice.channel;
    const profileImage = event.author.displayAvatarURL();
    const username = event.author.globalName;
    const musicQueue = JSON.parse(await keyv.get(`musicQueue-${event.guildId}`));
    const isPlaying = await keyv.get(`player-${event.guildId}`);
    const joinVoice = voiceChannel && text ? joinVoiceChannel({
      channelId: voiceChannel?.id,
      guildId: voiceChannel?.guild?.id,
      adapterCreator: voiceChannel?.guild?.voiceAdapterCreator,
    }) : null;
    if (voiceChannel && text) {
      connection[event.guildId] = joinVoice;
      const simbolos = "<,>,\`";
      const formatText = text.replace(new RegExp(`^[${simbolos}]+|[${simbolos}]+$`, "g"), " ");
      const isUrl = ytdl.validateURL(formatText);
      const results = !isUrl ? (await yt.search(formatText))[0] : null;
      const info = await ytdl.getBasicInfo(isUrl ? formatText : results?.url, { agent });
      const duration = formatDuration(info?.videoDetails?.lengthSeconds);
      const title = info?.videoDetails?.title;
      const url = info?.videoDetails?.video_url;
      const thumbnailArray = info?.videoDetails?.thumbnails;
      const thumbnail = (thumbnailArray[thumbnailArray.length - 1].url).replace(/\?.*$/, "");
      const author = info.videoDetails.author.name;
      musicQueue.push({
        username: username,
        profileImage: profileImage,
        title: title,
        duration: duration,
        url: url,
        thumbnail: thumbnail,
        author: author,
      });
      await keyv.set(`musicQueue-${event.guildId}`, JSON.stringify(musicQueue));
      const embeds = [];
      embeds.push({
        color: color,
        title: "✅ Se ha añadido a la cola:",
        description: `**\`${author}\` | [${title}](${url})**`,
        footer: {
          text: "Pedido por: " + username,
          icon_url: profileImage
        },
        thumbnail: {
          url: thumbnail,
        }
      });
      event.channel.send({
        content: "",
        embeds: embeds,
      });
      await playSongs(player[event.guildId], event, connection[event.guildId]);
    } else if (voiceChannel && !text && musicQueue[0] && !isPlaying) {
      connection[event.guildId] = joinVoice;
      await playSongs(player[event.guildId], event, connection[event.guildId]);
    } else if (!musicQueue[0] && !isPlaying) {
      event.reply("No hay canciones en cola, para agregar una utiliza **`!gplay <cancion>`**");
    } else if (!voiceChannel) {
      event.reply("¡Debes estar en un canal de voz para pedir una canción!");
    }
  } catch (error) {
    console.log(error);
    if (!isPlaying) {
      connection[event.guildId].destroy();
      connection[event.guildId] = null;
    }
    event.reply("Ha ocurrido un error obteniendo el video.");
  }
};