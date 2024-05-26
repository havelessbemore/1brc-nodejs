import { Request, RequestType } from "./request";

export interface ProcessRequest extends Request {
  type: RequestType.PROCESS;
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
