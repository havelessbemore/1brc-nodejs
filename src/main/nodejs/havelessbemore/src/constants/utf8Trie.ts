/* eslint-disable @typescript-eslint/no-duplicate-enum-values */

import { UTF8 } from "./utf8";

export const enum Trie {
  /**
   * Represents a `null` trie element.
   */
  NULL = 0,

  /**
   * The default initial size of a trie.
   */
  DEFAULT_SIZE = 655360, // 2.5 MiB

  /**
   * The growth factor for resizing a trie.
   */
  GROWTH_FACTOR = 1.6180339887, // ~Phi
}

/**
 * A pointer can point to either a trie node or a trie redirect.
 *
 * They can be differentiated by the destination's ID value:
 *    - If the ID matches the trie's ID, then it's a trie node.
 *    - Otherwise, it's a trie redirect.
 */
export const enum TriePointerProto {
  // The memory location the pointer points to.
  IDX_IDX = 0,
  IDX_MEM = 1,

  // Total memory
  MEM = IDX_MEM,
}

/**
 * Points to a memory location in a different trie.
 */
export const enum TrieRedirectProto {
  // The different trie's ID.
  ID_IDX = 0,
  ID_MEM = 1,

  // The memory location of the trie node in the different trie.
  IDX_IDX = 1,
  IDX_MEM = 1,

  // Total memory
  MEM = ID_MEM + IDX_MEM,
}

export const enum TrieNodeProto {
  // The trie's ID
  ID_IDX = 0,
  ID_MEM = 1,

  // The node's value
  VALUE_IDX = 1,
  VALUE_MEM = 1,

  // The node's children pointers
  CHILDREN_IDX = 2,
  CHILDREN_LEN = UTF8.BYTE_SPAN,
  CHILDREN_MEM = TriePointerProto.MEM * CHILDREN_LEN,

  // Total memory
  MEM = ID_MEM + VALUE_MEM + CHILDREN_MEM,
}

export const enum TrieProto {
  // The memory location for the trie's size.
  SIZE_IDX = 0,
  SIZE_MEM = 1,

  // The memory location for the trie's root node.
  ROOT_IDX = 1,
  ROOT_MEM = TrieNodeProto.MEM,

  // The memory location for the trie's ID (i.e. the root node's trie ID).
  ID_IDX = ROOT_IDX + TrieNodeProto.ID_IDX,

  // Total memory
  MEM = SIZE_MEM + ROOT_MEM,
}
