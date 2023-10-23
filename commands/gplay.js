import { joinVoiceChannel } from "@discordjs/voice";
import ytdl from "ytdl-core";
import * as yt from "youtube-search-without-api-key";
import { formatDuration } from "../utils/functions.js";
import { playSongs } from "../utils/audioPlayer/playSongs.js";
import CONSTANTS from "../constants.js";
import _dirname from "../projectPath.js";
import Keyv from "keyv";
import { AudioPlayerStatus } from "@discordjs/voice";
import { createAudioPlayer } from "@discordjs/voice";

const keyv = new Keyv("sqlite://" + _dirname + "/db.sqlite");
const { color } = CONSTANTS;
let connection = {};
let player = {};
let idle = {};

export const gPlay = async (message, text) => {
  // await keyv.delete(`musicQueue-${message.channelId}`);
  const playerCreated = await keyv.get(`player-${message.channelId}`);
  const queueInDB = await keyv.get(`musicQueue-${message.channelId}`);
  queueInDB ? null : await keyv.set(`musicQueue-${message.channelId}`, "[]");
  if (!playerCreated) {

    player[message.channelId] = createAudioPlayer();
    player[message.channelId].on(AudioPlayerStatus.Idle, async () => {
      console.log("audio player idle");
      await keyv.set(`player-${message.channelId}`, false);
      const musicQueue = JSON.parse(await keyv.get(`musicQueue-${message.channelId}`));
      if (musicQueue.length) {
        await playSongs(player[message.channelId], message, connection[message.channelId], idle[message.channelId]);
      } else {
        connection[message.channelId].disconnect();
        await playSongs(player[message.channelId], message, null, idle[message.channelId]);
        connection[message.channelId].destroy();
        connection[message.channelId] = null;
      }
    });
  }
  const voiceChannel = message.member.voice.channel;
  const profileImage = message.author.displayAvatarURL();
  const username = message.author.globalName;
  const musicQueue = JSON.parse(await keyv.get(`musicQueue-${message.channelId}`));
  const isPlaying = await keyv.get(`player-${message.channelId}`);
  if (voiceChannel && text) {
    const joinVoice = joinVoiceChannel({
      channelId: voiceChannel?.id,
      guildId: voiceChannel?.guild?.id,
      adapterCreator: voiceChannel?.guild?.voiceAdapterCreator,
    });
    connection[message.channelId] = joinVoice;
    const simbolos = "<,>,\`";
    const formatText = text.replace(new RegExp(`^[${simbolos}]+|[${simbolos}]+$`, "g"), " ");
    const isUrl = ytdl.validateURL(formatText);
    const results = (await yt.search(formatText))[0];
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
    await keyv.set(`musicQueue-${message.channelId}`, JSON.stringify(musicQueue));
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
    await playSongs(player[message.channelId], message, connection[message.channelId]);
  } else if (voiceChannel && !text && musicQueue[0] && !isPlaying) {
    await playSongs(player[message.channelId], message, connection[message.channelId]);
  } else if (!musicQueue[0] && !isPlaying) {
    message.reply("No hay canciones en cola, para agregar una utiliza **`!gplay <cancion>`**");
  } else if (!voiceChannel) {
    message.reply("¡Debes estar en un canal de voz para pedir una canción!");
  }
};