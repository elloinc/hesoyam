import {PublicKey} from "@solana/web3.js";
// @ts-ignore
import orcaPools from "../artifacts/orca_pools.json";
import _ from "lodash";
import { Account, TokenInfo } from "../loader";
import {OrcaPool, OrcaPoolStruct} from "../states/orca";
import BN from "bn.js";
import {product} from "../curves";
import {Adapter, ChainContext} from "./common";

export class OrcaAdapter extends Adapter<OrcaPool> {
    filterPoolsByIds(ids?: PublicKey[]) {
        return orcaPools.filter(pool => {
            const poolId = new PublicKey(pool.pubkey);
            return ids ? _.some(ids, id => id.equals(poolId)) : true;
        });
    }

    forMint(mint: PublicKey, ids?: PublicKey[]) {
        const pools = this.filterPoolsByIds(ids);
        return pools.filter(pool => {
            const aMint = new PublicKey(pool.account.tokenAMint);
            const bMint = new PublicKey(pool.account.tokenBMint);
            return mint.equals(aMint) || mint.equals(bMint);
        })
    }

    forMints(mints: PublicKey[], ids?: PublicKey[]) {
        const mintsSet = new Set(mints.map(m => m.toString()));
        const pools = this.filterPoolsByIds(ids);
        return pools.filter(pool => {
            return mintsSet.has(pool.account.tokenAMint) && mintsSet.has(pool.account.tokenBMint);
        })
    }

    getPools(ids?: PublicKey[]) {
        return this.filterPoolsByIds(ids);
    }

    async fetchPools(ids?: PublicKey[]): Promise<Account<OrcaPool>[]> {
        const pools = this.getPools(ids);
        const poolIds = pools.map(p => new PublicKey(p.pubkey));
        return this.loader.getParsedMultipleAccountsInfo(
            poolIds, OrcaPoolStruct
        );
    }

    getReserves(ids?: PublicKey[]): PublicKey[] {
        const pools = this.filterPoolsByIds(ids);
        return pools.flatMap(pool => [
            new PublicKey(pool.account.tokenA),
            new PublicKey(pool.account.tokenB),
        ]);
    }

    getTokens(pool: OrcaPool): { tokenA: TokenInfo; tokenB: TokenInfo } {
        const tokenA = this.loader.getTokenInfo(pool.tokenAMint);
        const tokenB = this.loader.getTokenInfo(pool.tokenBMint);
        if (!tokenA || !tokenB) {
            throw new Error("Tokens are unsupported");
        }
        return {tokenA, tokenB};
    }

    getPriceFn(pool: OrcaPool, context: ChainContext) {
        const reserveA = context.get(pool.tokenA.toString());
        const reserveB = context.get(pool.tokenB.toString());
        if (!reserveA || !reserveB) {
            throw new Error("One of reserves doesn't exists");
        }
        return (amountAIn: BN, amountBIn: BN) => {
            if (amountAIn.gtn(0)) {
                return product.computeRealPrice(
                    amountAIn, reserveA.amount as BN, reserveB.amount as BN
                )
            } else if (amountBIn.gtn(0)) {
                return product.computeRealPrice(
                    amountBIn, reserveB.amount as BN, reserveA.amount as BN
                )
            } else {
                return new BN(0)
            }
        }
    }
}