import { Message } from "./message";

export interface ProcessResponse extends Message {
  type: "process_response";
  id: number;
  trie: Int32Array;
}
