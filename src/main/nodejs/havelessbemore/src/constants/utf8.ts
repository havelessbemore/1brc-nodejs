
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
};

// UTF-8 constants

/**
 * The minimum value of a UTF-8 byte.
 *
 * Ignores C0 control codes from U+0000 to U+001F.
 *
 * @see {@link https://en.wikipedia.org/wiki/Unicode_control_characters#Category_%22Cc%22_control_codes_(C0_and_C1) | Control Codes}
 */
export const UTF8_BYTE_MIN = 32;

/**
 * The maximum value of a UTF-8 byte.
 *
 * @see {@link https://en.wikipedia.org/wiki/UTF-8#Encoding | UTF-8 Encoding}
 */
export const UTF8_BYTE_MAX = 0b11110111;

/**
 * The number of possible values in a UTF-8 byte.
 */
export const UTF8_BYTE_SPAN = UTF8_BYTE_MAX - UTF8_BYTE_MIN + 1;

/*
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
*/
