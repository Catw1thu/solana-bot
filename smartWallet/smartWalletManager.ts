import EventEmitter from "events";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { isValidSolanaAddress } from "../utils";
import { logger } from "../logger/logger";

export const smartWalletEvents = new EventEmitter();

class SmartWalletManager {
  private filePath: string;

  constructor() {
    this.filePath = path.join(__dirname, "smartWallet/smartWalletAddress.json");
  }

  async addAddress(
    address: string,
    name: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (!isValidSolanaAddress(address))
        return { success: false, message: "Invalid solana address." };

      if (name.length > 10)
        return { success: false, message: "Name is too long." };
      const addresses = await this.getAddress();
      if (addresses[address])
        return { success: false, message: "Address already existed." };
      addresses[address] = name;
      await writeFile(this.filePath, JSON.stringify(addresses, null, 2));
      smartWalletEvents.emit(
        "SmartWalletAddresses updated.",
        Object.keys(addresses)
      );
      return { success: true, message: "Add address successfully." };
    } catch (error) {
      logger.error("[Error in add address:]", error);
      return { success: false, message: "Add failed, try again later." };
    }
  }

  async removeAddress(
    address: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (!isValidSolanaAddress(address))
        return { success: false, message: "Invalid solana addres." };

      const addresses = await this.getAddress();
      if (!addresses[address])
        return { success: false, message: "Address isn't existed." };

      delete addresses[address];
      await writeFile(this.filePath, JSON.stringify(addresses, null, 2));
      smartWalletEvents.emit(
        "SmartWalletAddresses updated.",
        Object.keys(addresses)
      );
      return { success: true, message: "Deleta address successfully." };
    } catch (error) {
      logger.error("Error in removeAddress:", error);
      return { success: false, message: "Delete failed, try again later." };
    }
  }

  async getAddress(): Promise<Record<string, string>> {
    const data = await readFile(this.filePath, "utf-8");
    return JSON.parse(data);
  }

  async getAddressArray(): Promise<string[]> {
    const addresses = await this.getAddress();
    return Object.keys(addresses);
  }

  async getAddressMap(): Promise<Record<string, string>> {
    return await this.getAddress();
  }
}

export const smartWalletManager = new SmartWalletManager();
