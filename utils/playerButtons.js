import { ButtonStyle, ComponentType } from "discord.js";
import { playerEmojis } from "../utils/emojis.js";

const buttonData = [
  { emoji: playerEmojis.stop, style: ButtonStyle.Danger, custom_id: "btn_dc" },
  { emoji: playerEmojis.pause, style: ButtonStyle.Primary, custom_id: "btn_togglePause" },
  { emoji: playerEmojis.skip, style: ButtonStyle.Primary, custom_id: "btn_skip" },
  { emoji: playerEmojis.playlist, style: ButtonStyle.Secondary, custom_id: "btn_playlist" },
  { emoji: playerEmojis.cleanList, style: ButtonStyle.Secondary, custom_id: "btn_cleanList"}
];

export const playerButtons = buttonData.map(data => ({
  type: ComponentType.Button,
  ...data
}));