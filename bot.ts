import { Bot } from "grammy";
import { BOT_TOKEN } from "./config";

const bot = new Bot(BOT_TOKEN);

bot.start();
