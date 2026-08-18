"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { KitEventType, Networks, StellarWalletsKit } from "@creit.tech/stellar-wallets-kit";
import { FreighterModule } from "@creit.tech/stellar-wallets-kit/modules/freighter";
import { xBullModule } from "@creit.tech/stellar-wallets-kit/modules/xbull";
import { AlbedoModule } from "@creit.tech/stellar-wallets-kit/modules/albedo";
import { LobstrModule } from "@creit.tech/stellar-wallets-kit/modules/lobstr";
import { NETWORK_PASSPHRASE } from "./config";
import type { SignTx } from "./soroban";

let initialized = false;
function ensureInit() {
  if (initialized || typeof window === "undefined") return;
  StellarWalletsKit.init({
    network: Networks.TESTNET,
    modules: [
      new FreighterModule(),
      new xBullModule(),
      new AlbedoModule(),
      new LobstrModule(),
    ],
  });
  initialized = true;
}

interface WalletContextValue {
  address: string | null;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  signTx: SignTx;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  // Init the kit and mirror its address into React state. STATE_UPDATED fires
  // once on launch (restoring a previously connected wallet) and on changes.
  useEffect(() => {
    ensureInit();
    const unsub = StellarWalletsKit.on(KitEventType.STATE_UPDATED, (e) => {
      setAddress(e.payload.address ?? null);
    });
    return unsub;
  }, []);

  const connect = useCallback(async () => {
    ensureInit();
    setConnecting(true);
    try {
      const { address } = await StellarWalletsKit.authModal();
      setAddress(address);
    } catch {
      // user closed the modal — ignore
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    await StellarWalletsKit.disconnect();
    setAddress(null);
  }, []);

  const signTx = useCallback<SignTx>(
    async (xdr) => {
      if (!address) throw new Error("Wallet not connected");
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
        address,
        networkPassphrase: NETWORK_PASSPHRASE,
      });
      return { signedTxXdr };
    },
    [address]
  );

  const value = useMemo(
    () => ({ address, connecting, connect, disconnect, signTx }),
    [address, connecting, connect, disconnect, signTx]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
