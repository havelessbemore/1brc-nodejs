import { Config } from "../constants/config";

/**
 * Clamp a value within a given range.
 *
 * @param value - The value to clamp.
 * @param min - The range min (inclusive).
 * @param max - The range max (inclusive).
 *
 * @returns The clamped value.
 */
export function clamp(value: number, min: number, max: number): number {
  return value > min ? (value <= max ? value : max) : min;
}

/**
 * Calculates a chunk size based on a given page size.
 *
 * @param size - The page size.
 *
 * @returns The calculated chunk size.
 */
export function getChunkSize(size: number): number {
  // Get size percentage
  size = Math.ceil(size * Config.CHUNK_SIZE_RATIO);
  // Align
  size += Config.SYS_PAGE_SIZE - (size % Config.SYS_PAGE_SIZE);
  // Clamp value
  return clamp(size, Config.CHUNK_SIZE_MIN, Config.CHUNK_SIZE_MAX);
}

/**
 * Calculates a page size based on a given file size.
 *
 * @param fileSize - The file size.
 * @param workers - The number of workers the file will be split across.
 *
 * @returns The calculated page size.
 */
export function getPageSize(fileSize: number, workers: number): number {
  // Divide into workers
  fileSize = Math.ceil(fileSize / workers);
  // Align
  fileSize += Config.SYS_PAGE_SIZE - (fileSize % Config.SYS_PAGE_SIZE);
  // Clamp value
  return clamp(fileSize, Config.PAGE_SIZE_MIN, Config.PAGE_SIZE_MAX);
}

/**
 * Returns the index of the last occurrence of a 
 * specified value in an array, or `-1` if it's not present.
 * 
 * @param array - The array to search through.
 * @param searchElement — The value to locate in the array.
 * @param max — The array index at which to begin searching backward.
 * 
 * @returns the index of the last occurrence, or `-1` if it's not present.
 */
export function lastIndexOf<T>(array: ArrayLike<T>, searchElement: T, max: number): number {
  while (--max >= 0) {
    if (array[max] === searchElement) {
      return max;
    }
  }
  return -1;
}