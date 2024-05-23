import { createReadStream } from "node:fs";

import type { ProcessRequest } from "./types/processRequest";
import type { ProcessResponse } from "./types/processResponse";

import { CHAR_SEMICOLON } from "./constants/utf8";
import { CHAR_NEWLINE } from "./constants/utf8";
import { CHAR_MINUS } from "./constants/utf8";
import { ENTRY_MAX_LEN, MAX_STATIONS } from "./constants/constraints";
import { CHAR_ZERO_11, CHAR_ZERO_111 } from "./constants/stream";
import { TRIE_NODE_VALUE_IDX, TRIE_NULL } from "./constants/utf8Trie";
import { getHighWaterMark } from "./utils/stream";
import { add, createTrie, mergeLeft } from "./utils/utf8Trie";
import { MergeRequest } from "./types/mergeRequest";
import { MergeResponse } from "./types/mergeResponse";

export async function run({
  end,
  filePath,
  id,
  start,
  // Shared memory
  counts,
  maxes,
  mins,
  sums,
}: ProcessRequest): Promise<ProcessResponse> {
  // Check chunk size
  if (start >= end) {
    return { type: "process_response", id, trie: createTrie(id, 0) };
  }

  // Initialize constants
  let trie = createTrie(id);
  let stations = id * MAX_STATIONS + 1;
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
        if (trie[leaf + TRIE_NODE_VALUE_IDX] !== TRIE_NULL) {
          // Update the station's value
          updateStation(trie[leaf + TRIE_NODE_VALUE_IDX], tempV);
        } else {
          // Add the new station's value
          trie[leaf + TRIE_NODE_VALUE_IDX] = stations;
          newStation(stations++, tempV);
        }
      }
    }
  }

  function newStation(index: number, temp: number): void {
    mins[index << 3] = temp;
    maxes[index << 3] = temp;
    counts[index << 2] = 1;
    sums[index << 1] = temp;
  }

  function updateStation(index: number, temp: number): void {
    index <<= 3;
    mins[index] = mins[index] <= temp ? mins[index] : temp;
    maxes[index] = maxes[index] >= temp ? maxes[index] : temp;
    ++counts[index >> 1];
    sums[index >> 2] += temp;
  }

  return { type: "process_response", id, trie };
}

export function parseDouble(b: Buffer, min: number, max: number): number {
  if (b[min] === CHAR_MINUS) {
    ++min;
    return min + 4 > max
      ? -(10 * b[min] + b[min + 2] - CHAR_ZERO_11)
      : -(100 * b[min] + 10 * b[min + 1] + b[min + 3] - CHAR_ZERO_111);
  }
  return min + 4 > max
    ? 10 * b[min] + b[min + 2] - CHAR_ZERO_11
    : 100 * b[min] + 10 * b[min + 1] + b[min + 3] - CHAR_ZERO_111;
}

export function merge({
  a,
  b,
  tries,
  counts,
  maxes,
  mins,
  sums,
}: MergeRequest): MergeResponse {
  mergeLeft(tries, a, b, mergeStations);
  function mergeStations(ai: number, bi: number): void {
    ai <<= 3;
    bi <<= 3;
    mins[ai] = Math.min(mins[ai], mins[bi]);
    maxes[ai] = Math.max(maxes[ai], maxes[bi]);
    counts[ai >> 1] += counts[bi >> 1];
    sums[ai >> 2] += sums[bi >> 2];
  }
  return { type: "merge_response", id: a, trie: tries[a] };
}
