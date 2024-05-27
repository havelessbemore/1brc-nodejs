/* eslint-disable @typescript-eslint/no-duplicate-enum-values */

export const enum Config {
  /**
   * The minimum value in bytes for `highWaterMark`.
   */
  HIGH_WATER_MARK_MIN = 16384, // 16 KiB

  /**
   * The maximum value in bytes for `highWaterMark`.
   */
  HIGH_WATER_MARK_MAX = 8388608, // 8 MiB

  /**
   * The `highWaterMark` for write streams.
   */
  HIGH_WATER_MARK_OUT = 1048576, // 1 MiB

  /**
   * The ratio of the file size to use for calculating
   * the `highWaterMark` of a stream.
   */
  HIGH_WATER_MARK_RATIO = 0.00625,

  /**
   * The minimum number of web workers (inclusive).
   */
  WORKERS_MIN = 1,

  /**
   * The maximum number of web workers (inclusive).
   *
   * The purpose is to limit the amount of memory used,
   * since each worker uses its own memory for processing.
   *
   * @remarks
   *
   * This limit should be sufficient for most use cases.
   * However, feel free to adjust up or down as needed.
   *
   * There is not much basis for the current value.
   * Development was done with at most 8 workers and
   * a reasonable input file.
   *
   * In theory, the challenge constraints allow for input
   * files that would require each worker using upwards of
   * 800 MiB; 10K stations with completely unique 100 byte names,
   * thus 1M trie nodes of ~0.85 KB each. This should be
   * considered when increasing the number of workers.
   */
  WORKERS_MAX = 512,
}
