import { Message } from "./message";

export interface ProcessRequest extends Message {
  type: "process_request";
  end: number;
  filePath: string;
  id: number;
  start: number;
  // Shared memory
  counts: Uint32Array;
  maxes: Int16Array;
  mins: Int16Array;
  sums: Float64Array;
}
