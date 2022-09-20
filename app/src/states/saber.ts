import { BeetStruct, bool, publicKey, u64, u8, bignum } from "../beets";
import { PublicKey } from "@solana/web3.js";

export type RawFees = {
    adminTradeFeeNumerator: bignum;
    adminTradeFeeDenominator: bignum;
    adminWithdrawFeeNumerator: bignum;
    adminWithdrawFeeDenominator: bignum;
    tradeFeeNumerator: bignum;
    tradeFeeDenominator: bignum;
    withdrawFeeNumerator: bignum;
    withdrawFeeDenominator: bignum;
};

export type StableSwap = {
    isInitialized: boolean;
    isPaused: boolean;
    nonce: number;
    initialAmpFactor: bignum;
    targetAmpFactor: bignum;
    startRampTs: bignum;
    stopRampTs: bignum;
    futureAdminDeadline: bignum;
    futureAdminAccount: PublicKey;
    adminAccount: PublicKey;
    tokenA: PublicKey;
    tokenB: PublicKey;
    tokenPool: PublicKey;
    tokenAMint: PublicKey;
    tokenBMint: PublicKey;
    adminFeeAccountA: PublicKey;
    adminFeeAccountB: PublicKey;
    fees: RawFees;
};


export const RawFeesStruct = new BeetStruct<RawFees>(
    [
        ["adminTradeFeeNumerator", u64],
        ["adminTradeFeeDenominator", u64],
        ["adminWithdrawFeeNumerator", u64],
        ["adminWithdrawFeeDenominator", u64],
        ["tradeFeeNumerator", u64],
        ["tradeFeeDenominator", u64],
        ["withdrawFeeNumerator", u64],
        ["withdrawFeeDenominator", u64],
    ],
    (args) => args as RawFees,
    "StableSwap"
);

export const StableSwapStruct = new BeetStruct<StableSwap>(
    [
        ["isInitialized", bool],
        ["isPaused", bool],
        ["nonce", u8],
        ["initialAmpFactor", u64],
        ["targetAmpFactor", u64],
        ["startRampTs", u64],
        ["stopRampTs", u64],
        ["futureAdminDeadline", u64],
        ["futureAdminAccount", publicKey],
        ["adminAccount", publicKey],
        ["tokenA", publicKey],
        ["tokenB", publicKey],
        ["tokenPool", publicKey],
        ["tokenAMint", publicKey],
        ["tokenBMint", publicKey],
        ["adminFeeAccountA", publicKey],
        ["adminFeeAccountB", publicKey],
        ["fees", RawFeesStruct],
    ],
    (args) => args as StableSwap,
    "StableSwap"
);
