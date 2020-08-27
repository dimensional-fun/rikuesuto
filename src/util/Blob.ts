import { Readable } from "stream";

const wm = new WeakMap<Blob, RawBlob>()

export class Blob {
  /**
   * The content of the blob consists of the concatenation of the values given in the parts array.
   * @param parts The parts to concat.
   * @param type The type of blob data.
   */
  public constructor(parts: BlobParts, type?: string) {
    let size = 0;

    const _parts: (Blob | Buffer)[] = parts.map(p => {
      let buf: Buffer | Blob;

      if (p instanceof Buffer) {
        buf = p
      } else if (ArrayBuffer.isView(p)) {
        buf = Buffer.from(p.buffer, p.byteOffset, p.byteLength);
      } else if (p instanceof ArrayBuffer) {
        buf = Buffer.from(p);
      } else if (p instanceof Blob) {
        buf = p;
      } else {
        buf = Buffer.from(typeof p === "string"
          ? p
          : String(p));
      }


      size += buf instanceof Blob ? buf.size : buf.length;
      return buf;
    });

    const _type = type === undefined ? "" : String(type).toLowerCase();
    wm.set(this, {
      type: /[^\u0020-\u007E]/.test(_type) ? "" : _type,
      size,
      parts: _parts
    });
  }

  /**
   * The size of this blob in bytes..
   */
  public get size(): number {
    return wm.get(this)!.size;
  }

  /**
   * The type property of this blob.
   */
  public get type(): string {
    return wm.get(this)!.type
  }

  /**
   * @private
   */
  private static async * _read(parts: (Blob | Buffer)[]) {
    for (const part of parts) {
      if ("stream" in part) yield * part.stream();
      else yield part;
    }
  }

  /**
   * Returns a new blob which contains data from a subset of this blob.
   * @param start
   * @param end
   * @param type
   */
  public slice(start = 0, end = this.size, type = ''): Blob {
    const { size } = this

    let relativeStart = start < 0 ? Math.max(size + start, 0) : Math.min(start, size);
    let relativeEnd = end < 0 ? Math.max(size + end, 0) : Math.min(end, size);

    const span = Math.max(relativeEnd - relativeStart, 0);
    const parts = wm.get(this)!.parts.values();
    const blobParts: (Blob | Buffer)[] = [];

    let added = 0;
    for (const part of parts) {
      const size = ArrayBuffer.isView(part)
        ? part.byteLength
        : part.size;

      if (relativeStart && size <= relativeStart) {
        relativeStart -= size;
        relativeEnd -= size;
      } else {
        const chunk = part.slice(relativeStart, Math.min(size, relativeEnd));

        blobParts.push(chunk);
        added += ArrayBuffer.isView(chunk)
          ? chunk.byteLength
          : chunk.size;
        relativeStart = 0;

        if (added >= span) break;
      }
    }

    const blob = new Blob([], type);
    Object.assign(wm.get(blob), { size: span, parts: blobParts });

    return blob;
  }

  /**
   * Returns a readable stream.
   */
  public stream(): Readable {
    const { parts } = wm.get(this)!
    const data = Blob._read(parts);
    return Readable.from(data);
  }

  /**
   * The contents of this blob as text.
   */
  public async text(): Promise<string> {
    const buf = await this.data();
    return Buffer.from(buf).toString();
  }

  /**
   * The contents of the blob as binary data contained in an array buffer.
   */
  public async data(): Promise<ArrayBuffer> {
    const data = new Uint8Array(this.size);

    let offset = 0;
    for await (const chunk of this.stream()) {
      data.set(chunk, offset);
      offset += chunk.length;
    }

    return data.buffer;
  }
}

type BlobParts = (ArrayBufferLike | ArrayBufferView | Blob | Buffer | string)[];

interface RawBlob {
  type: string;
  size: number;
  parts: (Blob | Buffer)[]
}
