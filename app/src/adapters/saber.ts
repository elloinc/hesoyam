import {PublicKey} from "@solana/web3.js";
// @ts-ignore
import saberPools from "../artifacts/saber_pools.json";
import _ from "lodash";
import {StableSwap, StableSwapStruct} from "../states/saber";
import { Account, SolanaLoader, TokenInfo } from "../loader";
import {Adapter, ChainContext, SwapFn} from "./common";
import BN from "bn.js";
import {product, stable} from "../curves";


export class SaberAdapter extends Adapter<StableSwap> {
    filterPoolsByIds(ids?: PublicKey[]) {
        return saberPools.filter(pool => {
            const poolId = new PublicKey(pool.pubkey);
            return ids ? _.some(ids, id => id.equals(poolId)) : true;
        });
    }

    forMint(mint: PublicKey, ids?: PublicKey[]) {
        const pools = this.filterPoolsByIds(ids);
        return pools.filter(pool => {
            const aMint = new PublicKey(pool.tokenAMint);
            const bMint = new PublicKey(pool.tokenBMint);
            return mint.equals(aMint) || mint.equals(bMint);
        })
    }

    forMints(mints: PublicKey[], ids?: PublicKey[]) {
        const mintsSet = new Set(mints.map(m => m.toString()));
        const pools = this.filterPoolsByIds(ids);
        return pools.filter(pool => {
            return mintsSet.has(pool.tokenAMint) && mintsSet.has(pool.tokenBMint);
        })
    }

    getPools(ids?: PublicKey[]) {
        return this.filterPoolsByIds(ids);
    }

    getTokens(pool: StableSwap): { tokenA: TokenInfo; tokenB: TokenInfo } {
        const tokenA = this.loader.getTokenInfo(pool.tokenAMint);
        const tokenB = this.loader.getTokenInfo(pool.tokenBMint);
        if (!tokenA || !tokenB) {
            console.log(pool.tokenAMint, pool.tokenBMint.toString());
            throw new Error("Tokens are unsupported");
        }
        return {tokenA, tokenB};
    }

    async fetchPools(ids?: PublicKey[]): Promise<Account<StableSwap>[]> {
        const pools = this.getPools(ids);
        const poolIds = pools.map(p => new PublicKey(p.pubkey));
        return this.loader.getParsedMultipleAccountsInfo(
            poolIds, StableSwapStruct
        );
    }

    getReserves(ids?: PublicKey[]): PublicKey[] {
        const pools = this.filterPoolsByIds(ids);
        return pools.flatMap(pool => [
            new PublicKey(pool.tokenA),
            new PublicKey(pool.tokenB),
        ]);
    }

    getPriceFn(pool: StableSwap, context: ChainContext): SwapFn {
        const reserveA = context.get(pool.tokenA.toString());
        const reserveB = context.get(pool.tokenB.toString());
        if (!reserveA || !reserveB) {
            throw new Error("One of reserves doesn't exists");
        }
        return (amountAIn: BN, amountBIn: BN) => {
            if (amountAIn.gtn(0)) {
                return stable.computeRealPrice(
                    amountAIn,
                    reserveA.amount as BN,
                    reserveB.amount as BN,
                    pool.targetAmpFactor as BN,
                );
            } else if (amountBIn.gtn(0)) {
                return stable.computeRealPrice(
                    amountBIn,
                    reserveB.amount as BN,
                    reserveA.amount as BN,
                    pool.targetAmpFactor as BN,
                );
            } else {
                return new BN(0)
            }
        }
    }
}