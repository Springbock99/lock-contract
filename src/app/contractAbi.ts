export const contractAbi = [
  {
    type: "constructor",
    inputs: [
      {
        name: "_tokenAddress",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "acceptOwnership",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getLockDetails",
    inputs: [{ name: "_user", type: "address", internalType: "address" }],
    outputs: [
      { name: "amount", type: "uint256", internalType: "uint256" },
      {
        name: "startLockTime",
        type: "uint256",
        internalType: "uint256",
      },
      { name: "endLockTime", type: "uint256", internalType: "uint256" },
      { name: "isWithdrawn", type: "bool", internalType: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "lockTokens",
    inputs: [
      {
        name: "_userAddress",
        type: "address",
        internalType: "address",
      },
      { name: "_amount", type: "uint256", internalType: "uint256" },
      {
        name: "_lockDuration",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "pendingOwner",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "renounceOwnership",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "token",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "contract IERC20" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "transferOwnership",
    inputs: [{ name: "newOwner", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "userLocks",
    inputs: [{ name: "", type: "address", internalType: "address" }],
    outputs: [
      { name: "amount", type: "uint256", internalType: "uint256" },
      {
        name: "startLockTime",
        type: "uint256",
        internalType: "uint256",
      },
      { name: "endLockTime", type: "uint256", internalType: "uint256" },
      { name: "isWithdrawn", type: "bool", internalType: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "withdrawTokens",
    inputs: [{ name: "_user", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "OwnershipTransferStarted",
    inputs: [
      {
        name: "previousOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "newOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "OwnershipTransferred",
    inputs: [
      {
        name: "previousOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "newOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  { type: "error", name: "InsufficientBalance", inputs: [] },
  { type: "error", name: "InvalidAmount", inputs: [] },
  { type: "error", name: "InvalidLockDuration", inputs: [] },
  { type: "error", name: "InvalidLockIndex", inputs: [] },
  { type: "error", name: "NotOwner", inputs: [] },
  {
    type: "error",
    name: "OwnableInvalidOwner",
    inputs: [{ name: "owner", type: "address", internalType: "address" }],
  },
  {
    type: "error",
    name: "OwnableUnauthorizedAccount",
    inputs: [{ name: "account", type: "address", internalType: "address" }],
  },
  { type: "error", name: "TokenTransferFailed", inputs: [] },
  { type: "error", name: "TokensAlreadyWithdrawn", inputs: [] },
  { type: "error", name: "TokensStillLocked", inputs: [] },
];
