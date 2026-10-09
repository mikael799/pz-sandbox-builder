# Preset list

Type: grilling
Status: resolved
Blocked by:

## Question

Which presets does the page offer as start points? The 5 built-in presets are in `research/b42-sandbox-schema.json`. SixMonthsLater is a partial VERSION 5 file. Does the page offer all 5, a subset, or add its own?

## Answer

- List: all 5 built-in presets in game order: Apocalypse "(game default)", Outbreak, Extinction, Rising, SixMonthsLater. There is no separate "Game defaults" entry. Values are the effective values in `research/b42-sandbox-schema.json` (SixMonthsLater after the game's fill and upgrade).
- A preset loads exactly as shipped, like a paste. Label-number mismatches (Extinction, Rising, SixMonthsLater) show the mismatch marker and stay until you touch the driver.
- Shutoff days: on preset load, the page rolls `WaterShutModifier` and `ElecShutModifier` inside their dropdown's range, as the single-player menu does (`MainScreen.setSandboxPreset`). The stored 14 is not used.
- Picking a preset replaces all known values and clears overrides. Unknown pass-through keys stay. If anything changed, the page first asks "Replace N changes?" inline, not in a browser dialog.
