import BN from "bn.js";

export const ZERO = new BN(0);
export const ONE = new BN(1);
export const N_COINS = new BN(2); // n

// maximum iterations of newton's method approximation
export const MAX_ITERS = 20;

export const abs = (a: BN): BN => {
  if (a.gt(ZERO)) {
    return a;
  }
  return a.neg();
};

/**
 * Compute the StableSwap invariant
 * @param ampFactor Amplification coefficient (A)
 * @param reserveA Swap balance of token A
 * @param reserveB Swap balance of token B
 * Reference: https://github.com/curvefi/curve-contract/blob/7116b4a261580813ef057887c5009e22473ddb7d/tests/simulation.py#L31
 */
export const computeD = (ampFactor: BN, reserveA: BN, reserveB: BN): BN => {
  const Ann = ampFactor.mul(N_COINS); // A*n^n
  const S = reserveA.add(reserveB); // sum(x_i), a.k.a S
  if (S.eq(ZERO)) {
    return ZERO;
  }

  let dPrev = ZERO;
  let d = S;

  for (let i = 0; abs(d.sub(dPrev)).gt(ONE) && i < MAX_ITERS; i++) {
    dPrev = d;
    let dP = d;
    dP = dP.mul(d).div(reserveA.mul(N_COINS));
    dP = dP.mul(d).div(reserveB.mul(N_COINS));
    const dNumerator = d.mul(Ann.mul(S).add(dP.mul(N_COINS)));
    const dDenominator = d.mul(Ann.sub(ONE)).add(dP.mul(N_COINS.add(ONE)));
    d = dNumerator.div(dDenominator);
  }
  return d;
};

/**
 * Compute Y amount in respect to X on the StableSwap curve
 * @param amountIn The quantity of underlying asset
 * @param d StableSwap invariant
 * @param ampFactor Amplification coefficient (A)
 * Reference: https://github.com/curvefi/curve-contract/blob/7116b4a261580813ef057887c5009e22473ddb7d/tests/simulation.py#L55
 */
export const computeY = (amountIn: BN, d: BN, ampFactor: BN): BN => {
  const Ann = ampFactor.mul(N_COINS); // A*n^n

  // sum' = prod' = amountIn
  const b = amountIn.add(d.div(Ann)).sub(d);
  const cNumerator = d.pow(N_COINS.add(ONE));
  const cDenominator = N_COINS.mul(N_COINS).mul(amountIn).mul(Ann);
  const c = cNumerator.div(cDenominator);
  let yPrev = ZERO;
  let y = d;
  for (let i = 0; i < MAX_ITERS && abs(y.sub(yPrev)).gt(ONE); i++) {
    yPrev = y;
    y = y.mul(y).add(c).div(new BN(2).mul(y).add(b));
  }

  return y;
};

const computeMarketPrice = (
  lpTotalSupply: BN,
  reserveIn: BN,
  reserveOut: BN,
  ampFactor: BN
) => {
  if (lpTotalSupply.eq(ZERO)) {
    return ZERO;
  }
  return computeD(ampFactor, reserveIn, reserveOut).div(lpTotalSupply);
};

const computeRealPrice = (
  amountIn: BN,
  reserveIn: BN,
  reserveOut: BN,
  ampFactor: BN
) => {
  const d = computeD(ampFactor, reserveIn, reserveOut);
  const y = computeY(reserveIn.add(amountIn), d, ampFactor);
  return reserveOut.sub(y);
};

export const stable = {
  computeMarketPrice,
  computeRealPrice,
};
