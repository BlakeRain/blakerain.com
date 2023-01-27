import Load from "../encoding/load";
import Store from "../encoding/store";

export default class IndexDoc {
  public id: number;
  public page: boolean;
  public slug: string;
  public title: string;
  public published: string | null;
  public cover: string | null;
  public excerpt: string | null;

  constructor(id: number, slug: string, title: string) {
    this.id = id;
    this.page = false;
    this.slug = slug;
    this.title = title;
    this.published = null;
    this.cover = null;
    this.excerpt = null;
  }

  public get url(): string {
    return this.page ? `/${this.slug}` : `/blog/${this.slug}`;
  }

  public store(store: Store) {
    store.writeUintVlq(
      (this.id << 4) |
        (this.excerpt ? 0x08 : 0x00) |
        (this.cover ? 0x04 : 0x00) |
        (this.published ? 0x02 : 0x00) |
        (this.page ? 0x01 : 0x00)
    );
    store.writeUtf8(this.slug);
    store.writeUtf8(this.title);

    if (this.published) {
      store.writeUtf8(this.published);
    }

    if (this.cover) {
      store.writeUtf8(this.cover);
    }

    if (this.excerpt) {
      store.writeUtf8(this.excerpt);
    }
  }

  public static load(load: Load): IndexDoc {
    const tag = load.readUintVlq();
    const slug = load.readUtf8();
    const title = load.readUtf8();

    const doc = new IndexDoc(tag >> 4, slug, title);

    if ((tag & 0x01) === 0x01) {
      doc.page = true;
    }

    if ((tag & 0x02) == 0x02) {
      doc.published = load.readUtf8();
    }

    if ((tag & 0x04) == 0x04) {
      doc.cover = load.readUtf8();
    }

    if ((tag & 0x08) === 0x08) {
      doc.excerpt = load.readUtf8();
    }

    return doc;
  }
}
