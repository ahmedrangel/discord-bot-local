import { Client, GatewayIntentBits } from "discord.js";
import CharacterAI from "node_characterai";
import * as dotenv from "dotenv";

dotenv.config();

const characterAI = new CharacterAI();
const characterId = process.env.CHARACTER_ID;
await characterAI.authenticateWithToken(process.env.AI_KEY);
const chat = await characterAI.createOrContinueChat(characterId);

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
});

client.on("messageCreate", async message => {
  let mensaje = "";
  if (message.content.startsWith("!ia") || message.content.startsWith("!IA")) {
    if (message.content.startsWith("!ia")) {  
      await message.channel.sendTyping();
      mensaje = message.content.split("!ia ")[1];
    } else if (message.content.startsWith("!IA")) {
      await message.channel.sendTyping();
      mensaje = message.content.split("!IA ")[1];
    }
      console.log(mensaje);
      const { username } = message.author;
      try {
        const data = await fetch(`https://dev.ahmedrangel.com/dc/ai/${encodeURIComponent(username)}/${encodeURIComponent(mensaje.replaceAll(/"/g,"").replaceAll(/\n/g," "))}`);
        let respuesta = await data.text()
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

  } else if (message.content.startsWith("!generar")) {
    function esUrl(cadena) {
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
    mensaje = message.content.split("!generar ")[1];
    try {
      const data = await fetch(`https://dev.ahmedrangel.com/dc/image-generation/${encodeURIComponent(mensaje)}`);
      let respuesta = await data.text()
      if (esUrl(respuesta)) {
        console.log(respuesta+"\n\n");
        message.reply({embeds: [{
          color: 0xfb05ef,
          description: mensaje,
          image: {
            url: respuesta
          }     
        }]});
        cooldownActive = true;
        cooldownEndTime = new Date().getTime() + cooldownDuration;
        setTimeout(() => {
          cooldownActive = false;
        }, cooldownDuration);
      } else {
        console.log(respuesta+"\n\n");
        mensaje = ":x: Error. Se ha detectado posible contenido inapropiado en el texto de la solicitud."
        message.reply({embeds: [{
          color: 0xfb05ef,
          description: mensaje,    
        }]});
      }
    }
    catch (error) {
      console.log(error);
      message.reply(error)
    }
  }
  else if (message.content.startsWith("!zihnee")) {
    await message.channel.sendTyping();
    const mensaje = message.content.split("!zihnee ")[1];
    console.log(mensaje);
    const { username } = message.author;
    try {
      const respuesta = await chat.sendAndAwaitResponse(`${username} says:\n${mensaje}`, true);
      console.log(respuesta.text);
      await message.reply(respuesta.text.replaceAll(/xdx/g,"<:xdx:1074494997996511242>").replaceAll(/uwu/g,"<:uwu:1074499520462860369>").replaceAll(/<3/g,"<:zihnecora:1100920647699419197>"));
    }
    catch (error) {
      console.log(error);
    }
  }
});


client.login(process.env.DISCORD_TOKEN);