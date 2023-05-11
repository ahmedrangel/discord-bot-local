import { Client, GatewayIntentBits } from "discord.js";
import CharacterAI from "node_characterai";
import * as dotenv from "dotenv";

dotenv.config();

let chat = null;

const client = new Client({ intents: [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.MessageContent,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.GuildIntegrations
] });

let cooldownActive = false;
let cooldownDuration = 60000;
let cooldownEndTime = 0;

client.on("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  // Initalize CharacterAI on Ready
  const characterAI = new CharacterAI();
  const characterId = process.env.CHARACTER_ID;
  await characterAI.authenticateWithToken(process.env.AI_KEY);
  chat = await characterAI.createOrContinueChat(characterId);
});

client.on("messageCreate", async (message) => {
  const split = message.content.split(" "); // Split on spaces
  const command = split[0].toLowerCase(); // Extract command no case sensitive
  const mensaje = split.slice(1).join(" "); // Slice command and rejoin the rest of the array
  const { username } = message.author;
  switch (command) {
    // Comando ia
    case "!ia":
      await message.channel.sendTyping();
      console.log(mensaje);
      try {
        const data = await fetch(`https://dev.ahmedrangel.com/dc/ai/${encodeURIComponent(username)}/${encodeURIComponent(mensaje.replaceAll(/"/g,"").replaceAll(/\n/g," "))}`);
        let respuesta = await data.text();
        if (respuesta.length > 1998) {
          respuesta = respuesta.slice(0, 1998);
          console.log("Respuesta supera los 1999 caracteres");
        }
        console.log(respuesta);
        message.reply(respuesta.replace("Gemi-chan: ",""));
      }
      catch (error) {
        console.log(error);
      }
      break;
    // Comando generar
    case "!generar":
      const esUrl = (cadena) => {
        const regex = /^(ftp|http|https):\/\/[^ "]+$/;
        return regex.test(cadena);
      }

      if (cooldownActive) {
        let now = new Date().getTime();
        let timeRemaining = cooldownEndTime - now;
        timeRemaining = timeRemaining * 0.001;
        message.reply("El comando está en cooldown. Vuelve a intentarlo en: " + Math.round(timeRemaining) + " segundos.");
        return;
      }
      await message.channel.sendTyping();
      try {
        const data = await fetch(`https://dev.ahmedrangel.com/dc/image-generation/${encodeURIComponent(mensaje)}`);
        let respuesta = await data.text()
        if (esUrl(respuesta)) {
          console.log(respuesta+"\n\n");
          message.reply({
            embeds: [{
              color: 0xfb05ef,
              description: mensaje,
              image: {
                url: respuesta
              }     
            }]
          });
          cooldownActive = true;
          cooldownEndTime = new Date().getTime() + cooldownDuration;
          setTimeout(() => {
            cooldownActive = false;
          }, cooldownDuration);
        } else if (respuesta == "Billing hard limit has been reached") {
          console.log(respuesta+"\n\n");
          message.reply({embeds: [{
            color: 0xfb05ef,
            description: "⚠️ Error. Créditos expirados. <@341828695612456960> lo resolverá pronto.",    
          }]});
        } else {
          console.log(respuesta+"\n\n");
          message.reply({embeds: [{
            color: 0xfb05ef,
            description: ":x: Error. Se ha detectado posible contenido inapropiado en el texto de la solicitud.",    
          }]});
        }
      }
      catch (error) {
        console.log(error);
        message.reply(error)
      }
      break;
    // Comando zihnee
    case "!zihnee":
      await message.channel.sendTyping();
      console.log(mensaje);
      try {
        const respuesta = await chat.sendAndAwaitResponse(`${username} says:\n${mensaje}`, true);
        console.log(respuesta.text);
        const emote_cora = "<:zihnecora:1100920647699419197> ";
        const emote_monku = "<:monkU:1059672495604650084>";
        const emote_uwu = "<:uwu:1074499520462860369>";
        const emote_xdx = "<:xdx:1074494997996511242> ";
        const emote_flower = "<:peepoflower:1059683310080626688>";
        
        const regex_uwu = new RegExp("uwu", "gi");
        const regex_xdx = new RegExp("xdx", "gi");
        const regex_o = new RegExp(":o", "gi");

        await message.reply(respuesta.text.replaceAll(regex_xdx, emote_xdx).replaceAll(/xD/g, emote_xdx).replaceAll(regex_uwu, emote_uwu).replaceAll(/<3/g, emote_cora).replaceAll(regex_o, emote_monku).replaceAll(/:3/g, emote_flower));
      }
      catch (error) {
        console.log(error);
      }
      break;
  }
});

client.login(process.env.DISCORD_TOKEN);
