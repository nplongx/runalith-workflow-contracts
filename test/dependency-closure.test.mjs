import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const closure = [
  'src/runtime/workflow/artifacts.js',
  'src/runtime/workflow/success-contract.js',
  'src/runtime/strict-json.js'
];

test('public contract implementation has only Node built-ins and the three-file local closure', () => {
  for (const relative of closure) {
    const source = fs.readFileSync(new URL(`../${relative}`, import.meta.url), 'utf8');
    const specifiers = [...source.matchAll(/(?:^|\n)import\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g)]
      .map(match => match[1]);
    for (const specifier of specifiers) {
      assert.ok(specifier.startsWith('node:') || specifier.startsWith('.'),
        `${relative} must not import external or host runtime module ${specifier}`);
      if (specifier.startsWith('.')) {
        const resolved = path.normalize(path.join(path.dirname(relative), specifier));
        assert.ok(closure.includes(resolved), `${relative} imports outside the declared public source closure: ${specifier}`);
      }
    }
    assert.doesNotMatch(source, /better-sqlite3|node:sqlite|@langchain|fetch\s*\(/,
      `${relative} must remain independent of databases, app frameworks and network access`);
  }
});
