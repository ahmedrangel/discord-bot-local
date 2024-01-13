import { Client, GatewayIntentBits, Events } from "discord.js";
import * as dotenv from "dotenv";
import * as C from "./commands/index.js";
import _dirname from "./projectPath.js";
import Keyv from "keyv";
import CharacterAI from "node_characterai";
import express from "express";

const server = express();

const keyv = new Keyv("sqlite://" + _dirname + "/db.sqlite");
let chat = null;

server.all("/", (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.write("<p>Hosting Active</p>");
  res.end();
});

dotenv.config();

// Clear audio players if the application restarts due to an error or forced termination.
for await (const [key, value] of keyv.iterator()) {
  if (key.includes("player-")) {
    await keyv.delete(key);
  }
};

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

client.login(process.env["DISCORD_TOKEN"]);

server.listen(3000, () => { console.log("Server is online!"); });