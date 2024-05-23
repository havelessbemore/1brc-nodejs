import { Message } from "./message";

export interface MergeResponse extends Message {
  type: "merge_response";
  id: number;
  trie: Int32Array;
}
