import { subscriptionManager } from "./grpc";
import { logger } from "./logger/logger";

async function main() {
  try {
    logger.info("[Starting application...]");
    await subscriptionManager.setupStream();
    logger.info("[Application started successfully.]");
  } catch (error) {
    logger.error("[Error in starting application:]", error);
    process.exit(1);
  }
}
main();
