import { createReadStream } from "node:fs";

import type { MergeRequest } from "./types/mergeRequest";
import type { MergeResponse } from "./types/mergeResponse";
import type { ProcessRequest } from "./types/processRequest";
import type { ProcessResponse } from "./types/processResponse";

import { BRC } from "./constants/brc";
import { CharCode } from "./constants/utf8";
import { Trie, TrieNodeProto } from "./constants/utf8Trie";
import { parseDouble } from "./utils/parse";
import { getHighWaterMark } from "./utils/stream";
import { add, createTrie, mergeLeft } from "./utils/utf8Trie";

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
    return { id, trie: createTrie(id, 0) };
  }

  // Initialize constants
  let trie = createTrie(id);
  let stations = id * BRC.MAX_STATIONS + 1;
  const buffer = Buffer.allocUnsafe(BRC.MAX_ENTRY_LEN);

  // Create the chunk stream
  const stream = createReadStream(filePath, {
    start,
    end: end - 1,
    highWaterMark: getHighWaterMark(end - start),
  });

  // For each chunk
  let bufI = 0;
  let leaf: number;
  for await (const chunk of stream) {
    // For each byte
    const N = chunk.length;
    for (let i = 0; i < N; ++i) {
      // If not newline
      if (chunk[i] !== CharCode.NEWLINE) {
        buffer[bufI++] = chunk[i];
        continue;
      }

      // Get semicolon
      let semI = bufI - 4;
      if (buffer[semI - 2] === CharCode.SEMICOLON) {
        semI -= 2;
      } else if (buffer[semI - 1] === CharCode.SEMICOLON) {
        semI -= 1;
      }

      // Get temperature
      const tempV = parseDouble(buffer, semI + 1, bufI);
      bufI = 0;

      // Add the station's name to the trie and get leaf index
      [trie, leaf] = add(trie, buffer, 0, semI);

      // If the station existed
      if (trie[leaf + TrieNodeProto.VALUE_IDX] !== Trie.NULL) {
        // Update the station's value
        updateStation(trie[leaf + TrieNodeProto.VALUE_IDX], tempV);
      } else {
        // Add the new station's value
        trie[leaf + TrieNodeProto.VALUE_IDX] = stations;
        newStation(stations++, tempV);
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

  return { id, trie };
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
  function mergeStations(ai: number, bi: number): void {
    ai <<= 3;
    bi <<= 3;
    mins[ai] = Math.min(mins[ai], mins[bi]);
    maxes[ai] = Math.max(maxes[ai], maxes[bi]);
    counts[ai >> 1] += counts[bi >> 1];
    sums[ai >> 2] += sums[bi >> 2];
  }
  const ids = mergeLeft(tries, a, b, mergeStations);
  return { ids, tries };
}
