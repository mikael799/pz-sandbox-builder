# Linked groups and scaling rules

Type: grilling
Status: resolved
Blocked by: 01, 02

## Question

Which linked groups does the page ship with, which field drives each group, and what rule rescales each follower (proportional, fixed ratio from presets, lookup table)? Population is the first group.

## Answer

Rule: the page adds no custom maths. Every link copies a table or a behavior from the game itself (`media/lua/shared/defines.lua`, `SandboxOptions.lua`). Detail on each link is in `research/linked-field-candidates.md`.

Lookup links (a driver sets followers from the game's tables):
- `Zombies` sets `ZombieConfig.PopulationMultiplier`, `PopulationStartMultiplier` and `PopulationPeakMultiplier` to the same named level:

  | Level | PopulationMultiplier | Start | Peak |
  |---|---|---|---|
  | Insane | 2.5 | 4.0 | 4.0 |
  | Very High | 1.6 | 2.0 | 2.0 |
  | High | 1.2 | 1.5 | 1.5 |
  | Normal | 0.65 | 1.0 | 1.5 |
  | Low | 0.15 | 0.5 | 0.5 |
  | None | 0.0 | 0.0 | 0.0 |

  The user accepted that the game multiplies these together, and that the presets do not follow this table.
  Amended during "Page layout": the Normal row uses the game defaults (Peak 1.5, not the table value 1.0), so a default file shows no mismatch. Every other row is the game table. `PopulationPeakDay` has no table and is not linked.
- `ZombieRespawn` sets `RespawnHours`, `RespawnUnseenHours`, `RespawnMultiplier` (High 16/6/0.5, Normal 72/16/0.1, Low 216/48/0.05, None 0/0/0).
- `ZombieMigrate` sets `RedistributeHours` (on 12, off 0).
- `WaterShut` and `ElecShut` set `WaterShutModifier` and `ElecShutModifier` to a random day inside the dropdown's range, as single player does. A re-roll button picks a new day. The page warns when `TimeSinceApo` puts the day in the past.

Gates (display only, no values change): a follower shows as inactive when its switch makes the game ignore it. `SprinterPercentage` needs `Speed` = Random. `DoorOpeningPercentage` needs `Cognition` = Random. The loot respawn fields need `HoursForLootRespawn` > 0.

Mismatches: if you type a follower value that matches a table entry, the page sets the driver label to match (the game UI does the same). Otherwise the follower is an override and the label stays. A pasted file is never changed until you touch a driver. Mismatches get a small marker.

Rejected: rate pairs for the looted ramps, day length rescaling, an effective-population readout.

Amended after the build: the user asked for an all-loot control after all. It is a "Set all" dropdown on the card, not a linked group. See spec.md, Layout.
