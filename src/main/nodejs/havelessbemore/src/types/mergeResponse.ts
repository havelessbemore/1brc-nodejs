import { Message } from "./message";

export interface MergeResponse extends Message {
  type: "merge_response";
  ids: number[];
  tries: Int32Array[];
}
