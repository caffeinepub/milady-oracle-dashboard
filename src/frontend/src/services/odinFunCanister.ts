/**
 * Odin.Fun ICP Canister Client
 *
 * Canister ID: z2vm5-gaaaa-aaaaj-azw6q-cai (mainnet)
 * Source: https://github.com/valhallaguide/odinfun-mcp/tree/main/src/api
 *
 * Provides read-only (anonymous) and authenticated actor creation, plus
 * a high-level `executeOdinTrade` helper for buy/sell operations.
 */

import {
  Actor,
  type ActorSubclass,
  HttpAgent,
  type Identity,
} from "@dfinity/agent";
import { Principal } from "@dfinity/principal";

// ── Canister ID ───────────────────────────────────────────────────────────────

export const ODIN_FUN_CANISTER_ID = "z2vm5-gaaaa-aaaaj-azw6q-cai";
export const ICP_HOST = "https://icp-api.io";

// ── IDL factory (from odinfun-mcp CanisterInterface.did.js) ──────────────────

function buildIdlFactory(IDL: any) {
  // eslint-disable-line @typescript-eslint/no-explicit-any
  const ExternalMintRequest = IDL.Record({
    txid: IDL.Text,
    user: IDL.Principal,
    amount: IDL.Nat64,
  });
  const ExternalRuneMintRequest = IDL.Record({
    tokenid: IDL.Text,
    txid: IDL.Text,
    user: IDL.Principal,
    amount: IDL.Nat64,
  });
  const TokenAmount = IDL.Nat;
  const TokenID = IDL.Text;
  const Time = IDL.Int;
  const TokenDeltas = IDL.Vec(
    IDL.Record({
      field: IDL.Text,
      delta: IDL.Variant({
        add: TokenAmount,
        sub: TokenAmount,
        bool: IDL.Bool,
        text: IDL.Text,
        amount: TokenAmount,
      }),
    }),
  );
  const TradeType = IDL.Variant({ buy: IDL.Null, sell: IDL.Null });
  const MetadataRecord = IDL.Tuple(
    IDL.Text,
    IDL.Variant({
      hex: IDL.Text,
      int: IDL.Int,
      nat: IDL.Nat,
      principal: IDL.Principal,
      blob: IDL.Vec(IDL.Nat8),
      bool: IDL.Bool,
      nat8: IDL.Nat8,
      text: IDL.Text,
    }),
  );
  const Metadata = IDL.Vec(MetadataRecord);
  const OperationType = IDL.Variant({
    access: IDL.Record({ user: IDL.Text }),
    token: IDL.Record({ tokenid: TokenID, deltas: TokenDeltas }),
    trade: IDL.Record({
      amount_token: TokenAmount,
      tokenid: TokenID,
      user: IDL.Text,
      typeof: TradeType,
      bonded: IDL.Bool,
      amount_btc: TokenAmount,
      price: TokenAmount,
    }),
    other: IDL.Record({ data: Metadata, name: IDL.Text }),
    mint: IDL.Record({ tokenid: TokenID, data: Metadata }),
    transaction: IDL.Record({
      tokenid: TokenID,
      balance: TokenAmount,
      metadata: Metadata,
      user: IDL.Text,
      typeof: IDL.Variant({ add: IDL.Null, sub: IDL.Null }),
      description: IDL.Text,
      amount: TokenAmount,
    }),
  });
  const Operation = IDL.Record({ time: Time, typeof: OperationType });
  const OperationAndId = IDL.Record({
    id: IDL.Nat,
    operation: Operation,
  });
  const LiquiditySwap = IDL.Record({
    btc: TokenAmount,
    token: TokenAmount,
  });
  const LiquidityPool = IDL.Record({
    locked: LiquiditySwap,
    current: LiquiditySwap,
  });
  const Rune = IDL.Record({
    id: IDL.Text,
    ticker: IDL.Text,
    name: IDL.Text,
  });
  const BondingCurveSettings = IDL.Record({
    a: IDL.Float64,
    b: IDL.Float64,
    c: IDL.Float64,
    name: IDL.Text,
  });
  const Token = IDL.Record({
    creator: IDL.Principal,
    lp_supply: TokenAmount,
    bonded_btc: TokenAmount,
    pool: LiquidityPool,
    rune: IDL.Opt(Rune),
    bonding_threshold_reward: TokenAmount,
    supply: TokenAmount,
    icrc_canister: IDL.Opt(IDL.Principal),
    max_supply: TokenAmount,
    bonding_curve: IDL.Opt(BondingCurveSettings),
    bonding_threshold: TokenAmount,
    bonding_threshold_fee: TokenAmount,
  });
  const AddRequest = IDL.Record({
    metadata: Metadata,
    rune: Rune,
    divisibility: IDL.Nat,
    liquidity_threshold: TokenAmount,
    supply: TokenAmount,
    icrc_canister: IDL.Principal,
    price: TokenAmount,
  });
  const AddResponse = IDL.Variant({ ok: IDL.Null, err: IDL.Text });
  const EtchRequest = IDL.Record({
    tokenid: TokenID,
    rune: IDL.Text,
    icrc_ledger: IDL.Text,
    rune_id: IDL.Text,
  });
  const EtchResponse = IDL.Variant({ ok: IDL.Null, err: IDL.Text });
  const LiquidityType = IDL.Variant({ add: IDL.Null, remove: IDL.Null });
  const LiquidityRequest = IDL.Record({
    tokenid: TokenID,
    typeof: LiquidityType,
    amount: TokenAmount,
  });
  const LiquidityResponse = IDL.Variant({ ok: IDL.Null, err: IDL.Text });
  const MintRequest = IDL.Record({
    metadata: Metadata,
    code: IDL.Opt(IDL.Text),
    prebuy_amount: IDL.Opt(TokenAmount),
  });
  const MintResponse = IDL.Variant({ ok: IDL.Null, err: IDL.Text });
  const TradeSettings = IDL.Record({
    slippage: IDL.Opt(IDL.Tuple(TokenAmount, IDL.Nat)),
  });
  const SwapRequest = IDL.Record({
    amount_from: TokenAmount,
    settings: IDL.Opt(TradeSettings),
    tokenid_to: TokenID,
    tokenid_from: TokenID,
  });
  const SwapResponse = IDL.Variant({ ok: IDL.Null, err: IDL.Text });
  const TradeAmount = IDL.Variant({
    btc: TokenAmount,
    token: TokenAmount,
  });
  const TradeRequest = IDL.Record({
    tokenid: TokenID,
    typeof: TradeType,
    settings: IDL.Opt(TradeSettings),
    amount: TradeAmount,
  });
  const TradeResponse = IDL.Variant({ ok: IDL.Null, err: IDL.Text });
  const TransferRequest = IDL.Record({
    to: IDL.Text,
    tokenid: TokenID,
    amount: TokenAmount,
  });
  const TransferResponse = IDL.Variant({ ok: IDL.Null, err: IDL.Text });
  const WithdrawProtocol = IDL.Variant({
    btc: IDL.Null,
    ckbtc: IDL.Null,
    volt: IDL.Null,
  });
  const WithdrawRequest = IDL.Record({
    protocol: WithdrawProtocol,
    tokenid: TokenID,
    address: IDL.Text,
    amount: TokenAmount,
  });
  const WithdrawResponse = IDL.Variant({ ok: IDL.Bool, err: IDL.Text });

  return IDL.Service({
    access_grant: IDL.Func([IDL.Text], [IDL.Bool], []),
    add_fastbtc: IDL.Func([IDL.Principal, IDL.Nat64], [], []),
    add_fastbtc_bulk: IDL.Func(
      [IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Nat64))],
      [],
      [],
    ),
    add_fastbtc_bulk_v2: IDL.Func([IDL.Vec(ExternalMintRequest)], [], []),
    add_fastbtc_v2: IDL.Func([ExternalMintRequest], [], []),
    add_fastrunes: IDL.Func([ExternalRuneMintRequest], [], []),
    add_fastrunes_bulk: IDL.Func([IDL.Vec(ExternalRuneMintRequest)], [], []),
    admin_access_add: IDL.Func([IDL.Vec(IDL.Text), IDL.Text], [], []),
    admin_balance_sync: IDL.Func([IDL.Text], [IDL.Bool], []),
    admin_compensate: IDL.Func([IDL.Text], [], []),
    admin_discount_add: IDL.Func([IDL.Vec(IDL.Text), IDL.Text], [], []),
    admin_special_add: IDL.Func(
      [IDL.Vec(IDL.Tuple(IDL.Text, TokenAmount)), IDL.Text],
      [],
      [],
    ),
    admin_unlock: IDL.Func([TokenID], [], []),
    admin_user_balance_sync: IDL.Func([IDL.Text, IDL.Text], [], []),
    getBalance: IDL.Func(
      [IDL.Text, IDL.Text, TokenID],
      [TokenAmount],
      ["query"],
    ),
    getLockedTokens: IDL.Func(
      [IDL.Text],
      [
        IDL.Record({
          trade: IDL.Vec(TokenID),
          withdraw: IDL.Vec(TokenID),
          liquidity: IDL.Vec(TokenID),
        }),
      ],
      ["query"],
    ),
    getOperation: IDL.Func(
      [IDL.Text, IDL.Nat],
      [IDL.Opt(Operation)],
      ["query"],
    ),
    getOperations: IDL.Func(
      [IDL.Nat, IDL.Nat],
      [IDL.Vec(OperationAndId)],
      ["query"],
    ),
    getStats: IDL.Func(
      [IDL.Text],
      [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text))],
      ["query"],
    ),
    getToken: IDL.Func([IDL.Text, TokenID], [IDL.Opt(Token)], ["query"]),
    getTokenIndex: IDL.Func([TokenID], [IDL.Nat], ["query"]),
    icrc10_supported_standards: IDL.Func(
      [],
      [IDL.Vec(IDL.Record({ url: IDL.Text, name: IDL.Text }))],
      ["query"],
    ),
    icrc28_trusted_origins: IDL.Func(
      [],
      [IDL.Record({ trusted_origins: IDL.Vec(IDL.Text) })],
      ["query"],
    ),
    token_add: IDL.Func([AddRequest], [AddResponse], []),
    token_etch: IDL.Func([EtchRequest], [EtchResponse], []),
    token_liquidity: IDL.Func([LiquidityRequest], [LiquidityResponse], []),
    token_mint: IDL.Func([MintRequest], [MintResponse], []),
    token_swap: IDL.Func([SwapRequest], [SwapResponse], []),
    token_trade: IDL.Func([TradeRequest], [TradeResponse], []),
    token_transfer: IDL.Func([TransferRequest], [TransferResponse], []),
    token_withdraw: IDL.Func([WithdrawRequest], [WithdrawResponse], []),
    user_claim: IDL.Func([], [TokenAmount], []),
    voucher_claim: IDL.Func([IDL.Text], [IDL.Opt(TokenAmount)], []),
  });
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type TradeType = "buy" | "sell";

