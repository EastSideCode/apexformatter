import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { Config } from '../lib/engine/config.js';
import { formatApex } from '../lib/engine/engine.js';

// Each standalone baseline supplies its input, configuration, and expected
// output. This test reads checked-in JSON and runs the TypeScript/WASM engine.
const fixture = JSON.parse(await readFile(new URL('./fixtures/formatter.golden.json', import.meta.url), 'utf8'));

for (const example of fixture.cases) {
  test(`Recorded formatter baseline: ${example.name}`, async () => {
    const config = new Config(fixture.config);
    const formatted = await formatApex(example.source, config);
    assert.equal(formatted, example.expected);

    const repeated = await formatApex(formatted, config);
    assert.equal(repeated, formatted, 'Formatting already formatted output must be stable');
  });
}
