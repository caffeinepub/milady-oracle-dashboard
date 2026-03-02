/**
 * WalletIdentity context
 *
 * Stores the ICP Identity from the connected wallet (OISY, Plug, Internet Identity).
 * Used by OdinTrading to authenticate canister calls.
 */
import type { Identity } from "@dfinity/agent";
import { createContext, useContext, useState } from "react";

interface WalletIdentityContextValue {
  /** The ICP identity from the connected wallet, or null if not connected */
  identity: Identity | null;
  /** Update the stored identity */
  setIdentity: (i: Identity | null) => void;
  /** The principal as a text string, or null */
  principalText: string | null;
}

const WalletIdentityContext = createContext<WalletIdentityContextValue>({
  identity: null,
  setIdentity: () => {},
  principalText: null,
});

export function WalletIdentityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [identity, setIdentityState] = useState<Identity | null>(null);

  const principalText = (() => {
    if (!identity) return null;
    try {
      const p = identity.getPrincipal();
      if (p.isAnonymous()) return null;
      return p.toText();
    } catch {
      return null;
    }
  })();

  const setIdentity = (i: Identity | null) => {
    setIdentityState(i);
  };

  return (
    <WalletIdentityContext.Provider
      value={{ identity, setIdentity, principalText }}
    >
      {children}
    </WalletIdentityContext.Provider>
  );
}

/** Hook to access the wallet identity context */
export function useWalletIdentity(): WalletIdentityContextValue {
  return useContext(WalletIdentityContext);
}
