import decode from "../encoding/structure/decoder";
import encode from "../encoding/structure/encoder";
import Load from "../encoding/load";
import Store from "../encoding/store";
import { StructNode } from "./structure";

export default class IndexDoc {
  public id: number;
  public page: boolean;
  public slug: string;
  public title: string;
  public excerpt: string | null;
  public structure: StructNode[];

  constructor(id: number, slug: string, title: string) {
    this.id = id;
    this.page = false;
    this.slug = slug;
    this.title = title;
    this.excerpt = null;
    this.structure = [];
  }

  public get url(): string {
    return this.page ? `/${this.slug}` : `/blog/${this.slug}`;
  }

  public store(store: Store) {
    store.writeUintVlq(
      (this.id << 2) | (this.excerpt ? 0x02 : 0x00) | (this.page ? 0x01 : 0x00)
    );
    store.writeUtf8(this.slug);
    store.writeUtf8(this.title);

    if (this.excerpt) {
      store.writeUtf8(this.excerpt);
    }

    encode(store, this.structure);
  }

  public static load(load: Load): IndexDoc {
    const tag = load.readUintVlq();
    const slug = load.readUtf8();
    const title = load.readUtf8();

    const doc = new IndexDoc(tag >> 2, slug, title);

    if ((tag & 0x01) === 0x01) {
      doc.page = true;
    }

    if ((tag & 0x02) === 0x02) {
      doc.excerpt = load.readUtf8();
    }

    doc.structure = decode(load);
    return doc;
  }
}
