import { CHAR_ZERO } from "./utf8";

/**
 * The minimum value in bytes for `highWaterMark`.
 */
export const HIGH_WATER_MARK_MIN = 16384; // 16KiB

/**
 * The maximum value in bytes for `highWaterMark`.
 */
export const HIGH_WATER_MARK_MAX = 1048576; // 1MiB

/**
 * The `highWaterMark` for write streams.
 */
export const HIGH_WATER_MARK_OUT = 1048576; // 1MiB

/**
 * The ratio of the file size to use for calculating
 * the `highWaterMark` of a stream.
 */
export const HIGH_WATER_MARK_RATIO = 0.000152;

/**
 * The minimum size in bytes of a file chunk.
 */
export const CHUNK_SIZE_MIN = HIGH_WATER_MARK_MIN;

// PARSE DOUBLE

/**
 * Used to parse doubles from -9.9 to 9.9.
 */
export const CHAR_ZERO_11 = 11 * CHAR_ZERO;

/**
 * Used to parse doubles from -99.9 to 99.9.
 */
export const CHAR_ZERO_111 = 111 * CHAR_ZERO;
