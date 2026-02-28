import { WalletType } from "../backend.d";

export type WalletConnectionMethod =
  | "extension"
  | "popup"
  | "deeplink"
  | "weblogin";

export interface WalletInfo {
  type: WalletType;
  /** Extension is injected (desktop) or always true for web/deep-link flows */
  available: boolean;
  method: WalletConnectionMethod;
}

// ── Device detection ─────────────────────────────────────────────────────────

/** Returns true on phones/tablets */
export function isMobile(): boolean {
  return (
    /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    ) ||
    (navigator.maxTouchPoints > 1 && window.innerWidth < 768)
  );
}

// ── Protocol constants ────────────────────────────────────────────────────────

/** Deep-link URI schemes for mobile wallets */
const DEEP_LINKS: Partial<Record<WalletType, string>> = {
  [WalletType.unisat]: "unisat://",
  [WalletType.xverse]: "xverse://",
  [WalletType.okx]: "okx://",
  [WalletType.magicEden]: "magiceden://",
};

/** Web auth URLs for web-login wallets (ICP wallets use II or their own web UI) */
const WEB_AUTH_URLS: Partial<Record<WalletType, string>> = {
  [WalletType.plug]: "https://identity.ic0.app/",
  [WalletType.oisy]: "https://oisy.com/sign",
  [WalletType.bioniq]: "https://identity.ic0.app/?applicationName=Bioniq",
};

// ── Connection method resolution ─────────────────────────────────────────────

/** Determine which connection method this wallet will use */
function getConnectionMethod(
  type: WalletType,
  mobile: boolean,
): WalletConnectionMethod {
  // ICP wallets always use popup (desktop) or web login redirect (mobile)
  if (
    type === WalletType.plug ||
    type === WalletType.oisy ||
    type === WalletType.bioniq
  ) {
    return mobile ? "weblogin" : "popup";
  }
  // BTC wallets: extension on desktop, deep link on mobile
  return mobile ? "deeplink" : "extension";
}

// ── Extension injection checks ────────────────────────────────────────────────

