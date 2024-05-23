/**
 * The minimum number of web workers (inclusive).
 */
export const MIN_WORKERS = 1;

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
 * a reasonable input file, with memory never exceeding 
 * 20 MiB total across all workers.
 * 
 * In theory, the challenge constraints allow for input 
 * files that would require each worker using upwards of 
 * 800 MiB; 10K stations with completely unique 100 byte names, 
 * thus 1M trie nodes of ~0.85 KB each. This should be
 * considered when increasing the number of workers.
 */
export const MAX_WORKERS = 512;
