import { ButtonStyle, ComponentType } from "discord.js";
import emojis from "../../emojis.js";

const buttonData = [
  { emoji: emojis.stop, style: ButtonStyle.Danger, custom_id: "btn_dc" },
  { emoji: emojis.pause, style: ButtonStyle.Primary, custom_id: "btn_togglePause" },
  { emoji: emojis.skip, style: ButtonStyle.Primary, custom_id: "btn_skip" },
  { emoji: emojis.playlist, style: ButtonStyle.Secondary, custom_id: "btn_playlist" },
  { emoji: emojis.cleanList, style: ButtonStyle.Secondary, custom_id: "btn_cleanList"}
];

const playerButtons = buttonData.map(data => ({
  type: ComponentType.Button,
  ...data
}));

export default playerButtons;