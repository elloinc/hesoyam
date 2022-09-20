import _ from "lodash";
import { Connection, PublicKey } from "@solana/web3.js";
import { OrcaAdapter } from "./adapters/orca";
import { RaydiumAdapter } from "./adapters/raydium";
import { SaberAdapter } from "./adapters/saber";
import { SolanaLoader } from "./loader";


const main = async () => {
  const connection = new Connection("https://ssc-dao.genesysgo.net/");
  const usdcMint = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
  const loader = new SolanaLoader(connection);

  const orca = new OrcaAdapter(loader);
  const raydium = new RaydiumAdapter(loader);
  const saber = new SaberAdapter(loader);
  // const whirlpool = new WhirlpoolAdapter(loader);

  console.time("bootstrap");
  const supportedMints = loader.getSupportedMints();
  const supportedRaydium = raydium.forMints(supportedMints).map(p => new PublicKey(p.pubkey));
  const supportedOrca = orca.forMints(supportedMints).map(p => new PublicKey(p.pubkey));
  const supportedSaber = saber.forMints(supportedMints).map(p => new PublicKey(p.pubkey));

  const usdOnlyOrca = orca.forMint(usdcMint, supportedOrca).map(p => new PublicKey(p.pubkey));
  const usdOnlySaber = saber.forMint(usdcMint, supportedSaber).map(p => new PublicKey(p.pubkey));
  console.timeEnd("bootstrap");

  console.time("search");
    // await orca.fetchRates(usdOnlyOrca);
    await saber.fetchRates(usdOnlySaber)

  // console.log(data);
  console.timeEnd("search");
};

(main)();