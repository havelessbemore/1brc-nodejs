/* eslint-disable @typescript-eslint/no-duplicate-enum-values */

export const enum CharCode {
  /**
   * The char code for a minus sign: -
   */
  MINUS = 45, // "-".charCodeAt(0),

  /**
   * The char code for a newline: \n
   */
  NEWLINE = 10, // "\n".charCodeAt(0),

  /**
   * The char code for a period: .
   */
  PERIOD = 46, // ".".charCodeAt(0),

  /**
   * The char code for a semicolon: ,
   */
  SEMICOLON = 59, // ";".charCodeAt(0),

  /**
   * The char code for a zero: 0
   */
  ZERO = 48, // "0".charCodeAt(0),
}

// UTF-8 constants

export const enum UTF8 {
  /**
   * The minimum value of a UTF-8 byte.
   *
   * Ignores C0 control codes from U+0000 to U+001F.
   *
   * @see {@link https://en.wikipedia.org/wiki/Unicode_control_characters#Category_%22Cc%22_control_codes_(C0_and_C1) | Control Codes}
   */
  BYTE_MIN = 32,

  /**
   * The maximum value of a UTF-8 byte.
   *
   * @see {@link https://en.wikipedia.org/wiki/UTF-8#Encoding | UTF-8 Encoding}
   */
  BYTE_MAX = 0b11110111,

  /**
   * The number of possible values in a UTF-8 byte.
   */
  BYTE_SPAN = BYTE_MAX - BYTE_MIN + 1,

  /*
    B0_1B_LEAD = 0b00000000,
    BN_LEAD = 0b10000000,
    B0_2B_LEAD = 0b11000000,
    B0_3B_LEAD = 0b11100000,
    B0_4B_LEAD = 0b11110000,

    B0_1B_LEAD_MASK = 0b10000000,
    BN_LEAD_MASK = 0b11000000,
    B0_2B_LEAD_MASK = 0b11100000,
    B0_3B_LEAD_MASK = 0b11110000,
    B0_4B_LEAD_MASK = 0b11111000,

    B0_1B_MAX = 0b01111111,
    BN_MAX = 0b10111111,
    B0_2B_MAX = 0b11011111,
    B0_3B_MAX = 0b11101111,
    B0_4B_MAX = 0b11110111,
    */
}

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
  GROWTH_FACTOR = 1.6180339887,
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
