# The One Billion Row Challenge with Node.js

## Run

1. If needed, follow steps 1-2 in [Running the challenge](../../../../README.md#running-the-challenge) to create a `measurements.txt` file.

1. Run:

```bash
./calculate_average_havelessbemore.sh measurements.txt
```

## Benchmark

### Results

- Min: 11.1s
- Avg: 11.9s
- Max: 12.1s
- Samples: 10 runs, 5s apart

#### Specs:

- Machine:

  - Model: MacBook Air
  - Chip: Apple M2
  - Cores: 8 (4 performance + 4 efficiency)
  - Memory: 8 GB
  - OS: MacOS Sonoma

- Other:
  - NodeJS: v20.14.0
  - Input file: ~13.8 GB

## Build

If you'd like to rebuild the project:

1. Navigate to the project subdirectory

```bash
cd ./src/main/nodejs/havelessbemore
```

2. Install dev dependencies (TypeScript, bundler, etc)

```bash
npm install
```

3. Build

```bash
npm run build
```

Output is built in the `dist/` directory as ECMAScript (`.mjs`) modules.