/** Amounts for a trade — specify either BTC or token amount */
export type TradeAmountInput = { btc: bigint } | { token: bigint };

export interface TradeResult {
  ok: boolean;
  error?: string;
}

// ── Actor factory ─────────────────────────────────────────────────────────────

type OdinActor = ActorSubclass<any>; // eslint-disable-line @typescript-eslint/no-explicit-any

/** Create an anonymous (read-only) actor — suitable for query calls */
export async function createAnonymousOdinActor(): Promise<OdinActor> {
  const { IDL } = await import("@dfinity/candid");
  const agent = await HttpAgent.create({ host: ICP_HOST });
  return Actor.createActor(buildIdlFactory.bind(null, IDL), {
    agent,
    canisterId: Principal.fromText(ODIN_FUN_CANISTER_ID),
  });
}

/** Create an authenticated actor using the provided identity */
export async function createAuthenticatedOdinActor(
  identity: Identity,
): Promise<OdinActor> {
  const { IDL } = await import("@dfinity/candid");
  const agent = await HttpAgent.create({ host: ICP_HOST, identity });
  return Actor.createActor(buildIdlFactory.bind(null, IDL), {
    agent,
    canisterId: Principal.fromText(ODIN_FUN_CANISTER_ID),
  });
}

// ── High-level trade helper ───────────────────────────────────────────────────

