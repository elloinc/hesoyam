import { Account, SolanaLoader, TokenInfo } from "../loader";
import {PublicKey} from "@solana/web3.js";
import BN from "bn.js";
import { TokenAccountStruct } from "../states/solana";

export type PublicKeyString = string;
export type ChainContext = Map<PublicKeyString, Account<any>>;
export type SwapFn = (amountAIn: BN, amountBIn: BN) => BN;
export type Rate = {
    aToB: {in: BN, out: BN},
    bToA: {in: BN, out: BN}
};

export abstract class Adapter<T> {
    constructor(readonly loader: SolanaLoader) {}
    abstract filterPoolsByIds(ids?: PublicKey[]): any[];
    abstract forMint(mint: PublicKey, ids?: PublicKey[]): any[];
    abstract forMints(mints: PublicKey[], ids?: PublicKey[]): any[];
    abstract getPools(ids?: PublicKey[]): any[];
    abstract fetchPools(ids?: PublicKey[]): Promise<Account<T>[]>;
    abstract getReserves(ids?: PublicKey[]): PublicKey[];
    abstract getPriceFn(pool: T, context: ChainContext): SwapFn;
    abstract getTokens(pool: T): {tokenA: TokenInfo, tokenB: TokenInfo};
    protected getRate(pool: T, context: ChainContext, defaultAmount: BN = new BN(1)): Rate  {
        const priceFn = this.getPriceFn(pool, context);
        const tokens = this.getTokens(pool);
        const defaultValueA = defaultAmount.mul(new BN(10).pow(new BN(tokens.tokenA.decimals)));
        const defaultValueB = defaultAmount.mul(new BN(10).pow(new BN(tokens.tokenB.decimals)));
         return {
            aToB: {
                in: defaultValueA,
                out: priceFn(defaultValueA, new BN(0))
            },
            bToA: {
                in: defaultValueB,
                out: priceFn(new BN(0), defaultValueB)
            }
        }
    }
    async fetchRates(ids?: PublicKey[]): Promise<{rate: Rate, pool: T}[]> {
        const pools = await this.fetchPools(ids);
        const reserveData = await this.loader.getParsedMultipleAccountsInfo(
          this.getReserves(ids),
          TokenAccountStruct
        );
        const reserveMap = new Map(reserveData.map(r => [r.pubkey.toString(), r]));
        return pools.map(p => {
            return {pool: p, rate: this.getRate(p, reserveMap)}
        })
    }
}