import { http, cookieStorage, createConfig, createStorage } from "wagmi";
import { mainnet, sepolia, hederaTestnet } from "wagmi/chains";
import { coinbaseWallet, injected, walletConnect } from "wagmi/connectors";

export function getConfig() {
  return createConfig({
    chains: [mainnet, sepolia, hederaTestnet],
    connectors: [
      injected(),
      coinbaseWallet(),
      walletConnect({ projectId: "e232a410685e4bb3db8313b183c281f5" }),
    ],
    storage: createStorage({
      storage: cookieStorage,
    }),
    ssr: true,
    transports: {
      [mainnet.id]: http(),
      [sepolia.id]: http(),
      // [hedera.id]: http(),
      [hederaTestnet.id]: http(),
    },
  });
}

declare module "wagmi" {
  interface Register {
    config: ReturnType<typeof getConfig>;
  }
}
