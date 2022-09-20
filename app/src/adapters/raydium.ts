import {PublicKey} from "@solana/web3.js";
// @ts-ignore
import raydiumPools from "../artifacts/raydium_pools.json";
import _ from "lodash";
import { Account, SolanaLoader, TokenInfo } from "../loader";
import {RaydiumPoolV4, RaydiumPoolV4Struct, RaydiumPoolV5Struct} from "../states/raydium";
import {Adapter, ChainContext, SwapFn} from "./common";
import BN from "bn.js";


export class RaydiumAdapter extends Adapter<RaydiumPoolV4> {
    filterPoolsByIds(ids?: PublicKey[]) {
        return raydiumPools
            .filter(pool => {
                const poolId = new PublicKey(pool.pubkey);
                return ids ? _.some(ids, id => id.equals(poolId)) : true;
            });
    }

    forMint(mint: PublicKey, ids?: PublicKey[]) {
        const pools = this.filterPoolsByIds(ids);
        return pools.filter(pool => {
            const aMint = new PublicKey(pool.baseMint);
            const bMint = new PublicKey(pool.quoteMint);
            return mint.equals(aMint) || mint.equals(bMint);
        })
    }

    forMints(mints: PublicKey[], ids?: PublicKey[]) {
        const mintsSet = new Set(mints.map(m => m.toString()));
        const pools = this.filterPoolsByIds(ids);
        return pools.filter(pool => {
            return mintsSet.has(pool.baseMint) && mintsSet.has(pool.quoteMint);
        })
    }

    getPools(ids?: PublicKey[]) {
        return this.filterPoolsByIds(ids);
    }

    getTokens(pool: RaydiumPoolV4): { tokenA: TokenInfo; tokenB: TokenInfo } {
        const tokenA = this.loader.getTokenInfo(pool.baseMint);
        const tokenB = this.loader.getTokenInfo(pool.quoteMint);
        if (!tokenA || !tokenB) {
            throw new Error("Tokens are unsupported");
        }
        return {tokenA, tokenB};
    }

    async fetchPools(ids?: PublicKey[]): Promise<Account<RaydiumPoolV4>[]> {
        const pools = this.getPools(ids);
        // const poolIds = pools.map(p => new PublicKey(p.pubkey));
        const poolV4Ids = pools
            .filter(p => !p.accountType)
            .map(p => new PublicKey(p.pubkey));
        // const poolV5Ids = pools
        //     .filter(p => !!p.accountType)
        //     .map(p => new PublicKey(p.pubkey));
        return Promise.all([
            this.loader.getParsedMultipleAccountsInfo(
                poolV4Ids, RaydiumPoolV4Struct
            ),
            // this.loader.getParsedMultipleAccountsInfo(
            //     poolV5Ids, RaydiumPoolV5Struct
            // )
        ]).then(data => data.flat());
    }

    getReserves(ids?: PublicKey[]): PublicKey[] {
        const pools = this.filterPoolsByIds(ids);
        return pools.flatMap(pool => [
            new PublicKey(pool.baseVault),
            new PublicKey(pool.quoteVault),
        ]);
    }

    getPriceFn(pool: RaydiumPoolV4, context: ChainContext): SwapFn {
        return (amountAIn, amountBIn) => new BN(0);
    }
}