import { readSync } from "fs";

import type { MergeRequest } from "./types/mergeRequest";
import type { MergeResponse } from "./types/mergeResponse";
import type { ProcessRequest } from "./types/processRequest";
import type { ProcessResponse } from "./types/processResponse";

import { BRC } from "./constants/brc";
import { CharCode, Trie, TrieNodeProto } from "./constants/utf8";
import { parseDouble } from "./utils/parse";
import { add, createTrie, mergeLeft } from "./utils/utf8Trie";
import { lastIndexOf } from "./utils/stream";

export function run({
  id,
  // I/O
  fd,
  fileSize,
  pageSize,
  chunkSize,
  // Shared memory
  counts,
  maxes,
  mins,
  page,
  sums,
}: ProcessRequest): ProcessResponse {
  const newStation = (index: number, temp: number): void => {
    mins[index << 3] = temp;
    maxes[index << 3] = temp;
    counts[index << 2] = 1;
    sums[index << 1] = temp;
  };

  const updateStation = (index: number, temp: number): void => {
    index <<= 3;
    mins[index] = mins[index] <= temp ? mins[index] : temp;
    maxes[index] = maxes[index] >= temp ? maxes[index] : temp;
    ++counts[index >> 1];
    sums[index >> 2] += temp;
  };

  // Initialize constants
  const chunk = Buffer.allocUnsafe(chunkSize + BRC.MAX_ENTRY_LEN);
  let stations = id * BRC.MAX_STATIONS;
  let trie = createTrie(id);

  // For each page
  while (true) {

    // Get page start
    let start = pageSize * Atomics.add(page, 0, 1);
    if (start >= fileSize) {
      break;
    }

    // Get page end
    const end = Math.min(fileSize, start + pageSize);

    // Align start with entry
    if (start > 0) {
      start -= BRC.MAX_ENTRY_LEN;
      readSync(fd, chunk, 0, BRC.MAX_ENTRY_LEN, start);
      start += 1 + lastIndexOf(chunk, CharCode.NEWLINE, BRC.MAX_ENTRY_LEN);
    }
    
    // Initialize variables
    let bufI = 0;
    let leaf = 0;
    let minI = 0;

    // For each chunk
    while (start < end) {
      // Read the chunk into memory
      const bytesRead = Math.min(chunkSize, end - start);
      readSync(fd, chunk, bufI, bytesRead, start);
      start += bytesRead;

      // For each byte
      for (const N = bufI + bytesRead; bufI < N; ++bufI) {
        // If not newline
        if (chunk[bufI] !== CharCode.NEWLINE) {
          continue;
        }

        // Get semicolon
        let semI = bufI - 5;
        if (chunk[semI] !== CharCode.SEMICOLON) {
          semI += 1 | (1 + ~(chunk[semI - 1] === CharCode.SEMICOLON));
        }

        // Add the station's name to the trie and get leaf
        [trie, leaf] = add(trie, chunk, minI, semI);

        // Update next entry's min
        minI = bufI + 1;

        // Get temperature
        const temp = parseDouble(chunk, semI + 1, bufI);

        // If the station existed
        leaf += TrieNodeProto.VALUE_IDX;
        if (trie[leaf] !== Trie.NULL) {
          // Update the station's value
          updateStation(trie[leaf], temp);
        } else {
          // Add the new station's value
          trie[leaf] = ++stations;
          newStation(stations, temp);
        }
      }

      // Prepend any incomplete entry to the next chunk
      chunk.copyWithin(0, minI, bufI);

      // Update indices for the next chunk
      bufI -= minI;
      minI = 0;
    }
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
  const ids = mergeLeft(tries, a, b, (ai: number, bi: number): void => {
    ai <<= 3;
    bi <<= 3;
    mins[ai] = mins[ai] <= mins[bi] ? mins[ai] : mins[bi];
    maxes[ai] = maxes[ai] >= maxes[bi] ? maxes[ai] : maxes[bi];
    counts[ai >> 1] += counts[bi >> 1];
    sums[ai >> 2] += sums[bi >> 2];
  });
  return { ids, tries };
}
