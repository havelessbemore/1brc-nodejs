/**
 * The maximum number of entries in the file (i.e. 1 billion).
 */
export const MAX_ENTRIES = 1e9;

/**
 * The maximum number of unique stations (i.e. 10 thousand).
 */
export const MAX_STATIONS = 1e4;

/**
 * The maximum length in bytes of a station name (i.e. 100 bytes).
 */
export const STATION_NAME_MAX_LEN = 100;

/**
 * The maximum length in bytes of an entry.
 *
 * Example: `Abha;71.3`
 * - Station name: 1-100 bytes
 * - Semicolon: 1 byte
 * - Temperature: 3-5 bytes
 * - Newline: 1 byte
 */
export const ENTRY_MAX_LEN = 107;
