import {FixedSizeBeet, fixedSizeUint8Array} from "@metaplex-foundation/beet";
import {PublicKey} from "@solana/web3.js";

const uint8Array32 = fixedSizeUint8Array(32);

export const blob = (byteSize: number) => {
    return {
        write: function (buf: Buffer, offset: number) {
            const bytesArrayBuf = Buffer.allocUnsafe(this.byteSize);
            bytesArrayBuf.copy(buf, offset, 0, this.byteSize);
        },
        read: function (buf: Buffer, offset: number) {
            return buf.slice(offset, offset + this.byteSize);
        },
        byteSize: byteSize,
        description: 'blob',
    }
};
// export const blob = fixedSizeBuffer;


export const publicKey: FixedSizeBeet<PublicKey> = {
    write: function (buf: Buffer, offset: number, value: PublicKey): void {
        const arr = value.toBytes();
        uint8Array32.write(buf, offset, arr);
    },
    read: function (buf: Buffer, offset: number): PublicKey {
        const bytes = uint8Array32.read(buf, offset);
        return new PublicKey(bytes);
    },

    byteSize: uint8Array32.byteSize,
    description: 'PublicKey',
}

export * from "@metaplex-foundation/beet";
