import {
    CurveKind,
    FeeEvaluation,
    Fraction, Protocols,
    Swap,
    SwapBuilderOpts,
} from "./types";
import BN from "bn.js";
import { ZERO } from "../curves/stable";
import { product, stable } from "../curves";
import {
    calculatePriceImpact,
    calculatePriceImpactValue,
    withFraction,
} from "./utils";
import {PublicKey} from "@solana/web3.js";

export class SwapBuilder {
    id: PublicKey;

    protocol: Protocols;

    rawData: any;

    kind: CurveKind;

    reserveIn: BN;

    reserveOut: BN;

    ampFactor?: BN;

    fees?: Fraction;

    slippage?: Fraction;

    constructor(opts: SwapBuilderOpts) {
        this.id = opts.id;
        this.protocol = opts.protocol;
        this.rawData = opts.rawData;
        this.kind = opts.kind;
        this.reserveIn = opts.reserveIn || ZERO;
        this.reserveOut = opts.reserveOut || ZERO;
        this.ampFactor = opts.ampFactor;
        this.fees = opts.fees;
        this.slippage = opts.slippage;
    }

    withReserves(reserveIn: BN, reserveOut: BN) {
        this.reserveIn = reserveIn;
        this.reserveOut = reserveOut;
        return this;
    }

    withFees(fee: Fraction) {
        this.fees = fee;
        return this;
    }

    withSlippage(slippage: Fraction) {
        this.slippage = slippage;
        return this;
    }

    withAmpFactor(amp: BN) {
        this.ampFactor = amp;
        return this;
    }

    calculateRealPrice(amountIn: BN) {
        if (this.reserveIn.eq(ZERO) || this.reserveOut.eq(ZERO)) {
            return ZERO;
        }
        switch (this.kind) {
            case CurveKind.Product: {
                return product.computeRealPrice(
                    amountIn,
                    this.reserveIn,
                    this.reserveOut
                );
            }
            case CurveKind.Stable: {
                if (!this.ampFactor) {
                    throw new Error(
                        "Expected ampFactor for stable swap, use .withAmpFactor()"
                    );
                }
                return stable.computeRealPrice(
                    amountIn,
                    this.reserveIn,
                    this.reserveOut,
                    this.ampFactor
                );
            }
            default:
                throw new Error(`Unsupported curve kind: ${this.kind}`);
        }
    }

    calculateMarketPrice(amountIn: BN) {
        if (this.reserveIn.eq(ZERO) || this.reserveOut.eq(ZERO)) {
            return ZERO;
        }
        switch (this.kind) {
            case CurveKind.Product: {
                return product.computeMarketPrice(
                    amountIn,
                    this.reserveIn,
                    this.reserveOut
                );
            }
            case CurveKind.Stable: {
                if (!this.ampFactor) {
                    throw new Error(
                        "Expected ampFactor for stable swap, use .withAmpFactor()"
                    );
                }
                return stable.computeMarketPrice(
                    amountIn,
                    this.reserveIn,
                    this.reserveOut,
                    this.ampFactor
                );
            }
            default:
                throw new Error(`Unsupported curve kind: ${this.kind}`);
        }
    }

    estimateSwapAmount(amountIn: BN, feeEval: FeeEvaluation = FeeEvaluation.Pre) {
        if (this.fees && feeEval === FeeEvaluation.Pre) {
            amountIn = withFraction(
                amountIn,
                this.fees.numerator,
                this.fees.denominator
            );
        }
        let amountOut = this.calculateRealPrice(amountIn);
        if (this.fees && feeEval === FeeEvaluation.Post) {
            amountOut = withFraction(
                amountOut,
                this.fees.numerator,
                this.fees.denominator
            );
        }
        if (this.slippage) {
            amountOut = withFraction(
                amountOut,
                this.slippage.numerator,
                this.slippage.denominator
            );
        }
        return amountOut;
    }

    estimateSwap(amountIn: BN, feeEval: FeeEvaluation = FeeEvaluation.Pre): Swap {
        const realPrice = this.calculateRealPrice(amountIn);
        const marketPrice = this.calculateMarketPrice(amountIn);

        const amountOut = this.estimateSwapAmount(amountIn, feeEval);
        const feesAmount = realPrice.sub(amountOut);
        return {
            amountIn,
            amountOut,
            realPrice,
            marketPrice,
            priceImpact: {
                value: calculatePriceImpactValue(marketPrice, realPrice),
                percentage: calculatePriceImpact(marketPrice, realPrice),
            },
            feesAmount,
        };
    }
}
