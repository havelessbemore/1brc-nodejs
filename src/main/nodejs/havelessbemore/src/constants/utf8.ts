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
