// Run each test/*.test.mjs in its own `node --test` child, sequentially.
// Node 16's dir runner runs files concurrently on one shared mongoose
// connection; per-file DB teardown then races sibling tests. Serial avoids it.
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const files = readdirSync('test').filter((f) => f.endsWith('.test.mjs')).sort();
let anyFailed = false;
for (const f of files) {
  const { status } = spawnSync(process.execPath, ['--test', 'test/' + f], { stdio: 'inherit' });
  if (status !== 0) anyFailed = true;
}
process.exit(anyFailed ? 1 : 0);
