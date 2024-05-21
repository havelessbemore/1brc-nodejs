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
 * The maximum value of a byte for UTF-8 code points of up to 2 bytes.
 *
 * @see {@link https://en.wikipedia.org/wiki/UTF-8#Encoding | UTF-8 Encoding}
 */
export const UTF8_2B_MAX = 224;

/**
 * The number of non-printable control code points from U+0000 to U+001F.
 *
 * @see {@link https://www.charset.org/utf-8 | UTF-8 Charset}
 */
export const UTF8_PRINT_OFFSET = 32;

/**
 * The number of printable byte values for UTF-8 code points of up to 2 bytes.
 */
export const UTF8_2B_PRINT_MAX = UTF8_2B_MAX - UTF8_PRINT_OFFSET;
