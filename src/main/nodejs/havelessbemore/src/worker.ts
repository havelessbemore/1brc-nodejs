import { open } from "fs/promises";

import type { MergeRequest } from "./types/mergeRequest";
import type { MergeResponse } from "./types/mergeResponse";
import type { ProcessRequest } from "./types/processRequest";
import type { ProcessResponse } from "./types/processResponse";

import { BRC } from "./constants/brc";
import { CharCode, Trie, TrieNodeProto } from "./constants/utf8";
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

  const file = await open(filePath, "r");
  const chunkSize = getHighWaterMark(end - start);
  const chunk = Buffer.allocUnsafe(chunkSize + BRC.MAX_ENTRY_LEN);

  // For each chunk
  let i = 0;
  let minI = 0;
  let leaf: number;
  while (start < end) {
    const res = await file.read(chunk, i, chunkSize, start);
    start += res.bytesRead;

    for (const N = i + res.bytesRead; i < N; ++i) {
      // If newline
      if (chunk[i] === CharCode.NEWLINE) {

        // Get semicolon
        let semI = i - 5;
        if (chunk[semI] !== CharCode.SEMICOLON) {
          semI += 1 | (1 + ~(chunk[semI - 1] === CharCode.SEMICOLON));
        }

        // Get temperature
        const tempV = parseDouble(chunk, semI + 1, i);

        // Add the station's name to the trie and get leaf index
        [trie, leaf] = add(trie, chunk, minI, semI);
        minI = i + 1;

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
    chunk.copyWithin(0, minI, i);
    i -= minI;
    minI = 0;
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

  await file.close();
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
