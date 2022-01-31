export class Decoder {
  public buffer: ArrayBuffer;
  public offset: number;
  public view: DataView;

  constructor(buffer: ArrayBuffer) {
    this.buffer = buffer;
    this.offset = 0;
    this.view = new DataView(this.buffer);
  }

  public decode32(): number {
    const value = this.view.getUint32(this.offset);
    this.offset += 4;
    return value;
  }

  public decode7(): number {
    var byte = 0,
      value = 0,
      shift = 0;

    do {
      byte = this.view.getUint8(this.offset++);
      value |= (byte & 0x7f) << shift;
      shift += 7;
    } while (byte >= 0x80);

    return value;
  }

  public decodeUtf8(): string {
    const len = this.decode7();
    const str = new TextDecoder("utf-8").decode(
      new DataView(this.buffer, this.offset, len)
    );
    this.offset += len;
    return str;
  }
}

export class Encoder {
  private parts: Uint8Array[] = [];

  constructor() {}

  public encode32(value: number) {
    const arr = new ArrayBuffer(4);
    new DataView(arr).setUint32(0, value);
    this.parts.push(new Uint8Array(arr));
  }

  public encode7(value: number) {
    const values: number[] = [];

    while (value > 0x80) {
      values.push((value & 0x7f) | 0x80);
      value = value >> 7;
    }

    values.push(value & 0x7f);
    this.parts.push(new Uint8Array(values));
  }

  public encodeUtf8(value: string) {
    const encoded = new TextEncoder().encode(value);
    this.encode7(encoded.length);
    this.parts.push(encoded);
  }

  public finish(): ArrayBuffer {
    const length = this.parts.reduce((total, part) => total + part.length, 0);
    const buffer = new ArrayBuffer(length);
    const buf = new Uint8Array(buffer);
    var offset = 0;

    this.parts.forEach((part) => {
      buf.set(part, offset);
      offset += part.length;
    });

    return buffer;
  }
}
