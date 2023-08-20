export class BuilderSizes {
  documents: number = 0;
  locations: number = 0;
  tokens: number = 0;
  nodes: number = 0;
  maxDepth: number = 0;
  size: number = 0;

  public log() {
    const nf = Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
    console.log(
      `Index of ${nf.format(this.size / 1024.0)} Kib covering ${nf.format(
        this.documents
      )} document(s) containing ${nf.format(
        this.tokens
      )} token(s) over ${nf.format(
        this.locations
      )} location(s) formed a tree of ${nf.format(
        this.nodes
      )} node(s) (max. depth ${nf.format(this.maxDepth)})`
    );
  }
}

export class DecoderStats {
  public sizes = {
    documents: 0,
    locations: 0,
    nodes: 0,
    size: 0,
  };

  public timings = {
    load: 0,
    documents: 0,
    locations: 0,
    tree: 0,
  };

  constructor(size: number) {
    this.sizes.size = size;
  }

  public log() {
    const nf = Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
    const { documents, locations, nodes, size } = this.sizes;
    console.log(
      `Index of ${nf.format(size / 1024.0)} Kib covering ${nf.format(
        documents
      )} document(s) containing ${nf.format(
        locations
      )} location(s) and a tree of ${nf.format(
        nodes
      )} node(s) loaded in ${nf.format(this.timings.load)} ms`
    );
  }
}
