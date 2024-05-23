import { UTF8_B0_2B_LEN } from "./utf8";

// Configurable constants

/**
 * The default initial size of a trie.
 */
export const TRIE_DEFAULT_SIZE = 524288; // 2 MiB

/**
 * The growth factor for resizing a trie (Approx. Phi)
 */
export const TRIE_GROWTH_FACTOR = 1.6180339887;

// Internal trie pointer

export const TRIE_PTR_IDX_IDX = 0;
export const TRIE_PTR_IDX_MEM = 1;

export const TRIE_PTR_MEM = TRIE_PTR_IDX_MEM;

// Cross-trie pointer (aka redirect)

export const TRIE_XPTR_ID_IDX = 0;
export const TRIE_XPTR_ID_MEM = 1;

export const TRIE_XPTR_IDX_IDX = 1;
export const TRIE_XPTR_IDX_MEM = 1;

export const TRIE_XPTR_MEM = TRIE_XPTR_ID_MEM + TRIE_XPTR_IDX_MEM;

// Trie node

export const TRIE_NODE_ID_IDX = 0;
export const TRIE_NODE_ID_MEM = 1;

export const TRIE_NODE_VALUE_IDX = 1;
export const TRIE_NODE_VALUE_MEM = 1;

export const TRIE_NODE_CHILDREN_IDX = 2;
export const TRIE_NODE_CHILDREN_LEN = UTF8_B0_2B_LEN;
export const TRIE_NODE_CHILDREN_MEM = TRIE_PTR_MEM * TRIE_NODE_CHILDREN_LEN;

export const TRIE_NODE_MEM =
  TRIE_NODE_ID_MEM + TRIE_NODE_VALUE_MEM + TRIE_NODE_CHILDREN_MEM;

// Trie

/**
 * Represents a null / undefined trie element.
 */
export const TRIE_NULL = 0;

export const TRIE_SIZE_IDX = 0;
export const TRIE_SIZE_MEM = 1;

export const TRIE_ROOT_IDX = 1;
export const TRIE_ROOT_MEM = TRIE_NODE_MEM;

export const TRIE_ID_IDX = TRIE_ROOT_IDX + TRIE_NODE_ID_IDX;
export const TRIE_MEM = TRIE_SIZE_MEM + TRIE_ROOT_MEM;
