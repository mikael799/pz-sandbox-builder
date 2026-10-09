# B42 sandbox file schema

Type: research
Status: resolved
Blocked by:

## Question

What is the complete Build 42 sandbox file schema? For each key: name, nesting (for example `ZombieLore.Speed`), type (int, float, bool, enum), range, default, enum labels, and the in-game tab and order it appears under. Also: the exact file format (top-level `SandboxVars = { ... }`, `VERSION`, comments, nested tables), and the built-in presets with their values. Prefer the game's own files (`media/lua/shared/Sandbox/`, `media/sandbox-options.txt`, translation files for labels) over wiki pages.

## Comments

Research: research/b42-sandbox-schema.md

## Answer

The full schema is in `research/b42-sandbox-schema.json`, with notes in `research/b42-sandbox-schema.md` and a game-written sample in `research/b42-default_SandboxVars.lua`. Source: the game's own jar, Lua and translation files, Build 42.21.0 (revision 4a0e9546ec).
- 269 keys: 183 top level, 86 in the nested tables `ZombieLore`, `ZombieConfig`, `MultiplierConfig`, `Map`, `Basement` (one level deep). 12 keys are written to the file but not shown in the game UI.
- 9 tabs: Time, Zombie, Loot, World, Nature, Meta, Character, Vehicles, Livestock.
- Format: `SandboxVars = {`, `VERSION = 6` first, 4-space indent, comma after every entry, generated `--` comments (some sit above the wrong key, so they are not data), CRLF.
- 5 built-in presets with effective values. Apocalypse equals the defaults. SixMonthsLater is a partial VERSION 5 file.
- Gaps: out-of-range handling in game, upgrade rules for VERSION < 6, mod options (pass-through), English labels only.
