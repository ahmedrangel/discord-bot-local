import { Client, GatewayIntentBits, Events } from "discord.js";
import * as dotenv from "dotenv";
import * as C from "./commands/index.js";
import { _dirname } from "./projectPath.js";
import Keyv from "keyv";
import express from "express";

const server = express();

const keyv = new Keyv("sqlite://" + _dirname + "/db.sqlite");

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
});

client.on(Events.MessageCreate, async (event) => {
  const split = event.content.split(" "); // Split on spaces
  const command = split[0].toLowerCase(); // Extract command no case sensitive
  const text = split.slice(1).join(" "); // Slice command and rejoin the rest of the array
  switch (command) {
  case "!gplay":
    C.gPlay(event, text);
    break;
  }
  /*
  case "!anothercommand":
    C.commandFunction(event, text);
    break;
  */
});

client.login(process.env["DISCORD_TOKEN"]);

server.listen(3000, () => { console.log("Server is online!"); });