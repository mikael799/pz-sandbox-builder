# Linked field candidates (Build 42)

Research for ticket `issues/02-linked-field-candidates.md`.

## Sources and method

- **Game install**: `E:\Steam\steamapps\common\ProjectZomboid` (Steam library `E:\Steam`, buildid 25485521, branch `public`, read 2026-10-09). There is no install under `C:\Program Files (x86)\Steam`.
- **Lua (primary, read as shipped)**:
  - Presets: `media/lua/shared/Sandbox/{Apocalypse,Outbreak,Extinction,Rising,SixMonthsLater}.lua`. `SandboxVars.lua` loads Apocalypse as the default.
  - Labels to values: `media/lua/shared/defines.lua`.
  - Sandbox UIs: `media/lua/client/OptionScreens/SandboxOptions.lua` (single-player new game), `media/lua/client/ISUI/AdminPanel/ISServerSandboxOptionsUI.lua` (in-game admin panel), `media/lua/client/OptionScreens/ServerSettingsScreen.lua` (host/server settings), `media/lua/client/OptionScreens/MainScreen.lua`.
  - Help text: `media/lua/shared/Translate/EN/Sandbox.json`.
- **Java (primary, decompiled)**: I decompiled `projectzomboid.jar` locally with CFR 0.152, using the game's own `jre64`, into a scratch folder. No game files were changed. Decompiled code is close to the real code but not the same. The decompiler rebuilds the variable names.
  - To find every class that uses a field, I scanned all `.class` files in the jar for the field or method name. A field that appears only in `zombie/SandboxOptions` is never read by game logic.
- **Native code (not readable)**: the zombie population simulation runs in `PZPopMan64.dll`. Java only passes it the values (`ZombiePopulationManager.onConfigReloaded`). So how the population fields combine comes from the in-game help text and community posts. Those parts are marked **[inferred]**.

Enum values are 1-based. Labels come from `Sandbox.json`.

The presets the game lists are Apocalypse, Outbreak, Extinction, Rising and SixMonthsLater (`ISServerSandboxOptionsUI.lua:353-357`). SixMonthsLater is an old file (`VERSION = 5`, B41-era keys, many fields missing), so it is a weak source for ratios.

---

## 1. Zombie population size

**Fields**: `Zombies` (enum 1-6: Insane, Very High, High, Normal, Low, None), `ZombieConfig.PopulationMultiplier`, `ZombieConfig.PopulationStartMultiplier`, `ZombieConfig.PopulationPeakMultiplier`, `ZombieConfig.PopulationPeakDay`.

**How the game uses them**

- **UI link (verified)**: picking `Zombies` sets `PopulationMultiplier` from `ZombiePopulationMultiplierTable = {2.5, 1.6, 1.2, 0.65, 0.15, 0.0}`, indexed by the enum (`SandboxOptions.lua:756-761`, `ISServerSandboxOptionsUI.lua:677-682`, `defines.lua:65-73`). The link also works the other way: picking a named PopulationMultiplier preset sets `Zombies` (`SandboxOptions.lua:279-285`). The help text confirms this: "Set by the 'Zombie Count' population option, or by a custom number here".
- **Runtime (verified)**: the population code only reads the `ZombieConfig.*` numbers (`ZombiePopulationManager.java` `onConfigReloaded`). `Zombies` itself does almost nothing at run time:
  - In `SandboxOptions.updateFromLua` it sets `maxRealZombies` from `Zombies`, but the next line overwrites that with `1`, so the first assignment is dead code.
  - `ItemPickerJava` (line ~1898) treats `Zombies == 6` **or** `PopulationMultiplier == 0.0` as "no zombies" for items tagged `MORE_WHEN_NO_ZOMBIES`.
  - So a file with `Zombies = 4` and `PopulationMultiplier = 2.5` runs as 2.5. The enum is only a label.
