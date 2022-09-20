import {PublicKey} from "@solana/web3.js";
// @ts-ignore
import whirlpoolPools from "../artifacts/whirlpool_pools.json";
import _ from "lodash";
import { Account, TokenInfo } from "../loader";
import {Whirlpool, WhirlpoolStruct} from "../states/whirlpool";
import {Adapter, ChainContext, SwapFn} from "./common";
import BN from "bn.js";

export class WhirlpoolAdapter extends Adapter<Whirlpool> {
    getWhirlpool(
        programId: PublicKey,
        whirlpoolsConfigKey: PublicKey,
        tokenMintAKey: PublicKey,
        tokenMintBKey: PublicKey,
        tickSpacing: number
    ) {
        return PublicKey.findProgramAddress(
            [
                Buffer.from("whirlpool"),
                whirlpoolsConfigKey.toBuffer(),
                tokenMintAKey.toBuffer(),
                tokenMintBKey.toBuffer(),
                new BN(tickSpacing).toArrayLike(Buffer, "le", 2),
            ],
            programId
        );
    }

    getTickArray(programId: PublicKey, whirlpoolAddress: PublicKey, startTick: number) {
        return PublicKey.findProgramAddress(
            [
                Buffer.from("tick_array"),
                whirlpoolAddress.toBuffer(),
                Buffer.from(startTick.toString()),
            ],
            programId
        );
    }

    getTickArrayFromTickIndex(
        tickIndex: number,
        tickSpacing: number,
        whirlpool: PublicKey,
        programId: PublicKey,
        tickArrayOffset = 0
    ) {
        const startIndex = getStartTickIndex(tickIndex, tickSpacing, tickArrayOffset);
        return this.getTickArray(
            programId,
            whirlpool,
            startIndex
        );
    }

    getTickArrayFromSqrtPrice(
        sqrtPriceX64: BN,
        tickSpacing: number,
        whirlpool: PublicKey,
        programId: PublicKey,
        tickArrayOffset = 0
    ) {
        const tickIndex = sqrtPriceX64ToTickIndex(sqrtPriceX64);
        return this.getTickArrayFromTickIndex(
            tickIndex,
            tickSpacing,
            whirlpool,
            programId,
            tickArrayOffset
        );
    }

    filterPoolsByIds(ids?: PublicKey[]) {
        return whirlpoolPools.filter(pool => {
            const poolId = new PublicKey(pool.pubkey);
            return ids ? _.some(ids, id => id.equals(poolId)) : true;
        });
    }

    forMint(mint: PublicKey, ids?: PublicKey[]) {
        const pools = this.filterPoolsByIds(ids);
        return pools.filter(pool => {
            const aMint = new PublicKey(pool.tokenMintA);
            const bMint = new PublicKey(pool.tokenMintB);
            return mint.equals(aMint) || mint.equals(bMint);
        })
    }

    forMints(mints: PublicKey[], ids?: PublicKey[]) {
        const mintsSet = new Set(mints.map(m => m.toString()));
        const pools = this.filterPoolsByIds(ids);
        return pools.filter(pool => {
            return mintsSet.has(pool.tokenMintA) && mintsSet.has(pool.tokenMintB);
        })
    }

    getPools(ids?: PublicKey[]) {
        return this.filterPoolsByIds(ids);
    }

    getTokens(pool: Whirlpool): { tokenA: TokenInfo; tokenB: TokenInfo } {
        const tokenA = this.loader.getTokenInfo(pool.tokenMintA);
        const tokenB = this.loader.getTokenInfo(pool.tokenMintB);
        if (!tokenA || !tokenB) {
            throw new Error("Tokens are unsupported");
        }
        return {tokenA, tokenB};
    }

    async fetchPools(ids?: PublicKey[]): Promise<Account<Whirlpool>[]> {
        const pools = this.getPools(ids);
        const poolIds = pools.map(p => new PublicKey(p.pubkey));
        return this.loader.getParsedMultipleAccountsInfo(
            poolIds, WhirlpoolStruct
        );
    }

    getReserves(ids?: PublicKey[]): PublicKey[] {
        const pools = this.filterPoolsByIds(ids);
        return pools.flatMap(pool => [
            new PublicKey(pool.tokenVaultA),
            new PublicKey(pool.tokenVaultB),
        ]);
    }

    getLowerSqrtPriceFromTokenA(amount: BN, liquidity: BN, sqrtPriceX64: BN): BN {
        const numerator = liquidity.mul(sqrtPriceX64).shln(64);
        const denominator = liquidity.shln(64).add(amount.mul(sqrtPriceX64));
        return new BN(0);
    }

    getUpperSqrtPriceFromTokenA(amount: BN, liquidity: BN, sqrtPriceX64: BN): BN {
        const numerator = liquidity.mul(sqrtPriceX64).shln(64);
        const denominator = liquidity.shln(64).sub(amount.mul(sqrtPriceX64));
        return new BN(0);
    }

    getLowerSqrtPriceFromTokenB(amount: BN, liquidity: BN, sqrtPriceX64: BN): BN {
        return new BN(0);
    }

    getUpperSqrtPriceFromTokenB(amount: BN, liquidity: BN, sqrtPriceX64: BN): BN {
        return sqrtPriceX64.add(amount.shln(64).div(liquidity));
    }

    getPriceFn(pool: Whirlpool, context: ChainContext): SwapFn {
        return (amountAIn, amountBIn) => {
            return new BN(0);
        }
    }
}