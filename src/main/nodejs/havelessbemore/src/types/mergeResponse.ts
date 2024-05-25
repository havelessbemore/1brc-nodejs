import { Response } from "./response";

export interface MergeResponse extends Response {
  ids: number[];
  tries: Int32Array[];
}
