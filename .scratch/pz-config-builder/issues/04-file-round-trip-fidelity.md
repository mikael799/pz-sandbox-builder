# File round-trip fidelity

Type: grilling
Status: resolved
Blocked by: 01

## Question

When you paste a sandbox file and copy it back out, what must stay the same? Key order, comments, number formatting (`1.0` against `1`), unknown keys and nested tables. And what does the page do with a paste that it cannot parse? What does it do with a paste whose `VERSION` is not 6 (B41, an older file, a newer patch), and with values outside a key's range?

## Answer

Only values survive a round trip. The layout does not. The game ignores comments on load and writes the whole file again on save, so the page does the same. Format detail is in `research/b42-sandbox-schema.md` (File format) and `research/b42-default_SandboxVars.lua`.

- Output: always written again in the game writer's format. `SandboxVars = {`, `VERSION = 6` first, game key order, nested tables in the order `Basement`, `Map`, `ZombieLore`, `ZombieConfig`, `MultiplierConfig`. Comments are generated from the schema (tooltip, enum labels, `Min: Max: Default:`). 4-space indent, comma after every entry, CRLF, ASCII. Doubles always have a decimal point (`72.0`) and integers have none.
- Unknown keys and tables pass through as raw text. An unknown key goes at the end of the table it came from. Unknown tables go after the game tables. Both keep paste order.
- Accepted input: `SandboxVars = { ... }` and `return { ... }` (preset shape, `Version` or `VERSION`).
- Unparseable paste: an error with the line number. Nothing loads, and the current state stays.
- VERSION below 6: refused, with the message to start the server once with the file so that it writes an upgraded file. VERSION above 6: loaded with a warning, unknown keys pass through.
- Missing keys: filled from defaults, with a count of filled keys.
- Out-of-range values: loaded as is and marked red, never clamped without telling you. Inputs stop new out-of-range values.
