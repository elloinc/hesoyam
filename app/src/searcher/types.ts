import BN from "bn.js";
import {PublicKey} from "@solana/web3.js";

export enum Protocols {
    Orca,
    Raydium,
    Saber,
    Serum,
    Spl
}

export enum CurveKind {
    Stable = "stable",
    Product = "product",
    Virtual = "virtual",
}

export enum FeeEvaluation {
    Pre = "pre",
    Post = "post",
}

export interface Fraction {
    numerator: BN;
    denominator: BN;
}

export interface SwapBuilderOpts {
    protocol: Protocols;
    kind: CurveKind;
    id: PublicKey;
    rawData: any;

    reserveIn?: BN;
    reserveOut?: BN;
    ampFactor?: BN;
    fees?: Fraction;
    slippage?: Fraction;
}

export interface Swap {
    amountIn: BN;
    amountOut: BN;
    realPrice: BN;
    marketPrice: BN;
    priceImpact: {
        value: BN;
        percentage: number;
    };
    feesAmount: BN;
}
