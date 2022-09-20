import {PublicKey} from "@solana/web3.js";
import {BeetStruct, blob, bool, publicKey, u8, u64} from "../beets";
import BN from "bn.js";

export type OrcaPool = {
    isInitialized: boolean,
    version: number,
    nonce: number,
    tokenProgramId: PublicKey,
    tokenA: PublicKey,
    tokenB: PublicKey,
    poolMint: PublicKey,
    tokenAMint: PublicKey,
    tokenBMint: PublicKey,
    feeAccount: PublicKey,
    tradeFeeNumerator: BN,
    tradeFeeDenominator: BN,
    ownerTradeFeeNumerator: BN,
    ownerTradeFeeDenominator: BN,
    ownerWithdrawFeeNumerator: BN,
    ownerWithdrawFeeDenominator: BN,
    hostFeeNumerator: BN,
    hostFeeDenominator: BN,
    curveType: number,
    curveParameters: Buffer
}

export const OrcaPoolStruct = new BeetStruct<OrcaPool>(
    [
        ['version', u8],
        ['isInitialized', bool],
        ['nonce', u8],
        ['tokenProgramId', publicKey],
        ['tokenA', publicKey],
        ['tokenB', publicKey],
        ['poolMint', publicKey],
        ['tokenAMint', publicKey],
        ['tokenBMint', publicKey],
        ['feeAccount', publicKey],
        ['tradeFeeNumerator', u64],
        ['tradeFeeDenominator', u64],
        ['ownerTradeFeeNumerator', u64],
        ['ownerTradeFeeDenominator', u64],
        ['ownerWithdrawFeeNumerator', u64],
        ['ownerWithdrawFeeDenominator', u64],
        ['hostFeeNumerator', u64],
        ['hostFeeDenominator', u64],
        ['curveType', u8],
        ['curveParameters', blob(32)]
    ],
    (args) => args as OrcaPool,
    "OrcaPool"
);
