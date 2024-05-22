// Trie static properties

import { UTF8_B0_2B_LEN } from "./utf8";

/**
 * Represents null / undefined.
 */
export const TRIE_NULL = 0;

/**
 * The minimum size a trie.
 */
export const MIN_TRIE_SIZE = 524288; // 2 MiB

/**
 * The default growth factor for growing the size of a trie.
 */
export const TRIE_GROWTH_FACTOR = 1.618; // ~phi

/**
 * All trie properties are represented by 32 bits (4 bytes).
 */
export const TRIE_UNIT = Int32Array.BYTES_PER_ELEMENT;

/**
 * The maximum number of children of any trie node.
 */
export const TRIE_MAX_CHILDREN = UTF8_B0_2B_LEN;

// Trie child pointer properties

export const TRIE_CHILD_IDX_IDX = 0;
export const TRIE_CHILD_IDX_LEN = 1;

export const TRIE_CHILD_LEN = TRIE_CHILD_IDX_LEN;

// Trie redirect pointer properties

export const TRIE_RED_ID_IDX = 0;
export const TRIE_RED_ID_LEN = 1;

export const TRIE_RED_VALUE_IDX_IDX = 1;
export const TRIE_RED_VALUE_IDX_LEN = 1;

export const TRIE_RED_LEN = TRIE_RED_ID_LEN + TRIE_RED_VALUE_IDX_LEN;

// Trie node properties

export const TRIE_NODE_ID_IDX = 0;
export const TRIE_NODE_ID_LEN = 1;

export const TRIE_NODE_VALUE_IDX_IDX = 1;
export const TRIE_NODE_VALUE_IDX_LEN = 1;

export const TRIE_NODE_CHILDREN_IDX = 2;
export const TRIE_NODE_CHILDREN_LEN = TRIE_CHILD_LEN * TRIE_MAX_CHILDREN;

export const TRIE_NODE_LEN =
  TRIE_NODE_ID_LEN + TRIE_NODE_VALUE_IDX_LEN + TRIE_NODE_CHILDREN_LEN;

// Trie properties

export const TRIE_SIZE_IDX = 0;
export const TRIE_SIZE_LEN = 1;

export const TRIE_ROOT_IDX = 1;
export const TRIE_ROOT_LEN = TRIE_NODE_LEN;

export const TRIE_HEADER_LEN = TRIE_SIZE_LEN + TRIE_ROOT_LEN;
export const TRIE_ID_IDX = TRIE_ROOT_IDX + TRIE_NODE_ID_IDX;
