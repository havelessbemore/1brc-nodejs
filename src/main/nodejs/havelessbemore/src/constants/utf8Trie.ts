// Configurable constants.
//
// Controls trie behavior such as the default
// allocated size and the growth factor when resizing.

import { UTF8 } from "./utf8";

/**
 * The default initial size of a trie.
 */
export const TRIE_DEFAULT_SIZE = 655360; // 2.5 MiB

/**
 * The growth factor for resizing a trie (Approx. Phi)
 */
export const TRIE_GROWTH_FACTOR = 1.6180339887;

// Trie pointer
//
// A pointer can point to either a trie node or a trie redirect.
// They can be differentiated by the destination's ID value:
//    - If the ID matches the trie's ID, then it's a trie node.
//    - Otherwise, it's a trie redirect.

// The memory location the pointer points to.
export const TRIE_PTR_IDX_IDX = 0;
export const TRIE_PTR_IDX_MEM = 1;

export const TRIE_PTR_MEM = TRIE_PTR_IDX_MEM;

// Trie redirect (aka cross-trie pointer)
//
// Points to a memory location in a different trie.

// The different trie's ID.
export const TRIE_XPTR_ID_IDX = 0;
export const TRIE_XPTR_ID_MEM = 1;

// The memory location of the trie node in the different trie.
export const TRIE_XPTR_IDX_IDX = 1;
export const TRIE_XPTR_IDX_MEM = 1;

export const TRIE_XPTR_MEM = TRIE_XPTR_ID_MEM + TRIE_XPTR_IDX_MEM;

// Trie node

// The trie's ID
export const TRIE_NODE_ID_IDX = 0;
export const TRIE_NODE_ID_MEM = 1;

// The node's value
export const TRIE_NODE_VALUE_IDX = 1;
export const TRIE_NODE_VALUE_MEM = 1;

// The node's children pointers
export const TRIE_NODE_CHILDREN_IDX = 2;
export const TRIE_NODE_CHILDREN_LEN = UTF8.BYTE_SPAN;
export const TRIE_NODE_CHILDREN_MEM = TRIE_PTR_MEM * TRIE_NODE_CHILDREN_LEN;

export const TRIE_NODE_MEM =
  TRIE_NODE_ID_MEM + TRIE_NODE_VALUE_MEM + TRIE_NODE_CHILDREN_MEM;

// Trie

/**
 * Represents a `null` trie element.
 */
export const TRIE_NULL = 0;

// The memory location for the trie's size.
export const TRIE_SIZE_IDX = 0;
export const TRIE_SIZE_MEM = 1;

// The memory location for the trie's root node.
export const TRIE_ROOT_IDX = 1;
export const TRIE_ROOT_MEM = TRIE_NODE_MEM;

// The memory location for the trie's ID (i.e. the root node's trie ID).
export const TRIE_ID_IDX = TRIE_ROOT_IDX + TRIE_NODE_ID_IDX;

export const TRIE_MEM = TRIE_SIZE_MEM + TRIE_ROOT_MEM;
