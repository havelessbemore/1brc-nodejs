import { Response } from "./response";

export interface ProcessResponse extends Response {
  id: number;
  trie: Int32Array;
}
