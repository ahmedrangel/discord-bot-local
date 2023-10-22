import { joinVoiceChannel } from "@discordjs/voice";
import ytdl from "ytdl-core";
import * as yt from "youtube-search-without-api-key";
import { formatDuration } from "../utils/functions.js";
import { playSongs } from "../utils/audioPlayer/playSongs.js";
import CONSTANTS from "../constants.js";
import _dirname from "../projectPath.js";
import Keyv from "keyv";

const keyv = new Keyv("sqlite://" + _dirname + "/db.sqlite");
const { color } = CONSTANTS;

export const gPlay = async (player, connection, message, text) => {
  const voiceChannel = message.member.voice.channel;
  const profileImage = message.author.displayAvatarURL();
  const username = message.author.globalName;
  const musicQueue = JSON.parse(await keyv.get("musicQueue"));
  const isPlaying = await keyv.get("isPlaying");
  const joinVoice = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: voiceChannel.guild.id,
    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
  });
  if (voiceChannel && text) {
    connection = joinVoice;
    const simbolos = "<,>,\`";
    const formatText = text.replace(new RegExp(`^[${simbolos}]+|[${simbolos}]+$`, "g"), " ");
    const isUrl = ytdl.validateURL(formatText);
    const results = (await yt.search(formatText))[0];
    const info = await ytdl.getBasicInfo(isUrl ? formatText : results?.url);
    const duration = formatDuration(info?.videoDetails?.lengthSeconds);
    const title = info?.videoDetails?.title;
    const url = info?.videoDetails?.video_url;
    const thumbnail = info?.videoDetails?.thumbnails[0]?.url;
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
    await keyv.set("musicQueue", JSON.stringify(musicQueue));
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
    await playSongs(player, message, connection);
  } else if (voiceChannel && !text && musicQueue[0] && !isPlaying) {
    connection = joinVoice;
    await playSongs(player, message, connection);
  } else if (!musicQueue[0] && !isPlaying) {
    message.reply("No hay canciones en cola, para agregar una utiliza **`!gplay <cancion>`**");
  } else if (!voiceChannel) {
    message.reply("¡Debes estar en un canal de voz para poder unirme!");
  }
  return connection;
};