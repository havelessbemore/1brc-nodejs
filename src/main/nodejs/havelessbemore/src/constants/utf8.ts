// UTF-8 char codes

/**
 * The char code for a minus sign: -
 */
export const CHAR_MINUS = 45; // "-".charCodeAt(0);

/**
 * The char code for a newline: \n
 */
export const CHAR_NEWLINE = 10; // "\n".charCodeAt(0);

/**
 * The char code for a period: .
 */
export const CHAR_PERIOD = 46; // ".".charCodeAt(0);

/**
 * The char code for a semicolon: ;
 */
export const CHAR_SEMICOLON = 59; // ";".charCodeAt(0);

/**
 * The char code for a zero: 0
 */
export const CHAR_ZERO = 48; // "0".charCodeAt(0);

// UTF-8 constants

/**
 * The minimum value of the first byte of a UTF-8 code point.
 *
 * Ignores the control code points from U+0000 to U+001F.
 *
 * @see {@link https://www.charset.org/utf-8 | UTF-8 Charset}
 */
export const UTF8_B0_MIN = 32;

/**
 * The minimum value for noninitial bytes of a UTF-8 code point.
 *
 * @see {@link https://en.wikipedia.org/wiki/UTF-8#Encoding | UTF-8 Encoding}
 */
export const UTF8_BN_MIN = 128;

export const UTF8_B0_1B_LEAD = 0b00000000;
export const UTF8_BN_LEAD = 0b10000000;
export const UTF8_B0_2B_LEAD = 0b11000000;
export const UTF8_B0_3B_LEAD = 0b11100000;
export const UTF8_B0_4B_LEAD = 0b11110000;

export const UTF8_B0_1B_LEAD_MASK = 0b10000000;
export const UTF8_BN_LEAD_MASK = 0b11000000;
export const UTF8_B0_2B_LEAD_MASK = 0b11100000;
export const UTF8_B0_3B_LEAD_MASK = 0b11110000;
export const UTF8_B0_4B_LEAD_MASK = 0b11111000;

export const UTF8_B0_1B_MAX = 0b01111111;
export const UTF8_BN_MAX = 0b10111111;
export const UTF8_B0_2B_MAX = 0b11011111;
export const UTF8_B0_3B_MAX = 0b11101111;
export const UTF8_B0_4B_MAX = 0b11110111;
export const UTF8_B0_MAX = UTF8_B0_4B_MAX;

export const UTF8_B0_1B_LEN = UTF8_B0_1B_MAX - UTF8_B0_MIN + 1;
export const UTF8_B0_2B_LEN = UTF8_B0_2B_MAX - UTF8_B0_MIN + 1;
export const UTF8_B0_3B_LEN = UTF8_B0_3B_MAX - UTF8_B0_MIN + 1;
export const UTF8_B0_4B_LEN = UTF8_B0_4B_MAX - UTF8_B0_MIN + 1;
export const UTF8_B0_LEN = UTF8_B0_MAX - UTF8_B0_MIN + 1;
export const UTF8_BN_LEN = UTF8_BN_MAX - UTF8_BN_MIN + 1;
