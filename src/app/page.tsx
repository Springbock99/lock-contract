"use client";
import { useAccount, useConnect, useDisconnect, useReadContract } from "wagmi";
import { useEffect, useState } from "react";
import { useWriteContract } from "wagmi";
import { contractAbi } from "./contractAbi";
import { tokenAbi } from "./tokenAbi";

interface LockInfo {
  amount: bigint;
  startLockTime: bigint;
  endLockTime: bigint;
  isWithdrawn: boolean;
}

function App() {
  const [amount, setAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [searchAddress, setSearchAddress] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [isViewingLocks, setIsViewingLocks] = useState(false);
  const [expirationDate, setExpirationDate] = useState("");
  const [expirationTime, setExpirationTime] = useState("");
  const [walletBalance, setWalletBalance] = useState<bigint>(BigInt(0));
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const account = useAccount();

  const presetAmounts = ["25%", "50%", "75%", "100%"];
  const timePeriods = ["Day", "Week", "Month", "Year"];

  const smartContractAddress = process.env
    .NEXT_PUBLIC_LOCKTOKEN_ADDRESS as `0x${string}`;
  const erc20TokenAddress = process.env
    .NEXT_PUBLIC_TOKEN_ADDRESS as `0x${string}`;

  const { data: hash, writeContract, isPending } = useWriteContract();
  const { data: tokenBalance, isSuccess: isTokenBalanceSuccess } =
    useReadContract({
      address: erc20TokenAddress,
      abi: tokenAbi,
      functionName: "balanceOf",
      args: [account.address],
    });

  const {
    data: lockInfo,
    isError,
    isLoading,
  } = useReadContract<typeof contractAbi, "getLockDetails", LockInfo>({
    address: smartContractAddress,
    abi: contractAbi,
    functionName: "getLockDetails",
    args: [searchAddress || account.address],
  });

  // Effect to update wallet balance when token balance changes
  useEffect(() => {
    if (isTokenBalanceSuccess && tokenBalance !== undefined) {
      setWalletBalance(tokenBalance as bigint);
    }
  }, [tokenBalance, isTokenBalanceSuccess]);

  // Reset wallet balance when account changes or disconnects
  useEffect(() => {
    if (!account.address) {
      setWalletBalance(BigInt(0));
    }
  }, [account.address]);

  useEffect(() => {
    if (tokenBalance) {
      setWalletBalance(tokenBalance as bigint);
    }
  }, [tokenBalance]);

  const formatTokenAmount = (amount: bigint): string => {
    try {
      const amountStr = amount.toString();

      if (amountStr.length <= 18) {
        // If less than 1 token
        const padded = amountStr.padStart(18, "0");
        const decimal = padded.slice(0, -18) || "0";
        const fractional = padded.slice(-18).replace(/0+$/, "");
        return fractional ? `${decimal}.${fractional}` : decimal;
      } else {
        // If more than 1 token
        const decimal = amountStr.slice(0, -18);
        const fractional = amountStr.slice(-18).replace(/0+$/, "");
        return fractional ? `${decimal}.${fractional}` : decimal;
      }
    } catch (error) {
      console.error("Error formatting token amount:", error);
      return "0";
    }
  };

  const handlePresetAmount = (preset: string) => {
    const percentage = parseInt(preset) / 100;
    const calculatedAmount = BigInt(
      Math.floor(Number(walletBalance) * percentage)
    ).toString();
    setAmount(calculatedAmount);
  };

  const formatDate = (timestamp: bigint) => {
    // Convert BigInt to number and multiply by 1000 for JavaScript Date (which uses milliseconds)
    const date = new Date(Number(timestamp) * 1000);

    // Format the date to be user friendly
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    };

    return date.toLocaleString(undefined, options);
  };

  const getRemainingTime = (unlockTimestamp: bigint) => {
    const now = BigInt(Math.floor(Date.now() / 1000));
    const remainingSeconds = Number(unlockTimestamp - now);

    if (remainingSeconds <= 0) return "0";

    const maxDays = 36500;
    if (remainingSeconds > maxDays * 86400) {
      return "Invalid timestamp";
    }

    const days = Math.floor(remainingSeconds / 86400);
    const hours = Math.floor((remainingSeconds % 86400) / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = Math.floor(remainingSeconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);

    return parts.join(" ");
  };

  const handleTimePeriod = (period: string) => {
    const now = new Date();
    let futureDate = new Date();

    switch (period) {
      case "Day":
        futureDate.setDate(now.getDate() + 1);
        break;
      case "Week":
        futureDate.setDate(now.getDate() + 7);
        break;
      case "Month":
        futureDate.setMonth(now.getMonth() + 1);
        break;
      case "Year":
        futureDate.setFullYear(now.getFullYear() + 1);
        break;
    }

    setExpirationDate(futureDate.toISOString().split("T")[0]);
    setExpirationTime(futureDate.toTimeString().slice(0, 5));
  };

  const getUnlockTimestamp = (): bigint => {
    if (!expirationDate || !expirationTime) {
      throw new Error("Please select both date and time");
    }

    const now = new Date();
    const [hours, minutes] = expirationTime.split(":").map(Number);
    const unlockDate = new Date(expirationDate);
    unlockDate.setHours(hours, minutes, 0, 0);

    const currentTimestamp = BigInt(Math.floor(now.getTime() / 1000));
    const unlockTimestamp = BigInt(Math.floor(unlockDate.getTime() / 1000));

    const duration = unlockTimestamp - currentTimestamp;

    if (duration <= BigInt(0)) {
      throw new Error("Please select a future date and time");
    }

    return duration;
  };

  const lockTokens = async (amount: string) => {
    try {
      await approveTokens(amount);

      const unlockTime = getUnlockTimestamp();
      const lockTx = await handleLockTokens(BigInt(amount), unlockTime);
    } catch (error) {
      console.error("Error Details:", error);
    }
  };

  const approveTokens = async (amount: string) => {
    try {
      const approvalTx = await writeContract({
        address: erc20TokenAddress,
        abi: tokenAbi,
        functionName: "approve",
        args: [smartContractAddress, BigInt(amount)],
      });
      return approvalTx;
    } catch (error) {
      console.error("Approval failed:", error);
      throw error;
    }
  };

  const handleLockTokens = async (amount: BigInt, unlockTime: BigInt) => {
    try {
      const lockTx = writeContract({
        address: smartContractAddress,
        abi: contractAbi,
        functionName: "lockTokens",
        args: [recipientAddress, amount, unlockTime],
      });
      return lockTx;
    } catch (error) {
      console.error("Approval failed:", error);
      throw error;
    }
  };

  const handleWithdraw = async () => {
    try {
      await writeContract({
        address: smartContractAddress,
        abi: contractAbi,
        functionName: "withdrawTokens",
        args: [withdrawAddress],
      });
    } catch (error) {
      console.error("Error withdrawing tokens:", error);
    }
  };

  return (
    
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Box 1: Wallet Connect */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center">
            <div className="text-gray-900">
              {account.status === "connected" && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Balance:</span>
                  <span>{formatTokenAmount(walletBalance)} Tokens</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {account.status === "connected" ? (
                <button
                  onClick={() => disconnect()}
                  className="px-3 py-1.5 bg-black text-white rounded-lg hover:bg-gray-800 text-sm"
                >
                  Disconnect
                </button>
              ) : (
                connectors.map((connector) => (
                  <button
                    key={connector.uid}
                    onClick={() => connect({ connector })}
                    className="px-3 py-1.5 bg-black text-white rounded-lg hover:bg-gray-800 text-sm"
                  >
                    {connector.name}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Box 2: Lock Tokens */}
        {account.status === "connected" && (
          <div className="bg-white rounded-lg text-black shadow-md p-6">
            <h2 className="text-xl text-black font-semibold mb-4">
              Lock Tokens
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-black font-medium text-black mb-2">
                  Recipient Address
                </label>
                <input
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  placeholder="Enter recipient address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  placeholder="Enter amount"
                />
                <div className="flex gap-2 mt-2">
                  {presetAmounts.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => handlePresetAmount(preset)}
                      className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-md hover:bg-indigo-200"
                      disabled={!walletBalance}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lock Duration
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="date"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    className="p-2 border rounded-md"
                    min={new Date().toISOString().split("T")[0]}
                  />
                  <input
                    type="time"
                    value={expirationTime}
                    onChange={(e) => setExpirationTime(e.target.value)}
                    className="p-2 border rounded-md"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  {timePeriods.map((period) => (
                    <button
                      key={period}
                      onClick={() => handleTimePeriod(period)}
                      className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-md hover:bg-indigo-200"
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>

              <button
                className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                onClick={() => lockTokens(amount)}
                disabled={
                  isPending ||
                  !amount ||
                  !recipientAddress ||
                  !expirationDate ||
                  !expirationTime ||
                  !walletBalance
                }
              >
                {isPending ? "Transaction Pending..." : "Lock Tokens"}
              </button>
            </div>
          </div>
        )}

        {/* Box 3: View Locks */}
        {account.status === "connected" && (
          <div className="bg-white rounded-lg text-black shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">View Locked Tokens</h2>
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  placeholder="Enter address to check locks"
                />
                <button
                  onClick={() => setIsViewingLocks(true)}
                  className="w-full mt-2 bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700"
                >
                  View Locks
                </button>
              </div>

              {isViewingLocks && searchAddress && (
                <div className="mt-4">
                  {isLoading ? (
                    <p className="text-gray-600">Loading lock information...</p>
                  ) : isError ? (
                    <p className="text-red-600">
                      Error loading lock information
                    </p>
                  ) : lockInfo ? (
                    <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Locked Amount:</span>
                        <span className="font-medium text-gray-900">
                          {formatTokenAmount(lockInfo[0])} Tokens
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Start Lock Date:</span>
                        <span className="font-medium text-gray-900">
                          {formatDate(lockInfo[1])}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">End Lock Date:</span>
                        <span className="font-medium text-gray-900">
                          {formatDate(lockInfo[2])}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Time Remaining:</span>
                        <span
                          className={`font-medium ${
                            getRemainingTime(lockInfo[2]) ===
                            "0 (Can be claimed)"
                              ? "text-green-600"
                              : "text-indigo-600"
                          }`}
                        >
                          {getRemainingTime(lockInfo[2])}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Status</span>
                        <span
                          className={`font-medium ${lockInfo[3] ? "text-red-600" : "text-green-600"}`}
                        >
                          {lockInfo[3] ? "Withdrawn" : ""}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-600">
                      No locks found for this address
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Box 4: Withdraw Tokens */}
        {account.status === "connected" && (
          <div className="bg-white rounded-lg text-black shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Withdraw Tokens</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Withdrawal Address
                </label>
                <input
                  type="text"
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  placeholder="Enter address to withdraw tokens from"
                />
                <button
                  onClick={handleWithdraw}
                  className="w-full mt-2 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400"
                  disabled={isPending || !withdrawAddress}
                >
                  {isPending ? "Withdrawing..." : "Withdraw Tokens"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
