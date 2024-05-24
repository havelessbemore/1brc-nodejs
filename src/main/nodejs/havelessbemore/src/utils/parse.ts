import { CHAR_MINUS, CHAR_ZERO } from "../constants/utf8";

export const CHAR_ZERO_11 = 11 * CHAR_ZERO;
export const CHAR_ZERO_111 = 111 * CHAR_ZERO;

/**
 * Converts an ASCII numeric string into an integer.
 * 
 * Fastest.
 */
export function parseDouble(b: Buffer, min: number, max: number): number {
  if (b[min] === CHAR_MINUS) {
    ++min;
    return min + 4 > max
      ? -(10 * b[min] + b[min + 2] - CHAR_ZERO_11)
      : -(100 * b[min] + 10 * b[min + 1] + b[min + 3] - CHAR_ZERO_111);
  }
  return min + 4 > max
    ? 10 * b[min] + b[min + 2] - CHAR_ZERO_11
    : 100 * b[min] + 10 * b[min + 1] + b[min + 3] - CHAR_ZERO_111;
}

/**
 * Converts an ASCII numeric string into an integer.
 * 
 * Second fastest.
 */
export function parseDoubleFlat(b: Buffer, min: number, max: number): number {
    const sign = -(b[min] === CHAR_MINUS);
    b[min + ~sign] = CHAR_ZERO;
    return (
      ((100 * b[max - 4] + 10 * b[max - 3] + b[max - 1] - CHAR_ZERO_111) ^ sign) -
      sign
    );
  }

/**
 * Converts an ASCII numeric string into an integer without branching.
 *
 * Inspired by {@link https://github.com/gunnarmorling/1brc/blob/main/src/main/java/dev/morling/onebrc/CalculateAverage_thomaswue.java#L68 | Quan Anh Mai's method}.
 * 
 * Slowest.
 */
export function parseDoubleQuan(b: Buffer, min: number, max: number): number {
  b[min - 1] = 0;
  const sign = -(b[min] === CHAR_MINUS);
  const signMask = -(min + 4 >= max) & sign & 0xff000000;
  let v = b.readUint32BE(max - 4) & ~signMask & 0x0f0f000f;
  v = (v & 0xff000000) * 0x19 + (v & 0x00ff0000) * 0x280 + (v << 22);
  return ((v >>> 22) ^ sign) - sign;
}
