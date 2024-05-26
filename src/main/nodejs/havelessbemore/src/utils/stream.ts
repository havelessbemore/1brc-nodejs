import { FileHandle } from "fs/promises";

import { Config } from "../constants/config";
import { CharCode } from "../constants/utf8";

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
 * Splits a file into `target` chunks or less.
 *
 * - Each chunk is aligned to a file line;
 * i.e. file start, newline ('\n') or file end.
 * - A chunk's size will be greater than or equal to `fileSize / target`.
 * - `target` chunks or less will be generated.
 *
 * @param filePath - The local path to the file to be chunked.
 * @param target - The target number of chunks to split the file into.
 * @param maxLineLength - The maximum length of a line in the file.
 * @param minSize - The minimum size of a chunk in bytes. Defaults to `0`.
 *
 * @returns A promise that resolves to an array of index pairs, where each
 * pair represents a chunk's start (inclusive) and end (exclusive) indices.
 *
 * @throws Will throw an error if the file cannot be opened or read.
 */
export async function getFileChunks(
  file: FileHandle,
  target: number,
  maxLineLength: number,
  minSize = 0,
): Promise<[number, number][]> {
  // Get the file's size
  const size = (await file.stat()).size;
  // Calculate each chunk's target size
  const chunkSize = Math.max(minSize, Math.floor(size / target));
  // Initialize constants
  const buffer = Buffer.allocUnsafe(maxLineLength);
  const chunks: [number, number][] = [];
  // Traverse the file, visiting each chunk's end index (exclusive)
  let start = 0;
  for (let end = chunkSize; end < size; end += chunkSize) {
    // Read a line at the intended end index
    const res = await file.read(buffer, 0, maxLineLength, end);
    // Find the nearest newline ('\n') character
    const newline = buffer.indexOf(CharCode.NEWLINE);
    // If found
    if (newline >= 0 && newline < res.bytesRead) {
      // Align end with the newline
      end += newline + 1;
      // Add the chunk
      chunks.push([start, end]);
      // Update the start index for the next chunk
      start = end;
    }
  }
  // Add the last chunk, if necessary
  if (start < size) {
    chunks.push([start, size]);
  }
  // Return chunks
  return chunks;
}

/**
 * Calculates an optimal highWaterMark value based on the given size.
 *
 * @param size - The size based on which the highWaterMark will be calculated.
 *
 * @returns The calculated highWaterMark value.
 */
export function getHighWaterMark(size: number): number {
  // Get size percentage
  size *= Config.HIGH_WATER_MARK_RATIO;
  // Get nearest power
  size = Math.round(Math.log2(size));
  // Calculate high water mark
  size = 2 ** size;
  // Clamp value
  return clamp(size, Config.HIGH_WATER_MARK_MIN, Config.HIGH_WATER_MARK_MAX);
}
