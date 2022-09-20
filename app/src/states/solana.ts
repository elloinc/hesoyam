import { PublicKey } from "@solana/web3.js";
import { BeetStruct, u32, u64, u8, publicKey } from "../beets";
import type { bignum, COption } from "../beets";

export type TokenAccount = {
    mint: PublicKey;
    owner: PublicKey;
    amount: bignum;
    delegateOption: bignum;
    delegate: COption<PublicKey>;
    state: number;
    isNativeOption: bignum;
    isNative: COption<bignum>;
    delegatedAmount: bignum;
    closeAuthorityOption: bignum;
    closeAuthority: COption<PublicKey>;
};

export const TokenAccountStruct = new BeetStruct<TokenAccount>(
    [
        ["mint", publicKey],
        ["owner", publicKey],
        ["amount", u64],
        ["delegateOption", u32],
        ["delegate", publicKey],
        ["state", u8],
        ["isNativeOption", u32],
        ["isNative", u64],
        ["delegatedAmount", u64],
        ["closeAuthorityOption", u32],
        ["closeAuthority", publicKey],
    ],
    (args) => args as TokenAccount,
    "TokenAccount"
);
