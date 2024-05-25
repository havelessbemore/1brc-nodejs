import { Request } from "./request";

export interface MergeRequest extends Request {
  type: "merge";
  a: number;
  b: number;
  // Shared memory
  counts: Uint32Array;
  maxes: Int16Array;
  mins: Int16Array;
  sums: Float64Array;
  tries: Int32Array[];
}
