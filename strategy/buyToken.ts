import { Program } from "@coral-xyz/anchor";
import { PublicKey, Transaction, Connection, Keypair } from "@solana/web3.js";
import type { PumpFun } from "../IDL";
import { PUMP_FUN_IDL } from "../IDL";
import {
  anchorProvider,
  keypair,
  connection,
  PUMP_FUN_PROGRAM_ID,
} from "../config/config";
import {
  getAssociatedTokenAddress,
  getAccount,
  TokenAccountNotFoundError,
  TokenInvalidAccountOwnerError,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import type { Account } from "@solana/spl-token";
import { logger } from "../logger/logger";

export async function buyToken(
  tokenMintAccount: PublicKey,
  solAmount: number = 0.00001,
  slippage: number = 10,
  createdAt: number,
  priorityFee?: number
) {
  const oldBuildTime = Date.now();
  const program = new Program<PumpFun>(PUMP_FUN_IDL as PumpFun, anchorProvider);
  const transaction = new Transaction();
  // AT
  const myAssociatedTokenAddress = await getAssociatedTokenAddress(
    tokenMintAccount,
    keypair.publicKey
  );
  // ATA
  await getOrCreateAssociatedTokenAccountTransaction(
    connection,
    myAssociatedTokenAddress,
    tokenMintAccount,
    keypair,
    transaction
  );
  // To do 获取一些我看不懂的账户数据然后进行buy操作
}

async function getOrCreateAssociatedTokenAccountTransaction(
  connection: Connection,
  publicKeyAdress: PublicKey,
  tokenMintAccount: PublicKey,
  keypair: Keypair,
  transaction: Transaction
) {
  let account: Account;
  try {
    account = await getAccount(connection, publicKeyAdress, "finalized");
    return account;
  } catch (error: unknown) {
    if (
      error instanceof TokenAccountNotFoundError ||
      error instanceof TokenInvalidAccountOwnerError
    ) {
      try {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            keypair.publicKey,
            publicKeyAdress,
            keypair.publicKey,
            tokenMintAccount
          )
        );
      } catch (error: unknown) {
        logger.error("Error in creating associated token account", error);
      }
    } else {
      throw error;
    }
  }
}
