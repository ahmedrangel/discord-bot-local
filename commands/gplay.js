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

export const gPlay = async (player, connection, message, mensaje) => {
  const voiceChannel = message.member.voice.channel;
  const profileImage = message.author.displayAvatarURL();
  const username = message.author.globalName;
  if (voiceChannel) {
    connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });
    const simbolos = "<,>,\`";
    const formatMensaje = mensaje.replace(new RegExp(`^[${simbolos}]+|[${simbolos}]+$`, "g"), " ");
    const isUrl = ytdl.validateURL(formatMensaje);
    const results = (await yt.search(formatMensaje))[0];
    const info = await ytdl.getBasicInfo(isUrl ? formatMensaje : results?.url);
    const duration = formatDuration(info?.videoDetails?.lengthSeconds);
    const title = info?.videoDetails?.title;
    const url = info?.videoDetails?.video_url;
    const thumbnail = info?.videoDetails?.thumbnails[0]?.url;
    const author = info.videoDetails.author.name;
    const musicQueue = JSON.parse(await keyv.get("musicQueue"));
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
    const embeds = [], fields = [];
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
  } else {
    message.reply("¡Debes estar en un canal de voz para poder unirme!");
  }
  return connection;
};