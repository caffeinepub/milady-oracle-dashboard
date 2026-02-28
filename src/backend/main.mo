import Int "mo:core/Int";
import Time "mo:core/Time";
import Map "mo:core/Map";
import Set "mo:core/Set";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

actor {
  // Types
  type WalletType = {
    #plug;
    #oisy;
    #bioniq;
    #unisat;
    #xverse;
    #okx;
    #magicEden;
  };

  type TradeType = {
    #buy;
    #sell;
  };

  type AssetType = {
    #rune;
    #ordinal;
  };

  type Preferences = {
    theme : Text;
    currency : Text;
    notifications : Bool;
  };

  type UserProfile = {
    principal : Principal;
    username : Text;
    avatarUrl : Text;
    createdAt : Time.Time;
    preferences : Preferences;
  };

  type WalletRecord = {
    id : Text;
    walletType : WalletType;
    address : Text;
    walletLabel : Text;
    isConnected : Bool;
    addedAt : Time.Time;
  };

  type RuneHolding = {
    id : Text;
    runeName : Text;
    runeId : Text;
    amount : Float;
    avgBuyPrice : Float;
    currentPrice : Float;
    walletAddress : Text;
  };

  type OrdinalItem = {
    id : Text;
    inscriptionId : Text;
    name : Text;
    collectionName : Text;
    imageUrl : Text;
    floorPrice : Float;
    acquiredPrice : Float;
    walletAddress : Text;
  };

  type TradeRecord = {
    id : Text;
    tradeType : TradeType;
    asset : Text;
    assetType : AssetType;
    amount : Float;
    price : Float;
    totalValue : Float;
    timestamp : Time.Time;
    status : Text;
    walletAddress : Text;
  };

  type WatchlistItem = {
    id : Text;
    assetId : Text;
    assetType : AssetType;
    assetName : Text;
    targetPrice : Float;
    alertEnabled : Bool;
    addedAt : Time.Time;
  };

  type PortfolioSnapshot = {
    id : Text;
    timestamp : Time.Time;
    totalValueBtc : Float;
    totalValueUsd : Float;
    runesValueBtc : Float;
    ordinalsValueBtc : Float;
    pnlDay : Float;
    pnlWeek : Float;
    pnlMonth : Float;
  };

  module WatchlistItem {
    public func compare(a : WatchlistItem, b : WatchlistItem) : Order.Order {
      switch (Int.compare(a.addedAt, b.addedAt)) {
        case (#equal) { Text.compare(a.id, b.id) };
        case (other) { other };
      };
    };
    public func compareById(a : WatchlistItem, b : WatchlistItem) : Order.Order {
      Text.compare(a.id, b.id);
    };
  };

  module PortfolioSnapshot {
    public func compare(a : PortfolioSnapshot, b : PortfolioSnapshot) : Order.Order {
      Int.compare(a.timestamp, b.timestamp);
    };
  };

  let profiles = Map.empty<Principal, UserProfile>();
  let wallets = Map.empty<Principal, List.List<WalletRecord>>();
  let runes = Map.empty<Principal, List.List<RuneHolding>>();
  let ordinals = Map.empty<Principal, List.List<OrdinalItem>>();
  let trades = Map.empty<Principal, List.List<TradeRecord>>();
  let watchlists = Map.empty<Principal, List.List<WatchlistItem>>();
  let portfolioHistory = Map.empty<Principal, Set.Set<PortfolioSnapshot>>();

  func ensureUserProfile(caller : Principal) {
    if (not profiles.containsKey(caller)) {
      Runtime.trap("User does not have a profile");
    };
  };

  // Profile Functions
  public shared ({ caller }) func getMyProfile() : async UserProfile {
    switch (profiles.get(caller)) {
      case (null) { Runtime.trap("Profile not found") };
      case (?profile) { profile };
    };
  };

  public shared ({ caller }) func updateMyProfile(
    username : Text,
    avatarUrl : Text,
    preferences : Preferences,
  ) : async () {
    switch (profiles.get(caller)) {
      case (null) { Runtime.trap("Profile not found") };
      case (?profile) {
        let updatedProfile : UserProfile = {
          profile with
          username;
          avatarUrl;
          preferences;
        };
        profiles.add(caller, updatedProfile);
      };
    };
  };

  // Wallet Functions
  public shared ({ caller }) func getMyWallets() : async [WalletRecord] {
    ensureUserProfile(caller);
    switch (wallets.get(caller)) {
      case (null) { [] };
      case (?walletList) { walletList.toArray() };
    };
  };

  public shared ({ caller }) func addWallet(wallet : WalletRecord) : async () {
    ensureUserProfile(caller);
    let currentWallets = wallets.get(caller);
    let mutableList = switch (currentWallets) {
      case (null) { List.empty<WalletRecord>() };
      case (?walletList) { walletList };
    };
    mutableList.add(wallet);
    wallets.add(caller, mutableList);
  };

  // Rune Holdings Functions
  public shared ({ caller }) func getMyRuneHoldings() : async [RuneHolding] {
    ensureUserProfile(caller);
    switch (runes.get(caller)) {
      case (null) { [] };
      case (?runeList) { runeList.toArray() };
    };
  };

  public shared ({ caller }) func addRuneHolding(rune : RuneHolding) : async () {
    ensureUserProfile(caller);
    let currentRunes = runes.get(caller);
    let mutableList = switch (currentRunes) {
      case (null) { List.empty<RuneHolding>() };
      case (?runeList) { runeList };
    };
    mutableList.add(rune);
    runes.add(caller, mutableList);
  };

  // Ordinal Functions
  public shared ({ caller }) func getMyOrdinals() : async [OrdinalItem] {
    ensureUserProfile(caller);
    switch (ordinals.get(caller)) {
      case (null) { [] };
      case (?ordinalList) { ordinalList.toArray() };
    };
  };

  public shared ({ caller }) func addOrdinal(ordinal : OrdinalItem) : async () {
    ensureUserProfile(caller);
    let currentOrdinals = ordinals.get(caller);
    let mutableList = switch (currentOrdinals) {
      case (null) { List.empty<OrdinalItem>() };
      case (?ordinalList) { ordinalList };
    };
    mutableList.add(ordinal);
    ordinals.add(caller, mutableList);
  };

  // Trade History Functions
  public shared ({ caller }) func getMyTradeHistory() : async [TradeRecord] {
    ensureUserProfile(caller);
    switch (trades.get(caller)) {
      case (null) { [] };
      case (?tradeList) { tradeList.toArray() };
    };
  };

  public shared ({ caller }) func addTradeRecord(trade : TradeRecord) : async () {
    ensureUserProfile(caller);
    let currentTrades = trades.get(caller);
    let mutableList = switch (currentTrades) {
      case (null) { List.empty<TradeRecord>() };
      case (?tradeList) { tradeList };
    };
    mutableList.add(trade);
    trades.add(caller, mutableList);
  };

  // Watchlist Functions
  public shared ({ caller }) func getMyWatchlist() : async [WatchlistItem] {
    ensureUserProfile(caller);
    switch (watchlists.get(caller)) {
      case (null) { [] };
      case (?watchlist) { watchlist.toArray().sort() };
    };
  };

  public shared ({ caller }) func addWatchlistItem(item : WatchlistItem) : async () {
    ensureUserProfile(caller);
    let currentWatchlist = watchlists.get(caller);
    let mutableList = switch (currentWatchlist) {
      case (null) { List.empty<WatchlistItem>() };
      case (?watchlist) { watchlist };
    };
    mutableList.add(item);
    watchlists.add(caller, mutableList);
  };

  // Portfolio Snapshot Functions
  public shared ({ caller }) func savePortfolioSnapshot(snapshot : PortfolioSnapshot) : async () {
    ensureUserProfile(caller);
    let currentHistory = portfolioHistory.get(caller);
    let newSet = switch (currentHistory) {
      case (null) { Set.singleton<PortfolioSnapshot>(snapshot) };
      case (?history) {
        history.add(snapshot);
        history;
      };
    };
    portfolioHistory.add(caller, newSet);
  };

  public shared ({ caller }) func getPortfolioHistory() : async [PortfolioSnapshot] {
    ensureUserProfile(caller);
    switch (portfolioHistory.get(caller)) {
      case (null) { [] };
      case (?history) { history.toArray() };
    };
  };
};
