import { Request, RequestType } from "./request";

export interface ProcessRequest extends Request {
  type: RequestType.PROCESS;
  id: number;
  // I/O
  fd: number;
  fileSize: number;
  pageSize: number;
  chunkSize: number;
  // Shared memory
  counts: Uint32Array;
  maxes: Int16Array;
  mins: Int16Array;
  page: Uint32Array;
  sums: Float64Array;
}
