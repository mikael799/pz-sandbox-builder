# Spec: PZ sandbox config builder

This spec describes one static HTML page. The page edits a Project Zomboid Build 42 sandbox file (`<servername>_SandboxVars.lua`). It outputs the complete file, which you copy to a server. Every decision below links to the ticket that holds its reasoning. Terms are defined in `/CONTEXT.md`.

## Scope

- In scope: the sandbox file for Build 42.21.0, sandbox format `VERSION = 6`.
- Out of scope: the server `.ini` file, Build 41, host panel integration, custom maths of any kind.

## Delivery

- One file, `index.html`, with no build step and no dependencies. You open it from disk.
- The page embeds `research/b42-sandbox-schema.json` (269 keys: type, min, max, default, enum labels, label, tooltip, tab, order, section, preset values, advanced combos).

## Data in and out

Source: [File round-trip fidelity](issues/04-file-round-trip-fidelity.md). Format reference: `research/b42-default_SandboxVars.lua`.

1. Input: a paste of `SandboxVars = { ... }` or `return { ... }`. The parser reads numbers, booleans, strings, nested tables and `--` comments.
2. Unparseable input: show an error with the line number. Load nothing and keep the current state.
3. `VERSION` below 6: refuse the file. Tell the user to start the server once with it so that the server writes an upgraded file.
4. `VERSION` above 6: load the file and show a warning.
5. Missing keys: fill from defaults and show the count of filled keys.
6. Out-of-range values: load as is and mark red. Do not clamp. Inputs stop new out-of-range values.
7. Unknown keys and tables: keep as raw text. An unknown key goes at the end of its own table. Unknown tables go after the game tables. Both keep paste order.
8. Output: always written in the game writer's format:
   - `SandboxVars = {`, then `VERSION = 6,` first.
   - Top-level keys in schema order, then the tables `Basement`, `Map`, `ZombieLore`, `ZombieConfig`, `MultiplierConfig`.
   - A comment block above each key, generated from the schema: tooltip lines, `-- n = Label` lines for enums, and `Min: Max: Default:` for numbers.
   - 4-space indent, a comma after every entry, CRLF line endings, ASCII.
   - Doubles always have a decimal point (`72.0`). Integers have none.
9. Copy file (to the clipboard) and Download (`<name>_SandboxVars.lua`).

## Linked fields

Source: [Linked groups and scaling rules](issues/03-linked-groups-and-scaling.md). Every value comes from the game's own tables.

| Driver | Followers | Rule |
|---|---|---|
| `Zombies` | `ZombieConfig.PopulationMultiplier` | Insane 2.5, Very High 1.6, High 1.2, Normal 0.65, Low 0.15, None 0.0. The game does not change Start or Peak. |
| `ZombieRespawn` | `ZombieConfig.RespawnHours`, `RespawnUnseenHours`, `RespawnMultiplier` | High 16/6/0.5, Normal 72/16/0.1, Low 216/48/0.05, None 0/0/0 |
| `ZombieMigrate` | `ZombieConfig.RedistributeHours` | on 12.0, off 0.0 |
| `WaterShut` | `WaterShutModifier` | Random day in range, with a re-roll button |
| `ElecShut` | `ElecShutModifier` | Random day in range, with a re-roll button |

Population table:

| Level | PopulationMultiplier | Start | Peak |
|---|---|---|---|
| Insane | 2.5 | 4.0 | 4.0 |
| Very High | 1.6 | 2.0 | 2.0 |
| High | 1.2 | 1.5 | 1.5 |
| Normal | 0.65 | 1.0 | 1.5 |
| Low | 0.15 | 0.5 | 0.5 |
| None | 0.0 | 0.0 | 0.0 |

Shutoff ranges, in days, by enum value 1 to 9: Instant −1, then 0-30, 0-60, 0-180, 0-360, 0-1800, 60-180, 180-360, and Disabled 2147483647. For `ElecShut`, values 2 to 6 start at 14 instead of 0. The source is `research/linked-field-candidates.md`, section 7.

Behavior:

- A driver change sets every follower that is not an override.
- When you edit a follower by hand and the new set of values matches a table row, the driver label changes to that row. Otherwise the follower becomes an override.
- An override shows an "override" tag and a reset button. Reset sets the follower from its driver again.
- A loaded file or preset is never changed by the links. If a label and its numbers disagree, show a "numbers differ" marker until you touch the driver.
- If a shutoff day is at or before `(TimeSinceApo − 1) × 30`, show a warning. That utility is already off when play starts.

Gates (display only): if the game ignores a field, show it faded with "ignored: <reason>".

- `ZombieLore.SprinterPercentage` needs `ZombieLore.Speed` = 4 (Random).
- `ZombieLore.DoorOpeningPercentage` needs `ZombieLore.Cognition` = 4 (Random).
- `SeenHoursPreventLootRespawn`, `MaxItemsForLootRespawn` and `ConstructionPreventsLootRespawn` need `HoursForLootRespawn` > 0.

## Presets

Source: [Preset list](issues/06-preset-list.md).

- The list shows Apocalypse "(game default)", Outbreak, Extinction, Rising and SixMonthsLater, with values from the schema JSON.
- A preset loads as shipped, like a paste. On load, the page rolls the two shutoff days inside their dropdown's range.
- A preset replaces all known values and clears overrides. Unknown keys stay. If anything changed, the page first asks "Replace N changes?" inline.

## Saving

Source: [Saving between visits](issues/07-saving-between-visits.md).

- After every change, the page saves the output file text and the override list to `localStorage`.
- On open, the page loads the saved file through the paste path and shows "Restored your last session".
- If storage is blocked or empty, the page starts from defaults with no error.

## Layout

Source: [Page layout](issues/05-page-layout.md). Visual reference: `prototype/page-layout.html?variant=B`. That file is a rough prototype, not production code.

- Left pane: the search box, an "Only changed settings" filter (it applies to tabs and search), the 9 tabs in schema order (each with a count of changed settings), the preset selector.
- Middle pane: the tab title, then section cards, at most 720 px wide. A row shows the label, its tags and its control. Under the label, a muted line in a smaller font shows the game's comment for that setting. The page removes the game's color codes (`<BHC>`, `<RGB:...>`) and shortens "Min: Max: Default:" to "Default:". The key shows on hover.
  - Controls: a checkbox for booleans, a select for enums, a number input for numbers. A number with advanced combos also gets a named-level select.
  - Followers sit right under their driver, with a thin accent line.
  - A card where three or more settings share the same named levels starts with an "All <section>" row, for example "All loot rarity" (21 settings). Its dropdown sets every one of those settings at once. The XP multipliers card has an "All XP multipliers" row with a number input (36 settings). The row looks like a driver row: a "sets N" pill, or a "values differ" pill while the settings disagree. Both are shortcuts, not linked groups: no override tags on the settings.
  - Changed rows have a yellow background.
- Right pane: Copy file (primary) and Download, a folded paste input, the messages, then the live output file. Changed lines are highlighted and the other lines are grey.
- Search matches the label and the key across all tabs.
- Type: Segoe UI Variable 15px with 1.55 line height, Cascadia Code for the file. Thin scrollbars, light and dark themes.

## Checks for the build

- Loading `research/b42-default_SandboxVars.lua` gives 269 keys, no mismatch markers, and output identical to the input apart from the comment fixes.
- A paste with a mod key and a mod table puts both in the output exactly once.
- `VERSION = 5` is refused. A bad value gives an error with the line number.
- Zombies → Very High sets 1.6 / 2.0 / 2.0. An overridden Peak keeps its value after the next Zombies change.
