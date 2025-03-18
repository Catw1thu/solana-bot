import { Bot } from "grammy";
import { BOT_TOKEN } from "./config/config";

const bot = new Bot(BOT_TOKEN);

bot.start();
