# The One Billion Row Challenge with Node.js

## Run

1. If needed, follow steps 1-2 in [Running the challenge](../../../../README.md#running-the-challenge) to create a `measurements.txt` file.

1. Run:

```bash
./calculate_average_havelessbemore.sh measurements.txt
```

## Benchmark

### Results

- Min: 14.8s
- Avg: 15.5s

### Specs:

- Machine:

  - MacBook Pro M2
  - RAM: 8 GB
  - Cores: 8 (4 performance + 4 efficiency)
  - OS: MacOS Sonoma

- Other
  - NodeJS: v20.13.1
  - Web workers: 8
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

Output will be in the `dist/` directory. Both CommonJs (`.cjs`) and ECMAScript (`.mjs`) modules are created.
