export default class Load {
  private buffer: ArrayBuffer;
  private offset: number;
  private view: DataView;

  constructor(buffer: ArrayBuffer) {
    this.buffer = buffer;
    this.offset = 0;
    this.view = new DataView(this.buffer);
  }

  public get length(): number {
    return this.buffer.byteLength;
  }

  public readUint8(): number {
    const value = this.view.getUint8(this.offset);
    this.offset += 1;
    return value;
  }

  public readUint16(): number {
    const value = this.view.getUint16(this.offset);
    this.offset += 2;
    return value;
  }

  public readUint32(): number {
    const value = this.view.getUint32(this.offset);
    this.offset += 4;
    return value;
  }

  public readUintVlq(): number {
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

  public readUintVlqSeq(): number[] {
    const seq: number[] = [];
    var value: number;

    do {
      value = this.readUintVlq();
      seq.push(value >> 1);
    } while ((value & 0x01) === 0x01);

    return seq;
  }

  public readUtf8(): string {
    const len = this.readUintVlq();
    const str = new TextDecoder("utf-8").decode(
      new DataView(this.buffer, this.offset, len)
    );
    this.offset += len;
    return str;
  }
}
