import * as dotenv from "dotenv";

dotenv.config();

export const reqConfig = {
  headers: {
    cookie: process.env["YT_COOKIE"],
    "x-youtube-identity-token": process.env["YT_ID_TOKEN"],
  }
};