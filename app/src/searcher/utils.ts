import BN from "bn.js";

export const calculatePriceImpactValue = (marketPrice: BN, realPrice: BN) => {
    return marketPrice.sub(realPrice);
};

/**
 * Compute price impact percentage
 * @param marketPrice Market/Virtual price of swap
 * @param realPrice Estimated price of real swap
 */
export const calculatePriceImpact = (marketPrice: BN, realPrice: BN) => {
    const val = calculatePriceImpactValue(marketPrice, realPrice);
    return val.toNumber() / marketPrice.toNumber();
};

/**
 * Compute "amountIn * (1 - numerator/denominator)" formula in BN
 * @param amountOut
 * @param numerator
 * @param denominator
 */
export const withFraction = (amountOut: BN, numerator: BN, denominator: BN) => {
    const amount = amountOut.mul(numerator).div(denominator);
    return amountOut.sub(amount);
};
