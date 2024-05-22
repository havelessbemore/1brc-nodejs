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

/**
 * The minimum value of the first byte of a UTF-8 code point.
 *
 * Ignores the control code points from U+0000 to U+001F.
 *
 * @see {@link https://www.charset.org/utf-8 | UTF-8 Charset}
 */
export const UTF8_B0_MIN = 32;

/**
 * The maximum value for the first byte of a UTF-8 code point.
 *
 * @see {@link https://en.wikipedia.org/wiki/UTF-8#Encoding | UTF-8 Encoding}
 */
export const UTF8_B0_MAX = 247;

/**
 * The maximum value for the first byte of a 1-2 byte UTF-8 code point.
 *
 * @see {@link https://en.wikipedia.org/wiki/UTF-8#Encoding | UTF-8 Encoding}
 */
export const UTF8_B0_2B_MAX = 223;

/**
 * The minimum value for noninitial bytes of a UTF-8 code point.
 *
 * @see {@link https://en.wikipedia.org/wiki/UTF-8#Encoding | UTF-8 Encoding}
 */
export const UTF8_BN_MIN = 128;

/**
 * The maximum value for noninitial bytes of a UTF-8 code point.
 *
 * @see {@link https://en.wikipedia.org/wiki/UTF-8#Encoding | UTF-8 Encoding}
 */
export const UTF8_BN_MAX = 191;

/**
 * The number of possible values for the first byte of a UTF-8 code point.
 */
export const UTF8_B0_LEN = UTF8_B0_2B_MAX - UTF8_B0_MIN + 1;

/**
 * The number of possible values for the first byte of a 1-2 byte UTF-8 code point.
 */
export const UTF8_B0_2B_LEN = UTF8_B0_2B_MAX - UTF8_B0_MIN + 1;

/**
 * The number of possible values for noninitial bytes of a UTF-8 code point.
 */
export const UTF8_BN_LEN = UTF8_BN_MAX - UTF8_BN_MIN + 1;
