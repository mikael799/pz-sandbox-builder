# Linked field candidates

Type: research
Status: resolved
Blocked by:

## Question

Which sandbox fields does the game combine in its own logic, so that changing one without the others gives a surprising result? Start with zombie population (`PopulationMultiplier`, `PopulationStartMultiplier`, `PopulationPeakMultiplier`, `PopulationPeakDay`, respawn and redistribute settings), then loot (rarity and respawn), zombie lore, and day length with the time-based fields (spoilage, fuel, water and power shutoff). For each candidate group: the fields, how the game code uses them together, and how the built-in presets set them relative to each other (the ratios a scaling rule can copy).

## Comments

Research: research/linked-field-candidates.md

## Answer

Seven candidate groups exist, plus one non-group. Detail is in `research/linked-field-candidates.md`. Main facts for the scaling decision:
- Population: `PopulationStartMultiplier` and `PopulationPeakMultiplier` already multiply `PopulationMultiplier`. If the page rescales them when population changes, the change applies twice. The game only links the `Zombies` dropdown to `PopulationMultiplier` through a fixed table.
- Respawn and migration: the dropdowns are labels. The game reads only the numbers (`RespawnHours`, `RespawnUnseenHours`, `RespawnMultiplier`, `RedistributeHours`).
- Loot rarity has no preset ratio to copy. Loot ramps are Max / DaysUntilMax pairs. `HoursForLootRespawn` = 0 switches loot respawn off.
- Zombie lore: on/off gates only (`SprinterPercentage` needs Speed = Random, `DoorOpeningPercentage` needs Cognition = Random).
- Shutoff: a dedicated server uses `WaterShutModifier` / `ElecShutModifier` from the file, not the dropdowns. `TimeSinceApo` >= 2 puts the default shutoff in the past at start.
- Day length is not linked in game. Keeping real-time durations constant is a feature the page can add on its own.
- Open: the Start to Peak ramp shape (native code), the `RuralLooted` integer bug, Insane 3.0 against 4.0.
