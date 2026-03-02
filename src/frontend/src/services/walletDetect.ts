import type { Identity } from "@dfinity/agent";
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

/**
 * Enriched connection result that may include an ICP Identity
 * when connecting OISY or Plug (ICP-native wallets).
 */
export interface ConnectionResult {
  address: string;
  identity?: Identity;
}

// ── Module-level wallet/agent storage ────────────────────────────────────────

/** Stored OISY IcpWallet instance (set after successful OISY connect) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _oisyWallet: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setOisyWallet(w: any): void {
  _oisyWallet = w;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getOisyWallet(): any {
  return _oisyWallet;
}

/** Stored Plug HttpAgent (set after successful Plug connect) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _plugAgent: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setPlugAgent(a: any): void {
  _plugAgent = a;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getPlugAgent(): any {
  return _plugAgent;
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

// ── OISY signer connection ────────────────────────────────────────────────────

/**
 * Connect to OISY wallet using the official @dfinity/oisy-wallet-signer protocol.
 * Returns a ConnectionResult with the ICP principal and wallet instance on success.
 *
 * Key fix: Relies entirely on the IcpWallet promise chain and stores the wallet
 * instance in module-level _oisyWallet so OdinTrading can use its agent for trades.
 */
async function connectOisy(): Promise<ConnectionResult | null> {
  try {
    // Dynamic import so the lib is only loaded on demand.
    // eslint-disable-next-line no-new-func
    const signerModule = await (
      new Function("m", "return import(m)")(
        "@dfinity/oisy-wallet-signer",
      ) as Promise<Record<string, unknown>>
    ).catch(() => null);

    // Cast to a loosely-typed connector
    const IcpWallet = signerModule?.IcpWallet as
      | {
          connect: (opts: {
            url: string;
            windowOptions?: {
              width?: number;
              height?: number;
              position?: string;
            };
            onDisconnect?: () => void;
          }) => Promise<{
            requestPermissionsNotGranted: () => Promise<{
              allPermissionsGranted: boolean;
            }>;
            accounts: () => Promise<{ owner: { toText: () => string } }[]>;
            disconnect: () => void;
            // The agent property — HttpAgent from @dfinity/agent
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            agent?: any;
          }>;
        }
      | undefined;

    if (!IcpWallet) {
      // Library not available — fall back to manual popup
      const address = await connectOisyViaPopup();
      if (!address) return null;
      return { address };
    }

    const wallet = await IcpWallet.connect({
      url: "https://oisy.com/sign",
      windowOptions: {
        width: 576,
        height: 625,
        position: "center",
      },
      onDisconnect: () => {
        console.info("[OISY] Popup disconnected by user");
      },
    });

    // 1. Request any permissions that haven't been granted yet.
    const { allPermissionsGranted } =
      await wallet.requestPermissionsNotGranted();

    if (!allPermissionsGranted) {
      console.warn("[OISY] Not all permissions granted");
      wallet.disconnect();
      return null;
    }

    // 2. Retrieve the list of accounts.
    const accounts = await wallet.accounts();
    const account = accounts?.[0];

    if (!account) {
      console.warn("[OISY] No accounts returned");
      wallet.disconnect();
      return null;
    }

    const address = account.owner.toText();

    // 3. Store the wallet instance for later use in trades
    setOisyWallet(wallet);

    // 4. Try to extract identity from the wallet's agent
    let identity: Identity | undefined;
    try {
      const agent = wallet.agent;
      if (agent) {
        // Try different ways to access the identity from the HttpAgent
        const extracted =
          agent._identity ??
          agent.config?.identity ??
          (typeof agent.getIdentity === "function"
            ? agent.getIdentity()
            : null);
        if (extracted && typeof extracted.getPrincipal === "function") {
          identity = extracted as Identity;
        }
      }
    } catch (e) {
      console.debug("[OISY] Could not extract identity from agent:", e);
    }

    return { address, identity };
  } catch (err) {
    console.error("[OISY] Connection failed:", err);
    // Try popup fallback
    const address = await connectOisyViaPopup();
    if (!address) return null;
    return { address };
  }
}

/**
 * Fallback: open the OISY sign page in a popup and wait for a postMessage
 * with the principal, or poll until the user closes the popup.
 */
