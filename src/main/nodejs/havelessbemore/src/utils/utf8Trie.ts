import { WriteStream } from "node:fs";

import {
  Trie,
  TrieNodeProto,
  TrieProto,
  TriePointerProto,
  TrieRedirectProto,
  UTF8,
} from "../constants/utf8";

export function add(
  trie: Int32Array,
  key: ArrayLike<number>,
  min: number,
  max: number,
): [Int32Array, number] {
  let index: number = TrieProto.ROOT_IDX;
  while (min < max) {
    index +=
      TrieNodeProto.CHILDREN_IDX +
      TriePointerProto.MEM * (key[min++] - UTF8.BYTE_MIN);
    let child = trie[index + TriePointerProto.IDX_IDX];
    if (child === Trie.NULL) {
      // Allocate node
      child = trie[TrieProto.SIZE_IDX];
      if (child + TrieNodeProto.MEM > trie.length) {
        trie = grow(trie, child + TrieNodeProto.MEM);
      }
      trie[TrieProto.SIZE_IDX] += TrieNodeProto.MEM;
      // Attach node
      trie[index + TriePointerProto.IDX_IDX] = child;
      // Initialize node
      trie[child + TrieNodeProto.ID_IDX] = trie[TrieProto.ID_IDX];
    }
    index = child;
  }

  return [trie, index];
}

export function get(
  tries: Int32Array[],
  trie: number,
  key: ArrayLike<number>,
  min: number,
  max: number,
): number | undefined {
  let node: number = TrieProto.ROOT_IDX;
  while (min < max) {
    const ptr =
      node +
      TrieNodeProto.CHILDREN_IDX +
      TriePointerProto.MEM * (key[min++] - UTF8.BYTE_MIN);
    let child = tries[trie][ptr + TriePointerProto.IDX_IDX];
    if (child === Trie.NULL) {
      return undefined;
    }
    // Resolve redirect, if any
    const childTrie = tries[trie][child + TrieNodeProto.ID_IDX];
    if (childTrie !== trie) {
      child = tries[trie][child + TrieRedirectProto.IDX_IDX];
      trie = childTrie;
    }
    node = child;
  }
  return node;
}

export function createTrie(id = 0, size = Trie.DEFAULT_SIZE): Int32Array {
  size = Math.max(TrieProto.MEM, size);
  const trie = new Int32Array(new SharedArrayBuffer(size << 2));
  trie[TrieProto.SIZE_IDX] = TrieProto.MEM;
  trie[TrieProto.ID_IDX] = id;
  return trie;
}

export function grow(trie: Int32Array, minSize = 0): Int32Array {
  const length = trie[TrieProto.SIZE_IDX];
  minSize = Math.max(minSize, Math.ceil(length * Trie.GROWTH_FACTOR));
  const next = new Int32Array(new SharedArrayBuffer(minSize << 2));
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
): number[] {
  const grown = new Set<number>();
  const queue: [number, number, number, number][] = [
    [at, TrieProto.ROOT_IDX, bt, TrieProto.ROOT_IDX],
  ];

  do {
    const Q = queue.length;
    for (let q = 0; q < Q; ++q) {
      // eslint-disable-next-line prefer-const
      let [at, ai, bt, bi] = queue[q];

      // If right value is not null
      const bvi = tries[bt][bi + TrieNodeProto.VALUE_IDX];
      if (bvi !== Trie.NULL) {
        // If left value is not null
        const avi = tries[at][ai + TrieNodeProto.VALUE_IDX];
        if (avi !== Trie.NULL) {
          mergeFn(avi, bvi);
        } else {
          tries[at][ai + TrieNodeProto.VALUE_IDX] = bvi;
        }
      }

      // Adjust to children property
      ai += TrieNodeProto.CHILDREN_IDX;
      bi += TrieNodeProto.CHILDREN_IDX;

      // Traverse right children
      const bn = bi + TrieNodeProto.CHILDREN_MEM;
      while (bi < bn) {
        // If right child is null
        let ri = tries[bt][bi + TriePointerProto.IDX_IDX];
        if (ri !== Trie.NULL) {
          // Resolve right child if redirect
          const rt = tries[bt][ri + TrieNodeProto.ID_IDX];
          if (bt !== rt) {
            ri = tries[bt][ri + TrieRedirectProto.IDX_IDX];
          }

          // If left child is null
          let li = tries[at][ai + TriePointerProto.IDX_IDX];
          if (li === Trie.NULL) {
            // Allocate redirect
            li = tries[at][TrieProto.SIZE_IDX];
            if (li + TrieRedirectProto.MEM > tries[at].length) {
              tries[at] = grow(tries[at], li + TrieRedirectProto.MEM);
              grown.add(at);
            }
            tries[at][TrieProto.SIZE_IDX] += TrieRedirectProto.MEM;
            // Attach redirect
            tries[at][ai + TriePointerProto.IDX_IDX] = li;
            // Initialize redirect
            tries[at][li + TrieRedirectProto.ID_IDX] = rt;
            tries[at][li + TrieRedirectProto.IDX_IDX] = ri;
          } else {
            // Resolve left child if redirect
            const lt = tries[at][li + TrieNodeProto.ID_IDX];
            if (at !== lt) {
              li = tries[at][li + TrieRedirectProto.IDX_IDX];
            }
            // Merge children
            queue.push([lt, li, rt, ri]);
          }
        }

        // Move to next children
        ai += TriePointerProto.MEM;
        bi += TriePointerProto.MEM;
      }
    }
    queue.splice(0, Q);
  } while (queue.length > 0);
  return Array.from(grown);
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
  const stack = new Array<[number, number, number]>(key.length + 1);
  stack[0] = [trieIndex, TrieProto.ROOT_IDX + TrieNodeProto.CHILDREN_IDX, 0];

  let top = 0;
  let tail = false;
  do {
    // eslint-disable-next-line prefer-const
    let [trieI, childPtr, numChild] = stack[top];

    // Check if end of children array
    if (numChild >= TrieNodeProto.CHILDREN_LEN) {
      --top;
      continue;
    }

    // Update stack top
    stack[top][1] += TriePointerProto.MEM;
    ++stack[top][2];

    // Check if child exists
    let childI = tries[trieI][childPtr + TriePointerProto.IDX_IDX];
    if (childI === Trie.NULL) {
      continue;
    }

    // Resolve redirect, if any
    const childTrieI = tries[trieI][childI + TrieNodeProto.ID_IDX];
    if (trieI !== childTrieI) {
      childI = tries[trieI][childI + TrieRedirectProto.IDX_IDX];
      trieI = childTrieI;
    }

    // Add the child to the stack
    key[top] = numChild + UTF8.BYTE_MIN;
    stack[++top] = [trieI, childI + TrieNodeProto.CHILDREN_IDX, 0];

    // Print value, if any
    const valueIndex = tries[trieI][childI + TrieNodeProto.VALUE_IDX];
    if (valueIndex !== Trie.NULL) {
      // Print separator if not first value
      if (tail) {
        stream.write(separator);
      }
      tail = true;
      callbackFn(stream, key, top, valueIndex);
    }
  } while (top >= 0);
}
