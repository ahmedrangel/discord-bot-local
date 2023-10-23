import { Client, GatewayIntentBits } from "discord.js";
import * as dotenv from "dotenv";
import * as C from "./commands/index.js";
import _dirname from "./projectPath.js";
import { Events } from "discord.js";
import CharacterAI from "node_characterai";

let chat = null;

dotenv.config();

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
    C.gPlay(message, text);
    break;
  }
});

client.login(process.env.DISCORD_TOKEN);
