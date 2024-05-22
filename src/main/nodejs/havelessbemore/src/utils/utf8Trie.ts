import { WriteStream } from "node:fs";

import {
  MIN_TRIE_SIZE,
  TRIE_CHILD_MEM,
  TRIE_CHILD_IDX_IDX,
  TRIE_GROWTH_FACTOR,
  TRIE_HEADER_MEM,
  TRIE_ID_IDX,
  TRIE_NODE_CHILDREN_IDX,
  TRIE_NODE_ID_IDX,
  TRIE_NODE_VALUE_IDX_IDX,
  TRIE_NULL,
  TRIE_ROOT_IDX,
  TRIE_SIZE_IDX,
  TRIE_RED_MEM,
  TRIE_RED_VALUE_IDX_IDX,
  TRIE_RED_ID_IDX,
  TRIE_NODE_MEM,
  TRIE_NODE_CHILDREN_MEM,
  TRIE_NODE_CHILDREN_LEN,
} from "../constants/utf8Trie";
import { UTF8_B0_MIN } from "../constants/utf8";

export function add(
  trie: Int32Array,
  key: ArrayLike<number>,
  min: number,
  max: number,
): [Int32Array, number] {
  let index = TRIE_ROOT_IDX;
  while (min < max) {
    index +=
      TRIE_NODE_CHILDREN_IDX + TRIE_CHILD_MEM * (key[min++] - UTF8_B0_MIN);
    let child = trie[index + TRIE_CHILD_IDX_IDX];
    if (child === TRIE_NULL) {
      // Allocate new node
      child = trie[TRIE_SIZE_IDX];
      if (child + TRIE_NODE_MEM > trie.length) {
        trie = grow(trie, child + TRIE_NODE_MEM);
      }
      trie[TRIE_SIZE_IDX] += TRIE_NODE_MEM;
      // Attach and initialize node
      trie[index + TRIE_CHILD_IDX_IDX] = child;
      trie[child + TRIE_NODE_ID_IDX] = trie[TRIE_ID_IDX];
    }
    index = child;
  }

  return [trie, index];
}

export function createTrie(id = 0, size = MIN_TRIE_SIZE): Int32Array {
  const minSize = TRIE_HEADER_MEM;
  const trie = new Int32Array(Math.max(minSize, size));
  trie[TRIE_SIZE_IDX] = minSize;
  trie[TRIE_ID_IDX] = id;
  return trie;
}

export function grow(trie: Int32Array, minSize = 0): Int32Array {
  const length = trie[TRIE_SIZE_IDX];
  minSize = Math.max(minSize, Math.ceil(length * TRIE_GROWTH_FACTOR));
  const next = new Int32Array(minSize);
  for (let i = 0; i < length; ++i) {
    next[i] = trie[i];
  }
  return next;
}

export function mergeLeft(
  tries: Int32Array[],
  at: number,
  bt: number,
  mergeFn: (ai: number, bi: number) => void,
): void {
  const queue: [number, number, number, number][] = [
    [at, TRIE_ROOT_IDX, bt, TRIE_ROOT_IDX],
  ];

  do {
    const Q = queue.length;
    for (let q = 0; q < Q; ++q) {
      let [at, ai, bt, bi] = queue[q];

      // If right value is not null
      const bvi = tries[bt][bi + TRIE_NODE_VALUE_IDX_IDX];
      if (bvi !== TRIE_NULL) {
        // If left value is not null
        const avi = tries[at][ai + TRIE_NODE_VALUE_IDX_IDX];
        if (avi !== TRIE_NULL) {
          mergeFn(avi, bvi);
        } else {
          tries[at][ai + TRIE_NODE_VALUE_IDX_IDX] = bvi;
        }
      }

      // Adjust to children property
      ai += TRIE_NODE_CHILDREN_IDX;
      bi += TRIE_NODE_CHILDREN_IDX;

      // Traverse right children
      const bn = bi + TRIE_NODE_CHILDREN_MEM;
      while (bi < bn) {
        // If right child is null
        let ri = tries[bt][bi + TRIE_CHILD_IDX_IDX];
        if (ri === TRIE_NULL) {
          // Move to next children
          ai += TRIE_CHILD_MEM;
          bi += TRIE_CHILD_MEM;
          continue;
        }

        // Resolve right child if redirect
        const rt = tries[bt][ri + TRIE_NODE_ID_IDX];
        if (bt !== rt) {
          ri = tries[bt][ri + TRIE_RED_VALUE_IDX_IDX];
        }

        // If left child is null
        let li = tries[at][ai + TRIE_CHILD_IDX_IDX];
        if (li === TRIE_NULL) {
          // Allocate new redirect in left trie
          li = tries[at][TRIE_SIZE_IDX];
          if (li + TRIE_RED_MEM > tries[at].length) {
            tries[at] = grow(tries[at], li + TRIE_RED_MEM);
          }
          tries[at][TRIE_SIZE_IDX] += TRIE_RED_MEM;
          // Add new redirect
          tries[at][li + TRIE_RED_ID_IDX] = rt;
          tries[at][li + TRIE_RED_VALUE_IDX_IDX] = ri;
        } else {
          // Resolve left child if redirect
          const lt = tries[at][li + TRIE_NODE_ID_IDX];
          if (at !== lt) {
            ai = tries[at][li + TRIE_RED_VALUE_IDX_IDX];
          }
          // Merge children
          queue.push([lt, li, rt, ri]);
        }

        // Move to next children
        ai += TRIE_CHILD_MEM;
        bi += TRIE_CHILD_MEM;
      }
    }
    queue.splice(0, Q);
  } while (queue.length > 0);
}

export function print(
  tries: Int32Array[],
  key: Buffer,
  trieIndex: number,
  stream: WriteStream,
  separator = "",
  callbackFn: (
    stream: WriteStream,
    key: Buffer,
    keyLen: number,
    valueIndex: number,
  ) => void,
): void {
  const stack: [number, number, number][] = new Array(key.length + 1);
  stack[0] = [trieIndex, TRIE_ROOT_IDX + TRIE_NODE_CHILDREN_IDX, 0];

  let top = 0;
  let tail = false;
  do {
    let [trieI, childPtr, numChild] = stack[top];

    // Check if end of children array
    if (numChild >= TRIE_NODE_CHILDREN_LEN) {
      --top;
      continue;
    }

    // Update stack top
    stack[top][1] += TRIE_CHILD_MEM;
    ++stack[top][2];

    // Check if child exists
    let childI = tries[trieI][childPtr + TRIE_CHILD_IDX_IDX];
    if (childI === TRIE_NULL) {
      continue;
    }

    // Resolve redirect, if any
    const childTrieI = tries[trieI][childI + TRIE_NODE_ID_IDX];
    if (trieI !== childTrieI) {
      childI = tries[trieI][childI + TRIE_RED_VALUE_IDX_IDX];
      trieI = childTrieI;
    }

    // Add the child to the stack
    key[top] = numChild + UTF8_B0_MIN;
    stack[++top] = [trieI, childI + TRIE_NODE_CHILDREN_IDX, 0];

    // Print value, if any
    const valueIndex = tries[trieI][childI + TRIE_NODE_VALUE_IDX_IDX];
    if (valueIndex !== TRIE_NULL) {
      // Print separator if not first value
      if (tail) {
        stream.write(separator);
      }
      tail = true;
      callbackFn(stream, key, top, valueIndex);
    }
  } while (top >= 0);
}
