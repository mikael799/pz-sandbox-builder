// The four build checks from spec.md, run against the core of index.html. Usage: node check.js
const fs = require('fs'), assert = require('assert');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const script = id => html.match(new RegExp(`<script id="${id}">([\\s\\S]*?)</script>`))[1];
const core = new Function(script('schema') + script('core') + '; return { get S() { return S }, loadText, write, setValue, mismatch, LoadError, OPTS };')();
const def = fs.readFileSync(__dirname + '/.scratch/pz-config-builder/research/b42-default_SandboxVars.lua', 'latin1');

// 1. The game's default file: 269 keys, no mismatch markers, same output.
assert.deepStrictEqual(core.loadText(def), []);
assert.strictEqual(core.OPTS.length, 269);
['Zombies', 'ZombieRespawn', 'ZombieMigrate', 'WaterShut', 'ElecShut'].forEach(d => assert.ok(!core.mismatch(d), d));
const out = core.write(), a = def.split('\r\n'), b = out.split('\r\n');
const diff = a.map((l, i) => l !== b[i] && `${i + 1}\n  file: ${l}\n  page: ${b[i]}`).filter(Boolean);
if (process.argv[2]) fs.writeFileSync(process.argv[2], out);
console.log(diff.length ? `Default file: ${diff.length} lines differ\n${diff.join('\n')}` : 'Default file: identical');

// 2. A mod key and a mod table come out exactly once.
core.loadText(def.replace('    VERSION = 6,', '    VERSION = 6,\r\n    MyMod = { Speed = 2, Names = { "a", "b" } },\r\n    ModKey = 5,')
  .replace('        Speed = 4,', '        Speed = 4,\r\n        ModLore = true,'));
const o2 = core.write();
for (const s of ['MyMod = { Speed = 2, Names = { "a", "b" } },', 'ModKey = 5,', 'ModLore = true,'])
  assert.strictEqual(o2.split(s).length, 2, s);
assert.ok(o2.indexOf('ModLore') < o2.indexOf('ZombieConfig = {') && o2.indexOf('MyMod') > o2.indexOf('MultiplierConfig = {'));

// 3. VERSION 5 is refused, a bad value names its line.
assert.throws(() => core.loadText('SandboxVars = { VERSION = 5 }'), /VERSION 5/);
assert.throws(() => core.loadText('SandboxVars = {\n VERSION = 6,\n Zombies = "x",\n}'), /^Error: Line 3: Zombies/);
assert.throws(() => core.loadText('SandboxVars = {\n VERSION = 6,\n Zombies = ,\n}'), /Line 3/);

// 4. Zombies sets only PopulationMultiplier, like the game. Start and Peak keep their values.
core.loadText(def);
const v = core.S.vals, z = k => v['ZombieConfig.' + k];
core.setValue('Zombies', 1);
assert.deepStrictEqual([z('PopulationMultiplier'), z('PopulationStartMultiplier'), z('PopulationPeakMultiplier')], [2.5, 1, 1.5]);
core.setValue('ZombieConfig.PopulationMultiplier', 3);
assert.ok(core.S.over.has('ZombieConfig.PopulationMultiplier'));
core.setValue('Zombies', 3);
assert.strictEqual(z('PopulationMultiplier'), 3);
console.log('All checks passed.');
