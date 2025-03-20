import Client, {
  CommitmentLevel,
  SubscribeRequest,
  SubscribeUpdate,
} from "@triton-one/yellowstone-grpc";
import type { ClientDuplexStream } from "@grpc/grpc-js";
import { GRPC_URL, PUMP_FUN_PROGRAM_ID } from "./config/config";
import { logger } from "./logger/logger";
import {
  smartWalletManager,
  smartWalletEvents,
} from "./smartWallet/smartWalletManager";
import { handleData } from "./strategy/handleData";

class SubscriptionManager {
  private client: Client;
  private stream: ClientDuplexStream<SubscribeRequest, SubscribeUpdate> | null =
    null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private isUpdating: boolean = false;

  constructor() {
    this.client = new Client(GRPC_URL, undefined, {
      "grpc.max_receive_message_length": 16 * 1024 * 1024,
    });
    this.setupAddressEventListener();
  }

  async setupStream(): Promise<void> {
    if (this.isUpdating) {
      logger.info("[Setup already in progress, skipping...]");
      return;
    }
    this.isUpdating = true;
    logger.info("[Start SetupStream]");
    try {
      if (!this.stream) {
        this.stream = await this.client.subscribe();
        await this.startPingPong(this.stream);
      }
      await this.updateSubscription();
      this.isUpdating = false;
    } catch (error) {
      logger.error("[Stream setup error:]", error);
      this.isUpdating = false;
    }
  }

  private async updateSubscription() {
    if (!this.stream || this.stream.destroyed) {
      logger.info("[Stream not available, creating a new stream]");
      this.stream = await this.client.subscribe();
    }
    const SMART_WALLET_ADDRESS = await smartWalletManager.getAddressArray();
    logger.info(
      "[Updating subscription with addresses:]",
      SMART_WALLET_ADDRESS
    );
    const subscribeRequestConfig: SubscribeRequest = {
      accounts: {},
      slots: {},
      transactions: {
        pumpFun: {
          accountInclude: SMART_WALLET_ADDRESS,
          accountExclude: [],
          accountRequired: [PUMP_FUN_PROGRAM_ID],
          failed: false,
        },
      },
      transactionsStatus: {},
      blocks: {},
      blocksMeta: {},
      entry: {},
      accountsDataSlice: [],
      commitment: CommitmentLevel.PROCESSED,
    };

    await this.sendSubscriptionRequest(this.stream, subscribeRequestConfig);
  }

  private async sendSubscriptionRequest(
    stream: ClientDuplexStream<SubscribeRequest, SubscribeUpdate>,
    subscribeRequestConfig: SubscribeRequest
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      logger.info("[Sending subscription request]");
      stream.write(subscribeRequestConfig, (error: Error) => {
        if (error) {
          logger.error("[Subscription request error:]", error);
          reject(error);
        } else {
          logger.info("[Subscription request sent]");
          resolve();
        }
      });
    });
  }

  private async startPingPong(
    stream: ClientDuplexStream<SubscribeRequest, SubscribeUpdate>
  ) {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    const sendPing = async () => {
      if (!stream || stream.destroyed) {
        if (this.pingInterval) {
          clearInterval(this.pingInterval);
          this.pingInterval = null;
        }
        return;
      }
      try {
        await this.sendPing(stream);
      } catch (error) {
        logger.error("[Ping error:]", error);
      }
    };
    this.pingInterval = setInterval(sendPing, 5000);
    await sendPing();
  }

  private async sendPing(
    stream: ClientDuplexStream<SubscribeRequest, SubscribeUpdate>
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      stream.write({
        accounts: {},
        slots: {},
        transactions: {},
        transactionsStatus: {},
        blocks: {},
        blocksMeta: {},
        entry: {},
        accountsDataSlice: [],
        commitment: undefined,
        ping: { id: 1 },
      }),
        (error: Error) => {
          if (error) {
            logger.error("[Ping error:]", error);
            reject(error);
          } else {
            resolve();
          }
        };
    });
  }

  private async setupAddressEventListener() {
    smartWalletEvents.on("SmartWalletAddresses updated.", async () => {
      try {
        if (this.isUpdating) {
          logger.info("[Setup already in progress, skipping...]");
          return;
        }
        logger.info("[SmartWalletAddresses updated, updating subscription...]");
        await this.updateSubscription();
        logger.info("[Subscription updated successfully.]");
      } catch (error) {
        logger.error("[Error in updating subscription:]", error);
        this.isUpdating = false;
      }
    });
  }

  private async setupStreamEventListener(
    stream: ClientDuplexStream<SubscribeRequest, SubscribeUpdate>
  ): Promise<void> {
    logger.info("[Setting up stream event listener]");
    return new Promise((resolve, reject) => {
      stream.on("data", async (data: SubscribeUpdate) => {
        try {
          await handleData(data);
        } catch (error) {
          logger.error("[Error in handling data:]", error);
        }
      });
      stream.on("error", (error: Error) => {
        logger.error("[Stream error:]", error);
        this.handleStreamError();
      });
      stream.on("end", () => {
        logger.info("[Stream end]");
        this.handleStreamEnd();
      });
      stream.on("close", () => {
        logger.info("[Stream close]");
        this.handleStreamEnd();
      });
      resolve();
    });
  }

  private async handleStreamError() {
    logger.info("[Handling stream error]");
    this.stream = null;
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (!this.isUpdating) {
      await this.setupStream().catch(console.error);
    }
  }

  private async handleStreamEnd() {
    logger.info("[Handling stream end]");
    this.stream = null;
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}

export const subscriptionManager = new SubscriptionManager();
