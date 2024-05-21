export interface WorkerResponse {
  counts: Uint32Array;
  id: number;
  maxes: Int16Array;
  mins: Int16Array;
  sums: Float64Array;
  trie: Int32Array;
}
