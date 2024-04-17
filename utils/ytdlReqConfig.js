import "dotenv/config";

export const reqConfig = {
  headers: {
    cookie: process.env["YT_COOKIE"] || null,
    "x-youtube-identity-token": process.env["YT_ID_TOKEN"] || null,
  }
};