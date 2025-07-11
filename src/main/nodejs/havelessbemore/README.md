# The One Billion Row Challenge with Node.js

## Run

1. If needed, follow steps 1-2 in [Running the challenge](../../../../README.md#running-the-challenge) to create a `measurements.txt` file.

1. Run:

```bash
./calculate_average_havelessbemore.sh measurements.txt
```

## Benchmark

### Results

- Min: 4.477s
- Avg: 4.528s
- Max: 4.578s
- Samples: 5 runs, 5s apart

#### Specs:

- Machine:
  - Model: MacBook Pro
  - Chip: Apple M4 Max
  - Cores: 14 (10 performance and 4 efficiency)
  - Memory: 36 GB
  - OS: MacOS Sequoia

- Other:
  - NodeJS: v22.17.0
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

Output is built in the `dist/` directory.
