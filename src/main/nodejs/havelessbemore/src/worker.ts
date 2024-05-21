import { createReadStream } from "node:fs";

import type { WorkerRequest } from "./types/workerRequest";
import type { WorkerResponse } from "./types/workerResponse";

import { CHAR_SEMICOLON } from "./constants/utf8";
import { CHAR_NEWLINE } from "./constants/utf8";
import { CHAR_MINUS } from "./constants/utf8";
import { ENTRY_MAX_LEN, MAX_STATIONS } from "./constants/constraints";
import { CHAR_ZERO_11, CHAR_ZERO_111 } from "./constants/stream";
import {
  TRIE_NODE_VALUE_ID_IDX,
  TRIE_NODE_VALUE_IDX_IDX,
  TRIE_NULL,
} from "./constants/trie";
import { getHighWaterMark } from "./utils/stream";
import { add, createTrie } from "./utils/trie";

export async function run({
  end,
  filePath,
  id,
  start,
}: WorkerRequest): Promise<WorkerResponse> {
  const counts = new Uint32Array(MAX_STATIONS);
  const maxes = new Int16Array(MAX_STATIONS);
  const mins = new Int16Array(MAX_STATIONS);
  const sums = new Float64Array(MAX_STATIONS);

  // Check chunk size
  if (start >= end) {
    return { id, trie: createTrie(id, 0), counts, maxes, mins, sums };
  }

  // Initialize constants
  let trie = createTrie(id);
  let stations = 0;
  const buffer = Buffer.allocUnsafe(ENTRY_MAX_LEN);

  // Create the chunk stream
  const stream = createReadStream(filePath, {
    start,
    end: end - 1,
    highWaterMark: getHighWaterMark(end - start),
  });

  // For each chunk
  let bufI = 0;
  let tempI = 0;
  let leaf: number;
  for await (const chunk of stream) {
    // For each byte
    const N = chunk.length;
    for (let i = 0; i < N; ++i) {
      if (chunk[i] === CHAR_SEMICOLON) {
        // If semicolon
        tempI = bufI;
      } else if (chunk[i] !== CHAR_NEWLINE) {
        // If not newline
        buffer[bufI++] = chunk[i];
      } else {
        // Get temperature
        const tempV = parseDouble(buffer, tempI, bufI);
        bufI = 0;
        // Add the station's name to the trie and get leaf index
        [trie, leaf] = add(trie, buffer, 0, tempI);
        // If the station existed
        if (trie[leaf + TRIE_NODE_VALUE_ID_IDX] !== TRIE_NULL) {
          // Update the station's value
          updateStation(trie[leaf + TRIE_NODE_VALUE_IDX_IDX], tempV);
        } else {
          // Add the new station's value
          trie[leaf + TRIE_NODE_VALUE_ID_IDX] = id;
          trie[leaf + TRIE_NODE_VALUE_IDX_IDX] = stations;
          newStation(stations++, tempV);
        }
      }
    }
  }

  function newStation(index: number, temp: number): void {
    counts[index] = 1;
    maxes[index] = temp;
    mins[index] = temp;
    sums[index] = temp;
  }

  function updateStation(index: number, temp: number): void {
    ++counts[index];
    maxes[index] = maxes[index] >= temp ? maxes[index] : temp;
    mins[index] = mins[index] <= temp ? mins[index] : temp;
    sums[index] += temp;
  }

  return { id, trie, counts, maxes, mins, sums };
}

export function parseDouble(b: Buffer, min: number, max: number): number {
  if (b[min] === CHAR_MINUS) {
    return ++min + 4 > max
      ? -(10 * b[min] + b[min + 2] - CHAR_ZERO_11)
      : -(100 * b[min] + 10 * b[min + 1] + b[min + 3] - CHAR_ZERO_111);
  }
  return min + 4 > max
    ? 10 * b[min] + b[min + 2] - CHAR_ZERO_11
    : 100 * b[min] + 10 * b[min + 1] + b[min + 3] - CHAR_ZERO_111;
}