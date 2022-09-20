import BN from "bn.js";

/**
 * Compute the price you will actually pay when performing a swap on a decentralized exchange.
 * @param amountIn Amount to swap
 * @param reserveIn Swap balance of reserve FROM
 * @param reserveOut Swap balance of reserve TO
 */
const computeRealPrice = (amountIn: BN, reserveIn: BN, reserveOut: BN) => {
  const k = reserveOut.mul(reserveIn);
  const newReserve = reserveIn.add(amountIn);
  return reserveOut.sub(k.div(newReserve));
};

/**
 * Compute current market price
 * @param amountIn Amount to swap
 * @param reserveIn Swap balance of reserve FROM
 * @param reserveOut Swap balance of reserve TO
 */
const computeMarketPrice = (amountIn: BN, reserveIn: BN, reserveOut: BN) => {
  return amountIn.mul(reserveIn.div(reserveOut));
};

export const product = {
  computeRealPrice,
  computeMarketPrice,
};
