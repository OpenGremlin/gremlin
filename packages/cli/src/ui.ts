import chalk from "chalk";

// biome-ignore lint/suspicious/noConsole: CLI tool — stdout is the UI
const print = (...args: unknown[]) => console.log(...args);

export function success(msg: string) {
  print(chalk.green("✓"), msg);
}

export function fail(msg: string) {
  print(chalk.red("✗"), msg);
}

export function warn(msg: string) {
  print(chalk.yellow("⚠"), msg);
}

export function info(msg: string) {
  print(" ", msg);
}

export function log(msg: string) {
  print(msg);
}

export function heading(msg: string) {
  print();
  print(chalk.bold(msg));
}

export function link(label: string, url: string) {
  print(`  ${label}: ${chalk.cyan(url)}`);
}

export function blank() {
  print();
}

export function table(rows: [string, string, string?][]) {
  const maxLabel = Math.max(...rows.map(([label]) => label.length));
  for (const [label, status, detail] of rows) {
    const padded = label.padEnd(maxLabel + 2);
    const line = detail
      ? `${padded}${status}  ${chalk.dim(detail)}`
      : `${padded}${status}`;
    print(`  ${line}`);
  }
}
