export default class Store {
  private parts: Uint8Array[] = [];

  constructor() {}

  public get length(): number {
    return this.parts.reduce((acc, part) => acc + part.length, 0);
  }

  public writeUint8(value: number) {
    const arr = new ArrayBuffer(1);
    new DataView(arr).setUint8(0, value);
    this.parts.push(new Uint8Array(arr));
  }

  public writeUint16(value: number) {
    const arr = new ArrayBuffer(2);
    new DataView(arr).setUint16(0, value);
    this.parts.push(new Uint8Array(arr));
  }

  public writeUint32(value: number) {
    const arr = new ArrayBuffer(4);
    new DataView(arr).setUint32(0, value);
    this.parts.push(new Uint8Array(arr));
  }

  public writeUintVlq(value: number) {
    const values: number[] = [];

    while (value >= 0x80) {
      values.push((value & 0x7f) | 0x80);
      value = value >> 7;
    }

    values.push(value & 0x7f);
    this.parts.push(new Uint8Array(values));
  }

  public writeUtf8(value: string) {
    const arr = new TextEncoder().encode(value);
    this.writeUintVlq(arr.length);
    this.parts.push(arr);
  }

  public writeUintVlqSeq(seq: number[]) {
    for (let i = 0; i < seq.length; i++) {
      this.writeUintVlq((seq[i] << 1) | (i === seq.length - 1 ? 0x00 : 0x01));
    }
  }

  public finish(): ArrayBuffer {
    const len = this.parts.reduce((acc, part) => acc + part.length, 0);
    const arr = new ArrayBuffer(len);
    const buf = new Uint8Array(arr);
    var offset = 0;

    this.parts.forEach((part) => {
      buf.set(part, offset);
      offset += part.length;
    });

    return arr;
  }
}
