/* eslint-disable @typescript-eslint/no-duplicate-enum-values */

export const enum Config {
  /**
   * The system's page size (`getconf PAGE_SIZE`).
   */
  SYS_PAGE_SIZE = 16384, // 16 KiB,

  /**
   * The minimum value in bytes for a chunk size.
   * 
   * Should ideally be a multiple of {@link SYS_PAGE_SIZE}
   */
  CHUNK_SIZE_MIN = SYS_PAGE_SIZE,

  /**
   * The maximum value in bytes for a chunk size.
   * 
   * Should ideally be a multiple of {@link SYS_PAGE_SIZE}
   */
  CHUNK_SIZE_MAX = 16777216, // 16 MiB

  /**
   * The ratio of the page size for calculating chunk size.
   */
  CHUNK_SIZE_RATIO = 0.00390625,

  /**
   * The `highWaterMark` for write streams.
   */
  HIGH_WATER_MARK_OUT = 1048576, // 1 MiB

  /**
   * The minimum value in bytes for a page size.
   * 
   * Should ideally be a multiple of {@link SYS_PAGE_SIZE}
   */
  PAGE_SIZE_MIN = SYS_PAGE_SIZE,

  /**
   * The maximum value in bytes for a page size.
   * 
   * Should ideally be a multiple of {@link SYS_PAGE_SIZE}
   */
  PAGE_SIZE_MAX = 4294967296, // 4 GiB

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
  WORKERS_MAX = 256,
}