function isExtensionInjected(type: WalletType): boolean {
  try {
    const win = window as unknown as Record<string, unknown>;
    switch (type) {
      case WalletType.unisat:
        return !!win.unisat;
      case WalletType.xverse:
        return !!(win.XverseProviders || win.xverse);
      case WalletType.okx:
        return !!win.okxwallet;
      case WalletType.magicEden: {
        const me = win.magicEden as Record<string, unknown> | undefined;
        return !!me?.bitcoin;
      }
      default:
        return false;
    }
  } catch {
    return false;
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Returns full wallet info for all 7 wallets. Re-run on every modal open. */
export function getDetectedWallets(): WalletInfo[] {
  const mobile = isMobile();
  return [
    WalletType.unisat,
    WalletType.xverse,
    WalletType.okx,
    WalletType.magicEden,
    WalletType.plug,
    WalletType.oisy,
    WalletType.bioniq,
  ].map((type) => {
    const method = getConnectionMethod(type, mobile);
    // Extension wallets report real availability; web/deeplink are always "available"
    const available = method === "extension" ? isExtensionInjected(type) : true;
    return { type, available, method };
  });
}

// ── Popup helpers ─────────────────────────────────────────────────────────────

/** Open a centred popup window for web-login wallets */
export function openCenteredPopup(url: string): Window | null {
  const w = 460;
  const h = 660;
  const left = Math.round(window.screenX + (window.outerWidth - w) / 2);
  const top = Math.round(window.screenY + (window.outerHeight - h) / 2);
  return window.open(
    url,
    "wallet_auth",
    `popup=yes,width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes`,
  );
}

/** Wait for postMessage from popup; resolves with address/principal or null */
function waitForPopupMessage(
  popup: Window,
  timeoutMs = 120_000,
): Promise<string | null> {
  return new Promise((resolve) => {
    let resolved = false;

    const done = (value: string | null) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      clearInterval(pollClose);
      window.removeEventListener("message", handler);
      if (value !== null && !popup.closed) popup.close();
      resolve(value);
    };

    const timer = setTimeout(() => done(null), timeoutMs);

    const TRUSTED_ORIGINS = [
      "https://identity.ic0.app",
      "https://oisy.com",
      "https://nns.ic0.app",
      "https://bioniq.io",
    ];

    function handler(event: MessageEvent) {
      if (!TRUSTED_ORIGINS.some((o) => event.origin.startsWith(o))) return;
      const data = event.data as Record<string, unknown> | null;
      if (!data) return;
      const address = (data.address ||
        data.principal ||
        data.result ||
        data.delegationIdentity) as string | undefined;
      if (address) done(String(address));
    }

    window.addEventListener("message", handler);

    // Also resolve null when the popup is closed manually
    const pollClose = setInterval(() => {
      if (popup.closed) done(null);
    }, 500);
  });
}

// ── Core connection logic ─────────────────────────────────────────────────────

/**
 * Attempt a real wallet connection using the protocol appropriate for the
 * current device/browser. Returns:
 *   - a BTC address / ICP principal string on success
 *   - "pending-mobile-redirect" when a deep-link was launched (address comes after redirect back)
 *   - "pending-mobile-weblogin" when a new tab was opened (mobile ICP wallets)
 *   - null on failure / user cancel
 */
export async function connectRealWallet(
  type: WalletType,
): Promise<string | null> {
  try {
    const mobile = isMobile();

    // ── Desktop flows ─────────────────────────────────────────────────────────
    if (!mobile) {
      switch (type) {
        // -- Unisat (BTC / Runes, extension) ----------------------------------
        case WalletType.unisat: {
          const unisat = (window as unknown as Record<string, unknown>)
            .unisat as { requestAccounts: () => Promise<string[]> } | undefined;
          if (!unisat) return null;
          const accounts = await unisat.requestAccounts();
          return accounts[0] ?? null;
        }

        // -- Xverse (Ordinals / STX, extension) --------------------------------
        case WalletType.xverse: {
          const win = window as unknown as Record<string, unknown>;
          // Xverse v3+ API (sats-connect)
          const providers = win.XverseProviders as
            | {
                BitcoinProvider?: {
                  getAddress: (p: {
                    purposes: string[];
                    message: string;
                    onFinish: (r: {
                      addresses: { address: string }[];
                    }) => void;
                    onCancel: () => void;
                  }) => void;
                };
              }
            | undefined;
          if (!providers?.BitcoinProvider) return null;
          return await new Promise<string | null>((resolve) => {
            providers.BitcoinProvider!.getAddress({
              purposes: ["payment"],
              message: "Milady Oracle needs your BTC address",
              onFinish: (r) => resolve(r.addresses[0]?.address ?? null),
              onCancel: () => resolve(null),
            });
          });
        }

        // -- OKX Wallet (multi-chain, extension) --------------------------------
        case WalletType.okx: {
          const okx = (window as unknown as Record<string, unknown>)
            .okxwallet as
            | { bitcoin?: { connect: () => Promise<{ address: string }> } }
            | undefined;
          if (!okx?.bitcoin) return null;
          const r = await okx.bitcoin.connect();
          return r.address ?? null;
        }

        // -- Magic Eden (NFT marketplace, extension) ----------------------------
        case WalletType.magicEden: {
          const me = (window as unknown as Record<string, unknown>).magicEden as
            | { bitcoin?: { connect: () => Promise<{ address: string }> } }
            | undefined;
          if (!me?.bitcoin) return null;
          const r = await me.bitcoin.connect();
          return r.address ?? null;
        }

        // -- Plug (ICP native — extension first, popup fallback) ---------------
        case WalletType.plug: {
          const ic = (window as unknown as Record<string, unknown>).ic as
            | {
                plug?: {
                  requestConnect: (o?: {
                    whitelist?: string[];
                  }) => Promise<boolean>;
                  principalId?: string;
                };
              }
            | undefined;
          if (ic?.plug) {
            await ic.plug.requestConnect({ whitelist: [] });
            return ic.plug.principalId ?? "plug-connected";
          }
          // Plug not installed — fall back to Internet Identity popup
          const popup = openCenteredPopup("https://identity.ic0.app/");
          if (!popup) return null;
          const result = await waitForPopupMessage(popup);
          return result ?? "ii-connected";
        }

        // -- OISY (ICP self-custody — official signer protocol) ----------------
        case WalletType.oisy: {
          try {
            // Use the official OISY wallet signer library (ESM, dynamic import)
            const { IcpWallet } = await import(
              "@dfinity/oisy-wallet-signer/icp-wallet"
            );

            const wallet = await IcpWallet.connect({
              url: "https://oisy.com/sign",
              windowOptions: {
                width: 576,
                height: 625,
                position: "center",
              },
            });

            // Request any missing permissions
            const { allPermissionsGranted } =
              await wallet.requestPermissionsNotGranted();
            if (!allPermissionsGranted) {
              wallet.disconnect();
              return null;
            }

            // Retrieve the connected account
            const accounts = await wallet.accounts();
            const account = accounts?.[0];
            if (!account) {
              wallet.disconnect();
              return null;
            }

            // Return the ICP principal as the address string
            return account.owner.toString();
          } catch (err) {
            console.warn("OISY wallet connection failed:", err);
            return null;
          }
        }

        // -- Bioniq (Ordinals on ICP, Internet Identity popup) -----------------
        case WalletType.bioniq: {
          const popup = openCenteredPopup(
            "https://identity.ic0.app/?applicationName=Bioniq",
          );
          if (!popup) return null;
          const result = await waitForPopupMessage(popup);
          return result ?? "bioniq-connected";
        }
      }
    }

    // ── Mobile flows ──────────────────────────────────────────────────────────
    // BTC extension wallets → deep link to open the native app
    const deepLink = DEEP_LINKS[type];
    if (deepLink) {
      const returnUrl = encodeURIComponent(window.location.href);
      window.location.href = `${deepLink}connect?returnUrl=${returnUrl}`;
      return "pending-mobile-redirect";
    }

    // ICP wallets → open in new tab (mobile popups are usually blocked)
    const webUrl = WEB_AUTH_URLS[type];
    if (webUrl) {
      window.open(webUrl, "_blank", "noopener,noreferrer");
      return "pending-mobile-weblogin";
    }

    return null;
  } catch {
    return null;
  }
}
