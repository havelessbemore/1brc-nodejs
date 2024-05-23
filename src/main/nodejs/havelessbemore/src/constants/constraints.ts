/**
 * The maximum number of entries.
 * 
 * @remarks
 * 
 * Changing this value affects the `count` and 
 * `sum` values used for calculating a station's
 * average temperature. 
 * 
 * Valid values `v` satisfy the following constraints:
 * - Integers where `0 < v < 2^32`
 * - log2(`v` * 10^({@link TEMPERATURE_MAX_LEN}-2)) < 48
 */
export const MAX_ENTRIES = 1e9;

/**
 * The maximum number of unique stations.
 * 
 * @remarks
 * 
 * Changing this value affects the indexing of trie nodes.
 * 
 * Valid values `v` satisfy the following constraints:
 * - Positive integer
 * - `v` * {@link STATION_NAME_MAX_LEN} < 3,314,018.
 */
export const MAX_STATIONS = 1e4;

/**
 * The maximum byte length of a station name.
 * 
 * @remarks
 * 
 * Changing this value affects the indexing of trie nodes.
 * 
 * Valid values `v` satisfy the following constraints:
 * - Positive integer
 * - {@link MAX_STATIONS} * `v` < 3,314,018.
 */
export const STATION_NAME_MAX_LEN = 100;

/**
 * The maximum byte length of a temperature reading.
 * 
 * @remarks
 * 
 * Changing this value affects the `min`, `max` and `sum` values 
 * used for calculating a station's min, max and avg 
 * temperatures, respectively. 
 * 
 * Valid values `v` satisfy the following constraints:
 * - Positive integer
 * - `2 <= v <= 16`.
 * 
 * Please note that valid temperatures `t` should be:
 * - `-(10^(v-2)) < t < 10^(v-2)`.
 */
export const TEMPERATURE_MAX_LEN = 5;

/**
 * The maximum length in bytes of an entry.
 *
 * Example: `Abha;71.3`
 * - Station name: 1-100 bytes
 * - Semicolon: 1 byte
 * - Temperature: 3-5 bytes
 * - Newline: 1 byte
 */
export const ENTRY_MAX_LEN = STATION_NAME_MAX_LEN + TEMPERATURE_MAX_LEN + 2;
