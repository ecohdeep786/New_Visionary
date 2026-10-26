// CONTENT-02 — the ML seam. Embeddings enter the pipeline only through this
// adapter; the pipeline records the adapter's model id and dimension verbatim
// and refuses vectors whose dimension does not match the descriptor, so a
// model/dimension change can never silently mix into stored chunks.
// No provider is attached in this slice: production adapters are added with
// their own qualification evidence (D-085 "permitted bounded ML").
import type { EmbeddingModelDescriptor } from './ingestion-types';
import { IngestionError } from './ingestion-errors';

export interface EmbeddingAdapter {
  readonly descriptor:EmbeddingModelDescriptor;
  embedBatch(texts:readonly string[]):Promise<readonly (readonly number[])[]>;
}

/**
 * Deterministic local embedder for development/test qualification only.
 * FNV-1a hashes each token into `dimension` buckets, L2-normalized. It is
 * stable across runs and machines (idempotent re-ingestion needs that), makes
 * no semantic promise, and never touches the network.
 */
export class LocalDeterministicEmbedder implements EmbeddingAdapter {
  readonly descriptor:EmbeddingModelDescriptor;
  constructor(dimension=64){
    if(!Number.isSafeInteger(dimension)||dimension<1||dimension>4096)throw new IngestionError('EMBEDDER_UNAVAILABLE','invalid local embedder dimension');
    this.descriptor={model:'local-deterministic-v1',dimension};
  }
  async embedBatch(texts:readonly string[]):Promise<readonly (readonly number[])[]>{
    return texts.map((t)=>this.embedOne(t));
  }
  private embedOne(text:string):readonly number[]{
    const vec=new Array<number>(this.descriptor.dimension).fill(0);
    const tokens=text.toLowerCase().match(/[a-z0-9\u00C0-\u024F\u0900-\u097F\u0980-\u09FF]+/g)??[];
    for(const token of tokens){
      let h=0x811c9dc5;
      for(let i=0;i<token.length;i++){h^=token.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0;}
      vec[h%this.descriptor.dimension]+=1;
    }
    const norm=Math.sqrt(vec.reduce((s,v)=>s+v*v,0))||1;
    return vec.map((v)=>v/norm);
  }
}
