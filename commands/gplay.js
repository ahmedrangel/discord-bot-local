import { joinVoiceChannel, AudioPlayerStatus, createAudioPlayer } from "@discordjs/voice";
import ytdl from "ytdl-core";
import * as yt from "youtube-search-without-api-key";
import { formatDuration } from "../utils/functions.js";
import { playSongs } from "../utils/audioPlayer/playSongs.js";
import CONSTANTS from "../constants.js";
import _dirname from "../projectPath.js";
import Keyv from "keyv";

const keyv = new Keyv("sqlite://" + _dirname + "/db.sqlite");
const { color } = CONSTANTS;
let connection = {};
let player = {};
let idle = {};

export const gPlay = async (message, text) => {
  console.log(message);
  // await keyv.delete(`musicQueue-${message.guildId}`);
  const playerCreated = await keyv.get(`player-${message.guildId}`);
  const queueInDB = await keyv.get(`musicQueue-${message.guildId}`);
  queueInDB ? null : await keyv.set(`musicQueue-${message.guildId}`, "[]");
  if (!playerCreated) {
    idle[message.guildId] = true;
    player[message.guildId] = createAudioPlayer();
    player[message.guildId].on(AudioPlayerStatus.Idle, async () => {
      console.log("audio player idle");
      await keyv.set(`player-${message.guildId}`, false);
      const musicQueue = JSON.parse(await keyv.get(`musicQueue-${message.guildId}`));
      if (musicQueue.length) {
        await playSongs(player[message.guildId], message, connection[message.guildId], idle[message.guildId]);
      } else {
        connection[message.guildId].disconnect();
        await playSongs(player[message.guildId], message, null, idle[message.guildId]);
        connection[message.guildId].destroy();
        connection[message.guildId] = null;
      }
    });
  }
  const voiceChannel = message.member.voice.channel;
  const profileImage = message.author.displayAvatarURL();
  const username = message.author.globalName;
  const musicQueue = JSON.parse(await keyv.get(`musicQueue-${message.guildId}`));
  const isPlaying = await keyv.get(`player-${message.guildId}`);
  const joinVoice = voiceChannel ? joinVoiceChannel({
    channelId: voiceChannel?.id,
    guildId: voiceChannel?.guild?.id,
    adapterCreator: voiceChannel?.guild?.voiceAdapterCreator,
  }) : null;
  try {
    if (voiceChannel && text) {
      connection[message.guildId] = joinVoice;
      const simbolos = "<,>,\`";
      const formatText = text.replace(new RegExp(`^[${simbolos}]+|[${simbolos}]+$`, "g"), " ");
      const isUrl = ytdl.validateURL(formatText);
      const results = !isUrl ? (await yt.search(formatText))[0] : null;
      const info = await ytdl.getBasicInfo(isUrl ? formatText : results?.url);
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
      await keyv.set(`musicQueue-${message.guildId}`, JSON.stringify(musicQueue));
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
      message.channel.send({
        content: "",
        embeds: embeds,
      });
      await playSongs(player[message.guildId], message, connection[message.guildId]);
    } else if (voiceChannel && !text && musicQueue[0] && !isPlaying) {
      connection[message.guildId] = joinVoice;
      await playSongs(player[message.guildId], message, connection[message.guildId]);
    } else if (!musicQueue[0] && !isPlaying) {
      message.reply("No hay canciones en cola, para agregar una utiliza **`!gplay <cancion>`**");
    } else if (!voiceChannel) {
      message.reply("¡Debes estar en un canal de voz para pedir una canción!");
    }
  } catch (error) {
    console.log(isPlaying);
    if (!isPlaying) {
      connection[message.guildId].destroy();
      connection[message.guildId] = null;
    }
    message.reply("No se ha podido añadir esta canción debido a que el video tiene restricción o es privado");
  }
};