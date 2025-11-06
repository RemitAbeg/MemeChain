import { useReadContract } from "wagmi";
import { useAccount } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";
import { useMemo } from "react";

// Format USDC amount (6 decimals) to display string
// Returns a compact format for large numbers
const formatUSDC = (amount: bigint): string => {
  if (amount === 0n) return "0";

  const divisor = BigInt(1_000_000); // 6 decimals
  const whole = amount / divisor;
  const decimals = amount % divisor;

  // For very large numbers, use compact notation
  if (whole >= 1_000_000n) {
    const millions = Number(whole) / 1_000_000;
    return `${millions.toFixed(2)}M`;
  }
  if (whole >= 1_000n) {
    const thousands = Number(whole) / 1_000;
    return `${thousands.toFixed(2)}K`;
  }

  if (decimals === 0n) {
    return whole.toString();
  }

  const decimalsStr = decimals.toString().padStart(6, "0");
  // Remove trailing zeros
  const trimmedDecimals = decimalsStr.replace(/0+$/, "");
  if (trimmedDecimals === "") {
    return whole.toString();
  }

  // Add commas for thousands
  const wholeStr = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${wholeStr}.${trimmedDecimals}`;
};

export function useUSDCBalance() {
  const { address, isConnected } = useAccount();

  const {
    data: balance,
    isLoading,
    error,
  } = useReadContract({
    address: CONTRACTS.MOCK_USDC.address as `0x${string}`,
    abi: CONTRACTS.MOCK_USDC.abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address,
    },
  });

  const formattedBalance = useMemo(() => {
    if (!balance) return "0";
    return formatUSDC(balance as bigint);
  }, [balance]);

  return {
    balance: balance as bigint | undefined,
    formattedBalance,
    isLoading,
    error,
    isConnected,
  };
}
