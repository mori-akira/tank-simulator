import { runSim } from "./run.ts";

const seed = Number(process.argv[2] ?? 1);
const result = runSim(seed);

console.log(
  `seed=${seed} outcome=${result.outcome} ticks=${result.ticks} hash=${result.hash}`,
);
process.exitCode = result.outcome === "playing" ? 1 : 0;