- **Start/Peak [inferred: help text plus community posts]**: the start and peak values multiply the base value. They do not replace it.
  - Help text for Start: "a multiplier for the desired zombie population at the start of the game".
  - Help text for Peak: the same text, but "on the peak day".
  - Community arithmetic: desired population = cell base × PopulationMultiplier × (Start on day 1, ramping to Peak on PeakDay). Example from one post: 100 × 0.65 × 0.5 = 32.5 at start, and 100 × 0.65 × 2 = 130 at peak ([Steam discussion](https://steamcommunity.com/app/108600/discussions/0/3198119216801095765)).
  - A second post: "x4 base and x4 peak gives x16" ([Steam discussion](https://steamcommunity.com/app/108600/discussions/0/3191368095149820826)).
  - Nobody documents the shape of the ramp. Do not assume it is linear.
- **Discrepancy**: `defines.lua` has Insane = 4.0 for Start and Peak. The help text says "Insane = 3.0". The UI writes the `defines.lua` value.

**Label tables (from `defines.lua`)**

| Label | PopulationMultiplier | StartMultiplier | PeakMultiplier |
|---|---|---|---|
| Insane | 2.5 | 4.0 | 4.0 |
| Very High | 1.6 | 2.0 | 2.0 |
| High | 1.2 | 1.5 | 1.5 |
| Normal | 0.65 | 1.0 | 1.0 |
| Low | 0.15 | 0.5 | 0.5 |
| None | 0.0 | 0.0 | 0.0 |

**Presets**

| Field | Apocalypse | Outbreak | Extinction | Rising | SixMonthsLater |
|---|---|---|---|---|---|
| `Zombies` | 4 (Normal) | 4 | 3 (High) | 5 (Low) | 1 (Insane) |
| `PopulationMultiplier` | 0.65 | 0.65 | 1.2 | 0.15 | 1.6 (= Very High, does not match `Zombies`=1) |
| `PopulationStartMultiplier` | 1.0 | 1.0 | 1.5 | 1.0 | 2.0 |
| `PopulationPeakMultiplier` | 1.5 | 1.5 | 2.0 | 1.0 | 1.0 |
| `PopulationPeakDay` | 28 | 20 | 28 | 28 | 5 |
| Peak ÷ Start | 1.5 | 1.5 | 1.33 | 1.0 | 0.5 |

**Notes for a scaling rule**

- The only driver-to-follower link the game has is `Zombies` → `PopulationMultiplier`. It is a lookup table, not a ratio.
- Start and Peak already multiply PopulationMultiplier. When PopulationMultiplier changes, do not rescale them. A rescale applies the change twice.
- The presets do not scale Start or Peak with PopulationMultiplier. Extinction raises both, but Rising (Low) keeps 1.0/1.0.
- Presets keep `Zombies` and `PopulationMultiplier` in agreement, except the stale SixMonthsLater.

---

## 2. Zombie respawn and migration

**Fields**: `ZombieRespawn` (enum 1-4: High, Normal, Low, None), `ZombieConfig.RespawnHours`, `ZombieConfig.RespawnUnseenHours`, `ZombieConfig.RespawnMultiplier`, `ZombieMigrate` (bool), `ZombieConfig.RedistributeHours`.

**How the game uses them**

- **UI link (verified)**: picking `ZombieRespawn` writes all three numbers from fixed tables (`SandboxOptions.lua:762-770`, `ISServerSandboxOptionsUI.lua:684-691`). Ticking `ZombieMigrate` sets `RedistributeHours` to `12.0` (on) or `0.0` (off) (`SandboxOptions.lua:746-753`).
- **Runtime (verified)**: the jar scan finds `zombieRespawn` and `zombieMigrate` only in `SandboxOptions`. The game never reads them during play. Only the `ZombieConfig.*` numbers reach the native population manager.
- **Help text (`Sandbox.json`)**:
  - RespawnHours: hours before zombies can respawn in a cell. "If 0, spawning is disabled".
  - RespawnUnseenHours: hours a chunk must be unseen before respawn.
  - RespawnMultiplier: the fraction of a cell's desired population that can respawn every RespawnHours.
  - RedistributeHours: "If 0, migration is disabled".
- **Cross-group link [inferred from the help text]**: respawn refills toward the *desired* population from group 1. So RespawnMultiplier is a fraction of PopulationMultiplier × Start/Peak, and it scales with it automatically.

**UI tables**

| ZombieRespawn | RespawnHours | RespawnUnseenHours | RespawnMultiplier |
|---|---|---|---|
| 1 High | 16.0 | 6.0 | 0.5 |
| 2 Normal | 72.0 | 16.0 | 0.1 |
| 3 Low | 216.0 | 48.0 | 0.05 |
| 4 None | 0.0 | 0.0 | 0.0 |

Ratios: RespawnHours ÷ RespawnUnseenHours is about 2.7 (High), 4.5 (Normal) and 4.5 (Low). Unseen hours and hours rise together, and the multiplier falls as the interval grows.

**Presets**

| Field | Apocalypse | Outbreak | Extinction | Rising | SixMonthsLater |
|---|---|---|---|---|---|
| `ZombieRespawn` | 4 (None) | 4 | 2 (Normal) | 3 (Low) | - |
| `RespawnHours` | 0.0 | 0.0 | 72.0 | 72.0 | 72.0 |
| `RespawnUnseenHours` | 0.0 | 0.0 | 16.0 | 16.0 | 16.0 |
| `RespawnMultiplier` | 0.0 | 0.0 | 0.1 | 0.1 | 0.5 |
| `ZombieMigrate` | true | true | true | true | - |
| `RedistributeHours` | 12.0 | 12.0 | 12.0 | **18.0** | 12.0 |

**Inconsistencies in the shipped presets**

- Rising says `ZombieRespawn = 3` (Low) but uses the Normal triplet.
- Rising's `RedistributeHours = 18` is not a value the `ZombieMigrate` tick box can set.

So the game's own files do not keep these groups in step. Recommendation: treat the enum as a label and the numbers as the truth.

---

## 3. Loot rarity (per-category multipliers and rarity factors)

**Fields**:

- Per category: the 21 loot fields in the preset table below (`FoodLootNew` to `ToolLootNew`, plus `SkillBookLoot` and `RecipeResourceLoot`). All are doubles with range 0.0 to 4.0 and default 0.6.
- Rarity factors: `InsaneLootFactor`, `ExtremeLootFactor`, `RareLootFactor`, `NormalLootFactor`, `CommonLootFactor`, `AbundantLootFactor`.
- Also involved: `RollsMultiplier`, `ZombiePopLootEffect`, `GeneratorSpawning`.

**How the game uses them (verified, `ItemPickerJava`)**

- `InitSandboxLootSettings` copies each `*LootNew` value directly into a per-category modifier.
- Item spawn chance (`getActualSpawnChance`) is:

  ```
  chance = (baseChance × 100 × categoryModifier + zombieDensity × ZombiePopLootEffect) × (1 − currentDiminished% / 100)
  ```

  - The zombie density part comes from `getZombieDensityFactor`, multiplied by `ZombiePopLootEffect`.
  - The last factor is `getCurrentLootMultiplier` from group 4.
  - "Junk" items with a modifier above 0 are forced to 1.0.
- `RollsMultiplier` scales the number of rolls per container: `(int)(rolls × RollsMultiplier)`. It is separate from rarity.
- **The six `*LootFactor` fields do not affect the `*LootNew` categories.**
  - Only `doSandboxSettings(int)` reads them.
  - That function turns a 7-step enum into a factor (1 → 0, 2 → Insane … 7 → Abundant).   - In this build the only caller passes `GeneratorSpawning` (`ItemPickerJava:1328`).   - The jar scan finds `insaneLootFactor` only in `SandboxOptions` and `ItemPickerJava`.
- The factor bounds form a ladder in `SandboxOptions.java:112-117`. Each factor's range ends at its neighbours' defaults:

  | Factor | min | default | max |
  |---|---|---|---|
  | Insane | 0.0 | 0.05 | 0.2 |
  | Extreme | 0.05 | 0.2 | 0.6 |
  | Rare | 0.2 | 0.6 | 1.0 |
  | Normal | 0.6 | 1.0 | 2.0 |
  | Common | 1.0 | 2.0 | 3.0 |
  | Abundant | 2.0 | 3.0 | 4.0 |

- **UI label ladder for each `*LootNew` slider** (`ServerSettingsScreen.lua` ~4538+): None 0.0, Insanely Rare 0.05, Extremely Rare 0.2, Rare 0.4, Normal 0.6, Common 2, Abundant 3. This ladder is not the same as the rarity factors. Rare is 0.4 here and 0.6 in `RareLootFactor`. Normal is 0.6 here and 1.0 in `NormalLootFactor`.
- **Cross-group link to group 1 (verified)**: `ZombiePopLootEffect` adds loot in proportion to nearby zombie density. Raising population with ZombiePopLootEffect above 0 therefore also raises loot.

**Presets**

| Field | Apocalypse | Outbreak | Extinction | Rising |
|---|---|---|---|---|
| `FoodLootNew` | 0.8 | 0.8 | 0.4 | 0.6 |
| `CannedFoodLootNew` | 0.6 | 0.6 | 0.4 | 0.6 |
| `LiteratureLootNew` | 0.6 | 0.8 | 0.6 | 0.6 |
| `SkillBookLoot` | 0.6 | 1.0 | 0.4 | 0.4 |
| `RecipeResourceLoot` | 0.6 | 0.6 | 0.4 | 0.8 |
| `MedicalLootNew` | 0.6 | 0.6 | 0.4 | 0.6 |
| `SurvivalGearsLootNew` | 0.6 | 0.6 | 0.4 | 2.0 |
| `WeaponLootNew` | 0.6 | 0.8 | 0.4 | 0.4 |
| `RangedWeaponLootNew` | 1.2 | 1.2 | 0.6 | 0.4 |
| `AmmoLootNew` | 0.6 | 0.6 | 0.2 | 0.4 |
| `MechanicsLootNew` | 0.6 | 0.6 | 0.6 | 0.6 |
| `OtherLootNew` | 0.8 | 0.8 | 0.4 | 1.0 |
| `ClothingLootNew` | 0.6 | 0.6 | 0.6 | 0.6 |
| `ContainerLootNew` | 0.6 | 0.6 | 0.4 | 0.6 |
| `KeyLootNew` | 0.4 | 0.6 | 0.4 | 0.6 |
| `MediaLootNew` | 0.6 | 1.2 | 0.4 | 2.0 |
| `MementoLootNew` | 0.6 | 0.6 | 0.6 | 0.6 |
| `CookwareLootNew` | 0.6 | 2.0 | 0.6 | 2.0 |
| `MaterialLootNew` | 0.6 | 0.6 | 0.6 | 3.0 |
| `FarmingLootNew` | 0.6 | 0.6 | 0.6 | 2.0 |
| `ToolLootNew` | 0.6 | 1.0 | 0.4 | 2.0 |
| `RollsMultiplier` | 1.0 | 1.0 | 1.0 | 1.0 |
| `ZombiePopLootEffect` | 0 | 0 | 10 | 0 |
| `GeneratorSpawning` | 4 | 5 | 2 | 4 |
| Six `*LootFactor` | 0.05 / 0.2 / 0.6 / 1.0 / 2.0 / 3.0 in every preset | | | |

**Notes for a scaling rule**

- The presets do not scale the categories uniformly. Each preset picks values by theme: Extinction lowers most categories to about 0.67× default (0.4 vs 0.6), while Rising raises crafting categories to 2-3 and lowers weapons.
- The game has no "global loot" driver. The page can add one, for example a global factor that multiplies every `*LootNew` and clamps to [0, 4].
- The shipped files never change the rarity factors. Scaling them has no effect on category loot.

---

## 4. Loot over time (already-looted and diminishing loot)

**Fields**: `MaximumLooted`, `DaysUntilMaximumLooted`, `RuralLooted`, `MaximumDiminishedLoot`, `DaysUntilMaximumDiminishedLoot`, `MaximumLootedBuildingRooms`, `TimeSinceApo`.

**How the game uses them (verified, `SandboxOptions.java` `getCurrentLootedChance` and `getCurrentDiminishedLootPercentage`)**

- Both ramp linearly:

  ```
  current = Max × min(days, DaysUntilMax) / DaysUntilMax
  ```

  - `days` is `GameTime.getWorldAgeDaysSinceBegin()`. That value is world hours ÷ 24 **plus (TimeSinceApo − 1) × 30**, so `TimeSinceApo` moves the start of both ramps forward.
  - If DaysUntilMax is 0 or less, the value starts at Max.
- Rural squares multiply the value by `(int)RuralLooted`. The cast to `int` truncates, so the default `0.5` becomes 0. For looted-building chance, the result is then clamped to at least 1. **[as decompiled, possibly a game bug]**
- "Rich" zones multiply the looted chance by 1.5.
- The diminished percentage feeds the loot formula in group 3 as `(1 − pct/100)`.

**Presets**

| Field | Apocalypse | Outbreak | Extinction | Rising |
|---|---|---|---|---|
| `MaximumLooted` | 25 | 25 | 50 | 0 |
| `DaysUntilMaximumLooted` | 90 | 90 | 60 | 90 |
| Looted %/day | 0.28 | 0.28 | 0.83 | 0 |
| `RuralLooted` | 0.5 | 0.5 | 1.0 | 0.5 |
| `MaximumDiminishedLoot` | 20 | 20 | 0 | 20 |
| `DaysUntilMaximumDiminishedLoot` | 3650 | 3650 | 1825 | 3650 |
| `MaximumLootedBuildingRooms` | 50 | 50 | 50 | 50 |

UI label ladders (`ServerSettingsScreen.lua`):

| Field | Insane | Very High | High | Normal/Medium | Low | None |
|---|---|---|---|---|---|---|
| MaximumLooted | 200 | 150 | 100 | 50 | 25 | 0 |
| RuralLooted | 2.0 | 1.5 | 1.0 | 0.5 | 0.25 | 0.0 |
| MaximumDiminishedLoot | 100 | 80 | 60 | 40 | 20 | 0 |

**Note for a scaling rule**: each Max/DaysUntil pair is a real pair, because the rate is Max ÷ Days. When one of them changes, a rule that keeps the rate constant copies the game's maths.

---

## 5. Loot respawn

**Fields**: `HoursForLootRespawn`, `SeenHoursPreventLootRespawn`, `MaxItemsForLootRespawn`, `ConstructionPreventsLootRespawn`.

**How the game uses them (verified, `LootRespawn.java`)**

- `HoursForLootRespawn` is the master switch: 0 means no respawn.
- The other three only add conditions:
  - Containers holding at least `MaxItemsForLootRespawn` items do not respawn.
  - Zones seen within `SeenHoursPreventLootRespawn` hours do not respawn.
  - When `ConstructionPreventsLootRespawn` is on, barricaded or built-in buildings do not respawn.
- All values are in in-game hours.

**Presets**: every B42 preset has 0 / 0 / 5 / true, so loot respawn is off.

**Note**: this is a gating group, not a ratio group. When the driver is 0, the followers do nothing. The presets give no ratios to copy.

---

## 6. Zombie lore gates

**Fields**: `ZombieLore.Speed` with `ZombieLore.SprinterPercentage`, and `ZombieLore.Cognition` with `ZombieLore.DoorOpeningPercentage`.

**How the game uses them (verified, `IsoZombie.java`)**

- `determineZombieSpeed`: if `Speed == 4` (Random), the game uses `SprinterPercentage`. Otherwise it ignores it. A zombie becomes a sprinter with that percent chance. If not, it is a fast shambler or a shambler, 50/50.
- `DoZombieStats`: if `Cognition == 4` (Random), the game uses `DoorOpeningPercentage`. Otherwise it ignores it.
- Inactive zombies (from `ActiveOnly`) always use speed 3.
- Label ladder for both percentages (`ServerSettingsScreen.lua`): Insane 100, Very High 90, High 50, Normal 33, Low 6, None 0.

**Presets**

| Field | Apocalypse | Outbreak | Extinction | Rising | SixMonthsLater |
|---|---|---|---|---|---|
| `Speed` | 4 (Random) | 4 | 4 | 3 (Shamblers) | 2 |
| `SprinterPercentage` | 0 | 0 | 6 | 0 | - |
| `Cognition` | 3 | 3 | 4 (Random) | 3 | 2 |
| `DoorOpeningPercentage` | 0 | 0 | 10 | 0 | - |
| `Strength` / `Toughness` | 2 / 4 | 2 / 4 | 1 / 1 | 3 / 3 | 3 / 2 |
| `Sight` / `Hearing` / `Memory` | 5 / 5 / 2 | 5 / 5 / 2 | 2 / 2 / 1 | 2 / 3 / 3 | 2 / 2 / 2 |
| `DisableFakeDead` | 1 | 1 | 2 | 3 | 1 |
| `FenceThumpersRequired` | 25 | 25 | 20 | 25 | 50 |

Apocalypse and Outbreak use Speed=Random with 0% sprinters, which plays as all shamblers and fast shamblers.

**Note for a scaling rule**: these are gates, not ratios. Recommendation: unless its gate enum is 4, show the percentage as inactive. The other lore fields are independent enums, and the game code has no ratio between them.

---

## 7. Utilities shutoff, start offset and spoilage

**Fields**: `WaterShut`, `ElecShut`, `AlarmDecay` (enums), `WaterShutModifier`, `ElecShutModifier`, `AlarmDecayModifier` (integer days), `TimeSinceApo`, `FoodRotSpeed`, `FridgeFactor`, `DaysForRottenFoodRemoval`, `LightBulbLifespan`, `GeneratorFuelConsumption`.

**How the game uses them (verified)**

- **Enum to day count**: the enum is turned into a random day count in `SandboxOptions.randomWaterShut` and `randomElectricityShut`:

  | ElecShut | Days |
  |---|---|
  | 1 Instant | −1 |
  | 2 | 14-30 |
  | 3 | 14-60 |
  | 4 | 14-180 |
  | 5 | 14-360 |
  | 6 | 14-1800 |
  | 7 | 60-180 |
  | 8 | 180-360 |
  | 9 Disabled | MAX_INT |

  `WaterShut` uses the same table but starts at 0 instead of 14.
- **Only the single-player UI rolls those days**: `SandboxOptions.lua:946-953`, and `MainScreen.setSandboxPreset`. If the Modifier still equals its default of 14, `setSandboxPreset` re-rolls it. The jar scan finds no other Java caller. **On a dedicated server reading `_SandboxVars.lua`, the `*Modifier` days are what count**, and `WaterShut`/`ElecShut` are only read in `SandboxOptions`.
- `AlarmDecay` is the exception: At world creation, `IsoMetaGrid` rolls `randomAlarmDecay(AlarmDecay)` for each building. So this enum does matter. `AlarmDecayModifier` is read only in `SandboxOptions`.
- **Shutoff comparison**: power and water are compared with `getWorldAgeDaysSinceBegin()`, which includes `(TimeSinceApo − 1) × 30`:
  - `SandboxOptions.doesPowerGridExist` uses `≤ ElecShutModifier`.
  - `IsoObject` (~2544) uses `>= WaterShutModifier` to mean "no water".
  - `ISButtonPrompt.lua:520` does the same comparison.

  So **if `TimeSinceApo` is 2 or more (30+ days), the default 14-day Modifiers have already passed at the start of play**. `-1` means already off.
- **Food spoilage**: `Food.updateAge` works in in-game hours.
  - Fridge protection lasts until `ElecShutModifier × 24` hours.
  - `FridgeFactor` multiplies age gain while cooled: 1 → 0.4, 2 → 0.3, 3 → 0.2, 4 → 0.1, 5 → 0.03, 6 → 0.
  - `FoodRotSpeed` multiplies all aging: 1 → 1.7, 2 → 1.4, 3 → 1.0, 4 → 0.7, 5 → 0.4.
  - `setAutoAge` (pre-aged world food) uses `ElecShutModifier` days and the world age, which includes TimeSinceApo.
- **Other things that read ElecShutModifier or TimeSinceApo**:
  - `IsoLightSwitch`: bulb burn time starts from `ElecShutModifier` days.
  - `ErosionMain`: TimeSinceApo pre-ages erosion toward 100%.
  - `IsoChunk` / `IsoGridSquare`: TimeSinceApo sets corpse and skeleton chance.
  - `ZomboidRadio`: broadcast day offset is TimeSinceApo × 30.5 days.

**Presets**

| Field | Apocalypse | Outbreak | Extinction | Rising | SixMonthsLater |
|---|---|---|---|---|---|
| `TimeSinceApo` | 1 | 1 | 1 | 1 | 7 (≈180 days) |
| `WaterShut` | 2 (0-30 d) | 3 (0-60 d) | 2 | 3 | 1 (Instant) |
| `ElecShut` | 2 (14-30 d) | 3 (14-60 d) | 2 | 3 | 1 |
| `WaterShutModifier` | 14 | 14 | 14 | 14 | −1 |
| `ElecShutModifier` | 14 | 14 | 14 | 14 | −1 |
| `AlarmDecay` / `AlarmDecayModifier` | 2 / 14 | 2 / 14 | 2 / 14 | 2 / 14 | - |
| `FoodRotSpeed` | 3 | 3 | 3 | 3 | 3 |
| `FridgeFactor` | 3 | 4 | 3 | 3 | 3 |
| `LightBulbLifespan` | 2.0 | 2.0 | 1.0 | 3.0 | - |
| `GeneratorFuelConsumption` | 0.1 | 0.1 | 0.1 | 0.1 | 0.1 |

Every B42 preset stores the default Modifier of 14 whatever the enum says, because the single-player client is expected to re-roll it.

**Notes for a scaling rule**

- For a server file, the real link is **`ElecShut` → `ElecShutModifier`** (and the same for water). Recommendation: pick a day inside the enum's range, because the server never does.
- Separately, **`TimeSinceApo` limits the Modifiers**: values ≤ (TimeSinceApo − 1) × 30 mean the utility is already off.

---

## 8. Day length (not a game-linked group)

**Fields**: `DayLength` (enum 1-27), `NightLength`.

**How the game uses them (verified)**

- `getDayLengthMinutes`: 1 → 15, 2 → 30, 3 → 60, 4 → 90 real minutes, then (value − 3) × 60. That value sets `GameTime.setMinutesPerDay`.
- Every time-based field above is counted in **in-game** hours or days:
  - food age (`Food.updateAge`)
  - generator fuel per in-game hour (`IsoGenerator`, and the help text says "per in-game hour")
  - shutoff days
  - loot respawn hours
  - zombie respawn hours
  - corpse removal hours
  - rat and looted ramps in days
- So changing `DayLength` does not change any of these in game-time terms. They only take more or less **real** time.
- The one odd case found: frozen-food thaw in `Food.setAutoAge` scales with `1440 / getMinutesPerDay()`.
- **[inferred]** The game has no follower for DayLength. A "keep real-time duration constant" rescale (for example, shorter days raise shutoff days) is a feature the page can add. The game does not have one. The presets give no ratios, because every B42 preset uses `DayLength = 4` (90 min).

---

## Summary for the page

| Group | Real link in the game | Kind | Ratios from presets | Confidence |
|---|---|---|---|---|
| Population (`Zombies` → `PopulationMultiplier`) | UI lookup table | label → value | table, not a ratio | High (Lua) |
| Population Start/Peak/PeakDay | native multiplier on base | multiplicative, already scales | Peak ÷ Start 1.0-1.5 | Medium (help text plus forums, native code) |
| Respawn (`ZombieRespawn` → 3 numbers) | UI lookup table | label → triplet | table, Rising does not match | High |
| Migration (`ZombieMigrate` → `RedistributeHours`) | UI 12/0 | gate | Rising uses 18 | High |
| Loot categories (`*LootNew`) | direct multiplier on chance | independent | chosen per theme, no common ratio | High (decompiled) |
| Rarity factors (`*LootFactor`) | only `GeneratorSpawning` enum | ladder bounds | constant in all presets | High (decompiled) |
| Looted / diminished ramps | Max ÷ DaysUntil, plus TimeSinceApo | rate pair | see table | High (decompiled) |
| Loot respawn | `HoursForLootRespawn` = 0 disables the rest | gate | all off | High |
| Lore gates (Speed/Cognition = 4) | Random enables the percentage | gate | Extinction 6% / 10% | High (decompiled) |
| Shutoff enum → Modifier days | single-player UI only, server uses the Modifier | label → random range | presets keep 14 | High |
| TimeSinceApo × shutoff / erosion / loot | world-age offset of (n − 1) × 30 days | additive offset | only SixMonthsLater changes it | High |
| DayLength | none, everything is in game time | none | DayLength = 4 everywhere | High (that there is none) |

## Open points

- The shape of the population ramp from Start to Peak is in native code. If the page needs to show it, test it in game with the debug population map.
- Before the page warns about the `(int)RuralLooted` truncation, confirm it in game.
- The help text says Insane = 3.0 for Start/Peak, but the code uses 4.0.
