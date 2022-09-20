import {
  Connection, PublicKey, GetProgramAccountsConfig,
  GetProgramAccountsFilter, AccountInfo
} from "@solana/web3.js";
import { BeetStruct, bool } from "@metaplex-foundation/beet";
import tokens from "../artifacts/solana_tokenlist.json";
import LRUCache from "lru-cache";

export const MAX_ACCOUNT_BATCH_SIZE = 100;
export const TRANSACTION_DATA_SIZE = 1232;


export type Account<T = AccountInfo<Buffer>> = { pubkey: PublicKey } & T;
export type TokenInfo = {
  chainId: number,
  address: string,
  symbol: string,
  name: string,
  decimals: number,
  logoURI: string,
  tags: string[],
  extensions: Record<string, unknown>
}

export class SolanaLoader {
  private readonly tokenCache = new LRUCache({max: 500});

  constructor(
    private readonly connection: Connection,
  ) {
  }

  private async getAccountInfo(address: PublicKey, commitment: any): Promise<Account> {
    const data = await this.connection.getAccountInfo(
      address,
      commitment
    );
    if (!data) {
      throw new Error(`Account ${address} doesn't exist`);
    }
    return { pubkey: address, ...data };
  }

  private async getMultipleAccountsInfo(
    pubkeys: PublicKey[],
  ): Promise<Account[]> {
    // const start = performance.now();
    const accounts = await this.connection.getMultipleAccountsInfo(pubkeys);
    const data = accounts.map((account, i): Account => {
      if (!account) {
        throw new Error(`Account ${pubkeys[i]} doesn't exist`);
      }
      return { pubkey: pubkeys[i], ...account };
    });
    // console.log("multiple-unsafe",  performance.now() - start);
    return data;
  }

  getTokenInfo(
    mint: PublicKey
  ): TokenInfo | undefined {
    //@ts-ignore
    // const start = performance.now();
    if (!this.tokenCache.has(mint.toString())) {
      const tokenList: TokenInfo[] = tokens.tokens;
      const data = tokenList.find((token: TokenInfo) => {
        return mint.equals(new PublicKey(token.address));
      });
      this.tokenCache.set(mint.toString(), data);
    }
    // console.log("token-info", performance.now() - start);
    return this.tokenCache.get(mint.toString());
  }

  getSupportedMints(): PublicKey[] {
    //@ts-ignore
    const tokenList: TokenInfo[] = tokens.tokens;
    return tokenList.map((token: TokenInfo) => {
      return new PublicKey(token.address);
    });
  }

  async getProgramAccounts(
    programId: PublicKey,
    config: GetProgramAccountsConfig
  ): Promise<Account[]> {
    const response = await this.connection.getProgramAccounts(
      programId,
      config
    );
    return response.map((account) => ({
      pubkey: account.pubkey,
      ...account.account
    }));
  }

  async getParsedAccount<T>(
    address: PublicKey,
    beetStruct: BeetStruct<T, Partial<T>>
  ): Promise<Account<T>> {
    const accountInfo = await this.getAccountInfo(
      address,
      "confirmed"
    );
    if (!accountInfo) {
      throw new Error(`Account ${address} doesn't exists!`);
    }
    return {
      pubkey: address,
      ...this.deserialize<T>(accountInfo, beetStruct)
    };
  }

  async getParsedProgramAccounts<T>(
    programId: PublicKey,
    beetStruct: BeetStruct<T, Partial<T>>,
    filters?: GetProgramAccountsFilter[]
  ): Promise<Account<T>[]> {
    const config: GetProgramAccountsConfig = {
      filters,
      commitment: "confirmed",
      encoding: "base64"
    };
    const accounts = await this.getProgramAccounts(programId, config);
    return accounts.map(
      (account): Account<T> => ({
        pubkey: account.pubkey,
        ...this.deserialize<T>(account, beetStruct)
      })
    );
  }

  async getMultipleAccountsInfoSafe(pubkeys: PublicKey[]): Promise<Account[]> {
    if (pubkeys.length <= MAX_ACCOUNT_BATCH_SIZE) {
      return this.getMultipleAccountsInfo(pubkeys);
    }
    const accountsInfo = [];
    const publicKeysToFetch = [...pubkeys];
    while (publicKeysToFetch.length !== 0) {
      const currPublicKeysToFetch = publicKeysToFetch.splice(
        0,
        MAX_ACCOUNT_BATCH_SIZE
      );
      const accountsInfoRes = await this.getMultipleAccountsInfo(
        currPublicKeysToFetch
      );
      accountsInfo.push(...accountsInfoRes);
    }
    return accountsInfo;
  }

  deserialize<T>(info: Account, beetStruct: BeetStruct<T, Partial<T>>): T {
    return beetStruct.deserialize(info.data)[0];
  }

  async getParsedMultipleAccountsInfo<T>(
    publicKeys: PublicKey[],
    beetStruct: BeetStruct<T, Partial<T>>
  ) {
    const start = performance.now();
    const accountsInfo = await this.getMultipleAccountsInfoSafe(publicKeys);
    const data = accountsInfo.map((accountInfo, i) => ({
      pubkey: publicKeys[i],
      ...this.deserialize<T>(accountInfo, beetStruct)
    }));
    const end = performance.now() - start;
    console.log(`parsed-multiple [${publicKeys.length}]`, end);
    return data;
  }

  // async getAssociatedToken(mint: PublicKey, owner: PublicKey) {
  //     return PublicKey.findProgramAddress(
  //         [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
  //         ASSOCIATED_TOKEN_PROGRAM_ID
  //     );
  // }
  //
  // async getTokenAccount(tokenAccount: PublicKey) {
  //     const data = await this.connection.getAccountInfo(tokenAccount);
  //     if (!data) {
  //         throw new Error("Token account doesn't exists");
  //     }
  //     const [account] = TokenAccountStruct.deserialize(data!.data);
  //     return account;
  // }

  // async createTokenAccountIx(
  //     mint: PublicKey,
  //     owner: PublicKey,
  //     funder: PublicKey
  // ) {
  //     const [tokenAccount] = await this.getAssociatedToken(mint, owner);
  //
  //     return new TransactionInstruction({
  //         data: Buffer.alloc(0),
  //         keys: [
  //             { isWritable: true, pubkey: funder, isSigner: true },
  //             { isWritable: true, pubkey: tokenAccount, isSigner: false },
  //             { isWritable: false, pubkey: owner, isSigner: false },
  //             { isWritable: false, pubkey: mint, isSigner: false },
  //             { isWritable: false, pubkey: SYSTEM_PROGRAM_ID, isSigner: false },
  //             { isWritable: false, pubkey: TOKEN_PROGRAM_ID, isSigner: false },
  //             { isWritable: false, pubkey: SYSVAR_RENT_PUBKEY, isSigner: false },
  //         ],
  //         programId: ASSOCIATED_TOKEN_PROGRAM_ID,
  //     });
  // }

  // async getOrCreateTokenAccountIx(
  //     mint: PublicKey,
  //     owner: PublicKey,
  //     funder: PublicKey
  // ) {
  //     try {
  //         const [tokenAccount] = await this.getAssociatedToken(mint, owner);
  //         const account = await this.getTokenAccount(tokenAccount);
  //         return { account, instruction: undefined };
  //     } catch (e) {
  //         const instruction = await this.createTokenAccountIx(mint, owner, funder);
  //         return { account: undefined, instruction };
  //     }
  // }
}