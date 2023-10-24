import * as dotenv from "dotenv";
dotenv.config();

const ytdlReqConfig = {
  headers: {
    cookie: process.env.YT_COOKIE,
    "x-youtube-identity-token": process.env.YT_ID_TOKEN,
  }
};

export default ytdlReqConfig;