/**
 * Execute a buy or sell trade on Odin.Fun via the ICP canister.
 *
 * @param tokenId - Odin.Fun token ID (e.g. "RUNE•TOKEN•ID")
 * @param tradeType - "buy" or "sell"
 * @param amount - Either { btc: bigint } or { token: bigint }
 * @param identity - ICP identity (from OISY, Plug, etc.)
 * @param slippageBps - Optional slippage in basis points (default 100 = 1%)
 */
export async function executeOdinTrade(
  tokenId: string,
  tradeType: TradeType,
  amount: TradeAmountInput,
  identity: Identity,
  slippageBps = 100,
): Promise<TradeResult> {
  try {
    const actor = await createAuthenticatedOdinActor(identity);

    // Build the Candid variant for TradeAmount
    const tradeAmount =
      "btc" in amount ? { btc: amount.btc } : { token: amount.token };

    // Build the TradeRequest record
    const request = {
      tokenid: tokenId,
      typeof: tradeType === "buy" ? { buy: null } : { sell: null },
      settings: [
        {
          slippage: [[BigInt(1_000_000), BigInt(slippageBps)]],
        },
      ],
      amount: tradeAmount,
    };

    const response = await actor.token_trade(request);

    if ("ok" in response) {
      return { ok: true };
    }
    return { ok: false, error: String(response.err ?? "Unknown error") };
  } catch (err) {
    console.error("[OdinFun Canister] trade failed:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ── Agent-based actor helpers ─────────────────────────────────────────────────

/**
 * Create an Odin.Fun actor using an existing HttpAgent (e.g. from Plug or OISY).
 * This avoids needing to extract a bare Identity from the wallet — the agent
 * already has signing capability baked in.
 */
export async function createActorFromAgent(
  agent: HttpAgent,
): Promise<OdinActor> {
  const { IDL } = await import("@dfinity/candid");
  return Actor.createActor(buildIdlFactory.bind(null, IDL), {
    agent,
    canisterId: Principal.fromText(ODIN_FUN_CANISTER_ID),
  });
}

/**
 * Execute a buy or sell trade on Odin.Fun using a pre-built HttpAgent.
 * Use this when Plug or OISY wallet provides an agent directly rather
 * than an extractable Identity.
 *
 * @param tokenId - Odin.Fun token ID
 * @param tradeType - "buy" or "sell"
 * @param amount - Either { btc: bigint } or { token: bigint }
 * @param agent - Authenticated HttpAgent from the wallet
 * @param slippageBps - Optional slippage in basis points (default 100 = 1%)
 */
export async function executeOdinTradeWithAgent(
  tokenId: string,
  tradeType: TradeType,
  amount: TradeAmountInput,
  agent: HttpAgent,
  slippageBps = 100,
): Promise<TradeResult> {
  try {
    const actor = await createActorFromAgent(agent);

    const tradeAmount =
      "btc" in amount ? { btc: amount.btc } : { token: amount.token };

    const request = {
      tokenid: tokenId,
      typeof: tradeType === "buy" ? { buy: null } : { sell: null },
      settings: [
        {
          slippage: [[BigInt(1_000_000), BigInt(slippageBps)]],
        },
      ],
      amount: tradeAmount,
    };

    const response = await actor.token_trade(request);

    if ("ok" in response) {
      return { ok: true };
    }
    return { ok: false, error: String(response.err ?? "Unknown error") };
  } catch (err) {
    console.error("[OdinFun Canister] agent-based trade failed:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Query the balance for a token/account from the canister (anonymous).
 */
export async function queryOdinBalance(
  account: string,
  tokenId: string,
  _network = "mainnet",
): Promise<bigint> {
  try {
    const actor = await createAnonymousOdinActor();
    const balance: bigint = await actor.getBalance(account, account, tokenId);
    return balance;
  } catch {
    return 0n;
  }
}
