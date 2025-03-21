import { AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { Connection, Keypair } from "@solana/web3.js";
import bs58 from "bs58";
// rpc
export const RPC_URL = Bun.env.RPC_URL!;
export const GRPC_URL = Bun.env.GRPC_URL!;
//
export const keypair = Keypair.fromSecretKey(bs58.decode(Bun.env.PRIVATE_KEY!));
// tg
export const BOT_TOKEN = Bun.env.BOT_TOKEN!;

// subRequestConfig
export const PUMP_FUN_PROGRAM_ID =
  "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";

export const connection = new Connection(RPC_URL, { commitment: "processed" });
const wallet = new Wallet(keypair);
export const anchorProvider = new AnchorProvider(connection, wallet, {
  commitment: "processed",
  skipPreflight: true,
});
