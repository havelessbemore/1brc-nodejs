import { Message } from "./message";

export interface MergeRequest extends Message {
  type: "merge_request";
  a: number;
  b: number;
  // Shared memory
  counts: Uint32Array;
  maxes: Int16Array;
  mins: Int16Array;
  sums: Float64Array;
  tries: Int32Array[];
}
