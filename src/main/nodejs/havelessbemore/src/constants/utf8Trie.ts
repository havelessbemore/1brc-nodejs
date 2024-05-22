import { UTF8_B0_2B_LEN, UTF8_BN_LEN } from "./utf8";

// Trie static properties

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

export const TRIE_BODY_NODE_CHILDREN_LEN = UTF8_BN_LEN;
export const TRIE_TAIL_NODE_CHILDREN_LEN = UTF8_B0_2B_LEN;

// Trie child pointer properties

export const TRIE_CHILD_IDX_IDX = 0;
export const TRIE_CHILD_IDX_UTS = 1;

export const TRIE_CHILD_UTS = TRIE_CHILD_IDX_UTS;

// Trie redirect pointer properties

export const TRIE_RED_ID_IDX = 0;
export const TRIE_RED_ID_UTS = 1;

export const TRIE_RED_VALUE_IDX_IDX = 1;
export const TRIE_RED_VALUE_IDX_UTS = 1;

export const TRIE_RED_UTS = TRIE_RED_ID_UTS + TRIE_RED_VALUE_IDX_UTS;

// Trie node properties

export const TRIE_NODE_ID_IDX = 0;
export const TRIE_NODE_ID_UTS = 1;

export const TRIE_NODE_VALUE_IDX_IDX = 1;
export const TRIE_NODE_VALUE_IDX_UTS = 1;

export const TRIE_NODE_CHILDREN_IDX = 2;
export const TRIE_BODY_NODE_CHILDREN_UTS =
  TRIE_CHILD_UTS * TRIE_BODY_NODE_CHILDREN_LEN;
export const TRIE_TAIL_NODE_CHILDREN_UTS =
  TRIE_CHILD_UTS * TRIE_TAIL_NODE_CHILDREN_LEN;

export const TRIE_BODY_NODE_UTS =
  TRIE_NODE_ID_UTS + TRIE_NODE_VALUE_IDX_UTS + TRIE_BODY_NODE_CHILDREN_UTS;

export const TRIE_TAIL_NODE_UTS =
  TRIE_NODE_ID_UTS + TRIE_NODE_VALUE_IDX_UTS + TRIE_TAIL_NODE_CHILDREN_UTS;

// Trie properties

export const TRIE_SIZE_IDX = 0;
export const TRIE_SIZE_UTS = 1;

export const TRIE_ROOT_IDX = 1;
export const TRIE_ROOT_UTS = TRIE_TAIL_NODE_UTS;

export const TRIE_ID_IDX = TRIE_ROOT_IDX + TRIE_NODE_ID_IDX;
export const TRIE_HEADER_UTS = TRIE_SIZE_UTS + TRIE_ROOT_UTS;
