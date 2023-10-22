export const zihnee = async(chat, message, mensaje) => {
  await message.channel.sendTyping();
  console.log(username + ": " + mensaje);
  try {
    const respuesta = await chat.sendAndAwaitResponse(`${username} says:\n${mensaje}`, true);
    console.log("Gemi-chan: " + respuesta.text);
    const emote_cora = "<:zihnecora:1100920647699419197> ";
    const emote_monku = "<:monkU:1059672495604650084>";
    const emote_uwu = "<:uwu:1074499520462860369>";
    const emote_xdx = "<:xdx:1074494997996511242> ";
    const emote_flower = "<:peepoflower:1059683310080626688>";
    const emote_sadge = "<:sadge:1059683257265954887>";
    const regex_uwu = new RegExp("uwu", "gi");
    const regex_xdx = new RegExp("xdx", "gi");
    const regex_o = new RegExp(":o", "gi");

    await message.reply(respuesta.text.replaceAll(regex_xdx, emote_xdx).replaceAll(/xD/g, emote_xdx).replaceAll(regex_uwu, emote_uwu).replaceAll(/<3/g, emote_cora).replaceAll(regex_o, emote_monku).replaceAll(/:3/g, emote_flower).replaceAll(":(", emote_sadge));
  } catch (error) {
    console.log(error);
  }
};