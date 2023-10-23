import { Client, GatewayIntentBits } from "discord.js";
import * as dotenv from "dotenv";
import * as C from "./commands/index.js";
import _dirname from "./projectPath.js";
import Keyv from "keyv";
import { Events } from "discord.js";
import { playSongs } from "./utils/audioPlayer/playSongs.js";
import CharacterAI from "node_characterai";

const keyv = new Keyv("sqlite://" + _dirname + "/db.sqlite");
let dinMsg = null;
let chat = null;

dotenv.config();
await keyv.delete("musicQueue-1048659746137317498");
await keyv.delete("player-1048659746137317498");
await keyv.delete("musicQueue-1165980362254602242");
await keyv.delete("player-1165980362254602242");
const client = new Client({ intents: [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.MessageContent,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.GuildIntegrations,
  GatewayIntentBits.GuildVoiceStates,
  GatewayIntentBits.GuildMessageReactions,
  GatewayIntentBits.GuildEmojisAndStickers,
  GatewayIntentBits.GuildPresences
] });

await keyv.set("isPlaying", false);

client.on(Events.ClientReady, async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  // Initalize CharacterAI on Ready
  /*
  const characterAI = new CharacterAI();
  const characterId = process.env.CHARACTER_ID;
  await characterAI.authenticateWithToken(process.env.AI_KEY);
  chat = await characterAI.createOrContinueChat(characterId);
  */
});

client.on(Events.MessageCreate, async (message) => {
  const split = message.content.split(" "); // Split on spaces
  const command = split[0].toLowerCase(); // Extract command no case sensitive
  const text = split.slice(1).join(" "); // Slice command and rejoin the rest of the array
  switch (command) {
  // Comando zihnee
  /*
  case "!zihnee":
    C.zihnee(chat, message, text);
    break;
  */
  case "!gplay":
    dinMsg = message;
    C.gPlay(message, text);
    break;
  }
});

client.login(process.env.DISCORD_TOKEN);
