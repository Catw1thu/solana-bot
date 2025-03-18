import pino from "pino";
import { multistream } from "pino";

// 定义多个日志流目标：终端和日志文件
const streams = [
  { stream: process.stdout }, // 输出到终端
  { stream: pino.destination("./app.log") }, // 写入文件
];

// 创建 logger 实例，传入多流配置
export const logger = pino(
  {
    level: "info", // 日志级别：可根据需要设置为 trace, debug, info, warn, error, fatal
    timestamp: pino.stdTimeFunctions.isoTime,
    // 开发环境美化终端输出
    transport: {
      target: "pino-pretty", // 开发环境使用 pino-pretty 美化输出，生产环境建议移除
      options: {
        translateTime: "SYS:standard", // 使用本地标准时间格式
        colorize: true, // 彩色输出
      },
    },
  },
  multistream(streams)
);
