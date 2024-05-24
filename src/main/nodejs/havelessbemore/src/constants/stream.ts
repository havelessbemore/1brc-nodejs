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