async function connectOisyViaPopup(): Promise<string | null> {
  try {
    const popup = openCenteredPopup("https://oisy.com/sign");
    if (!popup) return null;

    return new Promise<string | null>((resolve) => {
      let resolved = false;

      const done = (value: string | null) => {
        if (resolved) return;
        resolved = true;
        clearInterval(pollClose);
        clearTimeout(timer);
        window.removeEventListener("message", handler);
        if (value !== null && !popup.closed) popup.close();
        resolve(value);
      };

      const timer = setTimeout(() => done(null), 120_000);
      const pollClose = setInterval(() => {
        if (popup.closed) done(null);
      }, 500);

      function handler(event: MessageEvent) {
        if (!event.origin.startsWith("https://oisy.com")) return;
        const data = event.data as Record<string, unknown> | null;
        if (!data) return;
        const principal = (data.principal ?? data.address ?? data.owner) as
          | string
          | undefined;
        if (principal) done(String(principal));
      }

      window.addEventListener("message", handler);
    });
  } catch {
    return null;
  }
}

// ── Core connection logic ─────────────────────────────────────────────────────

/**
 * Attempt a real wallet connection using the protocol appropriate for the
 * current device/browser. Returns:
 *   - a ConnectionResult with address (and optionally identity) on success
 *   - "pending-mobile-redirect" when a deep-link was launched
 *   - "pending-mobile-weblogin" when a new tab was opened (mobile ICP wallets)
 *   - null on failure / user cancel
 */
export async function connectRealWallet(
  type: WalletType,
): Promise<
  | ConnectionResult
  | "pending-mobile-redirect"
  | "pending-mobile-weblogin"
  | null
> {
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
          const address = accounts[0];
          if (!address) return null;
          return { address };
        }

        // -- Xverse (Ordinals / STX, extension) --------------------------------
        case WalletType.xverse: {
          const win = window as unknown as Record<string, unknown>;
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
          return await new Promise<ConnectionResult | null>((resolve) => {
            providers.BitcoinProvider!.getAddress({
              purposes: ["payment"],
              message: "Milady Oracle needs your BTC address",
              onFinish: (r) => {
                const address = r.addresses[0]?.address;
                resolve(address ? { address } : null);
              },
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
          return r.address ? { address: r.address } : null;
        }

        // -- Magic Eden (NFT marketplace, extension) ----------------------------
        case WalletType.magicEden: {
          const me = (window as unknown as Record<string, unknown>).magicEden as
            | { bitcoin?: { connect: () => Promise<{ address: string }> } }
            | undefined;
          if (!me?.bitcoin) return null;
          const r = await me.bitcoin.connect();
          return r.address ? { address: r.address } : null;
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
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  agent?: any;
                };
              }
            | undefined;
          if (ic?.plug) {
            await ic.plug.requestConnect({ whitelist: [] });
            const address = ic.plug.principalId ?? "plug-connected";
            // Store the Plug agent for authenticated canister calls
            const plugAgent = ic.plug.agent ?? null;
            if (plugAgent) {
              setPlugAgent(plugAgent);
            }
            // Try to extract identity from plug agent
            let identity: Identity | undefined;
            try {
              if (plugAgent) {
                const extracted =
                  plugAgent._identity ??
                  plugAgent.config?.identity ??
                  (typeof plugAgent.getIdentity === "function"
                    ? plugAgent.getIdentity()
                    : null);
                if (extracted && typeof extracted.getPrincipal === "function") {
                  identity = extracted as Identity;
                }
              }
            } catch (e) {
              console.debug("[Plug] Could not extract identity:", e);
            }
            return { address, identity };
          }
          // Plug not installed — fall back to Internet Identity popup
          const popup = openCenteredPopup("https://identity.ic0.app/");
          if (!popup) return null;
          const result = await waitForPopupMessage(popup);
          if (!result) return null;
          return { address: result ?? "ii-connected" };
        }

        // -- OISY (ICP self-custody — official signer protocol) ----------------
        case WalletType.oisy: {
          return await connectOisy();
        }

        // -- Bioniq (Ordinals on ICP, Internet Identity popup) -----------------
        case WalletType.bioniq: {
          const popup = openCenteredPopup(
            "https://identity.ic0.app/?applicationName=Bioniq",
          );
          if (!popup) return null;
          const result = await waitForPopupMessage(popup);
          if (!result) return null;
          return { address: result ?? "bioniq-connected" };
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
