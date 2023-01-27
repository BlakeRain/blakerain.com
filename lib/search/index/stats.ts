const STAT_LOG_WIDTH = 8;

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
      `Documents : ${nf.format(this.documents).padStart(STAT_LOG_WIDTH)}`
    );
    console.log(
      `Locations : ${nf.format(this.locations).padStart(STAT_LOG_WIDTH)}`
    );
    console.log(
      `Tokens    : ${nf.format(this.tokens).padStart(STAT_LOG_WIDTH)}`
    );
    console.log(
      `Nodes     : ${nf.format(this.nodes).padStart(STAT_LOG_WIDTH)}`
    );
    console.log(
      `Max. Depth: ${nf.format(this.maxDepth).padStart(STAT_LOG_WIDTH)}`
    );

    console.log(
      `Index Size: ${nf
        .format(this.size / 1024.0)
        .padStart(STAT_LOG_WIDTH)} Kib`
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

    console.log(
      `Index Size : ${nf
        .format(this.sizes.size / 1024.0)
        .padStart(STAT_LOG_WIDTH)} Kib`
    );

    console.log(
      `Documents  : ${nf.format(this.sizes.documents).padStart(STAT_LOG_WIDTH)}`
    );
    console.log(
      `Locations  : ${nf.format(this.sizes.locations).padStart(STAT_LOG_WIDTH)}`
    );
    console.log(
      `Nodes      : ${nf.format(this.sizes.nodes).padStart(STAT_LOG_WIDTH)}`
    );
    console.log(
      `Decode Time: ${nf.format(this.timings.load).padStart(STAT_LOG_WIDTH)} ms`
    );
  }
}
