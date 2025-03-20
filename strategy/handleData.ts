import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import type { SubscribeUpdate } from "@triton-one/yellowstone-grpc";
import type { TokenBalance } from "@triton-one/yellowstone-grpc/dist/grpc/solana-storage";

export async function handleData(data: SubscribeUpdate) {
  let type: "BUY" | "SELL" = "BUY";
  const preSol = data.transaction?.transaction?.meta?.preBalances[0];
  const postSol = data.transaction?.transaction?.meta?.postBalances[0];
  const preToken = data.transaction?.transaction?.meta?.preTokenBalances;
  const postToken = data.transaction?.transaction?.meta?.postTokenBalances;
  const signature = bs58.encode(data.transaction?.transaction?.signature!);
  const solBalanceChange = (Number(postSol) - Number(preSol)) / 10 ** 9;
  const accountKeys =
    data.transaction?.transaction?.transaction?.message?.accountKeys.map(
      (account) => bs58.encode(account)
    );
  const smartMoneyAddress = accountKeys![0];
  let tokenMintAccount;
  if (solBalanceChange > 0) {
    type = "SELL";
    tokenMintAccount = getTokenMintAccount(preToken!);
  } else {
    tokenMintAccount = getTokenMintAccount(postToken!);
  }

  console.log(`
    🔔 ${type === "BUY" ? "🟢" : "🔴"}  ━━智能钱包监控提醒 ━━
  👤 操作者: ${smartMoneyAddress}
  💫 操作类型: ${type === "BUY" ? "买入 🟢" : "卖出 🔴"}
  💰 交易金额: ${solBalanceChange} SOL
  💎 代币地址: ${tokenMintAccount}
  🎯 交易详情
  └─ 时间: ${formatDate()}
  🌐 浏览器查看: https://solscan.io/tx/${signature}`);
}

function getTokenMintAccount(preToken: TokenBalance[]) {
  const tokenMintAccount = preToken.find((token) => token.accountIndex === 1);
  return tokenMintAccount?.mint ?? null;
}

const formatDate = (date: Date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};
