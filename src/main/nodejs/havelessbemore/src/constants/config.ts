/* eslint-disable @typescript-eslint/no-duplicate-enum-values */

export const enum Mem {
  KB = 1024,
  KB_2 = 2048,
  KB_4 = 4096,
  KB_8 = 8192,
  KB_16 = 16384,
  MB = 1048576,
  MB_2 = 2097152,
  MB_4 = 4194304,
  MB_8 = 8388608,
  MB_16 = 16777216,
  MB_32 = 33554432,
  MB_64 = 67108864,
  MB_128 = 134217728,
  MB_256 = 268435456,
  MB_512 = 536870912,
  GB = 1073741824,
  GB_2 = 2147483648,
}

export const enum Config {
  /**
   * The system's page size (`getconf PAGE_SIZE`).
   */
  SYS_PAGE_SIZE = Mem.KB_16,

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
  CHUNK_SIZE_MAX = Mem.MB_16,

  /**
   * The ratio of the page size for calculating chunk size.
   */
  CHUNK_SIZE_RATIO = 1,

  /**
   * The `highWaterMark` for write streams.
   */
  HIGH_WATER_MARK_OUT = Mem.MB,

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
  PAGE_SIZE_MAX = Mem.MB_16,

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
