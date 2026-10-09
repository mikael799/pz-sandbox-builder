# B42 sandbox file schema

Answers `issues/01-b42-sandbox-schema.md`.

## Version and method

- **Game build:** 42.21.0, revision `4a0e9546ec` (`C:\Users\Mikael\Zomboid\version.txt`). The Steam client is at `E:\Steam\steamapps\common\ProjectZomboid`. The dedicated server at `E:\Steam\steamapps\common\Project Zomboid Dedicated Server` has an identical `zombie/SandboxOptions.class` (same MD5) and identical preset files, so this data applies to both.
- **Sandbox file version:** `SANDBOX_VERSION = 6` (a private constant in `zombie.SandboxOptions`). `FIRST_YEAR = 1993`.
- **Method:** the game defines the option list in Java, not in a text file. A small reflection program loaded the game's own `projectzomboid.jar` and created a `SandboxOptions` object. For each option, the program read the name, type, min, max and default. It also read the enum labels and the tooltip (EN, from the game's `Translator`). It also read each option's effective value in every built-in preset (`loadGameFile`, the same call the UI uses). The program pointed the game's cache directory at a scratch folder, so it changed no game files.
- **Tabs and order** come from the `SettingsTable` "Sandbox" group in `media/lua/client/OptionScreens/ServerSettingsScreen.lua` (lines ~4500-5080). Tab names and section titles come from `media/lua/shared/Translate/EN/Sandbox.json` (`Sandbox_<page>`, `Sandbox_Title_<title>`).
- **The file format** comes from the game's own writer: `SandboxOptions.saveServerLuaFile("test")`. Its output is saved next to this note as [`b42-default_SandboxVars.lua`](b42-default_SandboxVars.lua). It is a byte-exact default sandbox file, the same as the server writes it.
- `C:\Users\Mikael\Zomboid\Server` and `Sandbox Presets` are empty, so there were no real server files to compare against.

The data for code is in [`b42-sandbox-schema.json`](b42-sandbox-schema.json). Each option has fields for the key, type, range, default and UI location. `enum` holds the labels for values 1..n. `presets` holds the effective value for each preset. `advancedCombo` is there only when the UI has one.

## Counts

- 269 options. Types: 96 double, 87 enum, 45 boolean, 39 integer, 2 string.
- Nesting: 183 options are at the top level. The rest sit one level down, in nested tables: `ZombieLore` (29), `ZombieConfig` (15), `MultiplierConfig` (37), `Map` (4), `Basement` (1). No table goes deeper.
- 9 tabs, in this order: Time, Zombie, Loot, World, Nature, Meta, Character, Vehicles, Livestock.
- 12 options are in the file but have no row in `SettingsTable`, so the UI does not show them: `StartYear`, `AlarmDecayModifier`, `InsaneLootFactor`, `ExtremeLootFactor`, `RareLootFactor`, `NormalLootFactor`, `CommonLootFactor`, `AbundantLootFactor`, `Farming`, `PlantAbundance`, `NightLength`, `AnimalMetaStatsModifier`. The server file still writes them.

## Types

| Java class (`zombie.SandboxOptions$...`) | `getType()` | In the file | Notes |
|---|---|---|---|
| `BooleanSandboxOption` | boolean | `true` / `false` | |
| `IntegerSandboxOption` | integer | `25` | has min/max |
| `DoubleSandboxOption` | double | `0.6`, `1.0` | always at least one decimal, has min/max |
| `EnumSandboxOption`, `StrongEnumSandboxOption` | enum | `4` | an index from 1 to n. Labels are `Sandbox_<translation>_option<k>` in Sandbox.json |
| `StringSandboxOption` | string | `"..."` | only `LootItemRemovalList` and `WorldItemRemovalList` (comma-separated item types) |

Special enums:

- `StartYear`: value k means year `1993 + k - 1`. This build has only 1 value.
- `StartDay`: value k means day k (1..31).
- `TimeSinceApo`: the labels are month counts. Value 1 means 0 months.

## File format

This comes from the game's own writer (see `b42-default_SandboxVars.lua`):

```lua
SandboxVars = {
    VERSION = 6,
    -- <tooltip text> Default = <label>
    -- 1 = Insane
    -- 2 = Very High
    ...
    Zombies = 4,
    -- <tooltip> Min: 0.00 Max: 4.00 Default: 0.60
    WeaponLootNew = 0.6,
    ...
    ZombieLore = {
        -- How fast zombies move. Default = Random
        -- 1 = Sprinters
        ...
        Speed = 4,
    },
}
```

- The file is one global assignment, `SandboxVars = { ... }`. The first key is `VERSION = 6`.
- The 183 top-level keys come next, in the order they are defined. The nested tables follow in this order: `Basement`, `Map`, `ZombieLore`, `ZombieConfig`, `MultiplierConfig`.
- The indent is 4 spaces, or 8 inside a nested table. Every entry ends with `,`. This includes the last entry and each closing `},`.
- Each key has `-- ` comment lines above it. First comes the tooltip, with each newline as a new `--` line. For an enum, one `-- k = Label` line per value follows. For an integer or a double, the line ends with `Min: x Max: y Default: z` (doubles with 2 decimals). Some keys have no comment (for example `StartYear` and `MultiplierConfig.Pottery`). The game generates the comments. On load, the game ignores them.
- Line endings are CRLF. The text is ASCII.
- To load the file, the server runs it as Lua (`loadServerLuaFile`) and reads the `SandboxVars` table. For a file from an older version, `VERSION` controls the upgrade (`upgradeOptionName` / `upgradeLuaTable`). The game does not write back keys it does not know.
- The built-in preset files (`media/lua/shared/Sandbox/<Name>.lua`) use a different shape: `return { Version = 6, ... }`, with no comments and no comma after the last entry. `SixMonthsLater.lua` uses `VERSION = 5`. `SandboxVars.lua` in the same folder holds `SandboxVars = require "Sandbox/Apocalypse"`, so Apocalypse is the base default.

## Presets

The built-in presets, in the order the UI lists them: Apocalypse, Outbreak, Extinction, Rising, SixMonthsLater (`loadPresets` in `SandboxOptions.lua`). User presets are in `Zomboid/Sandbox Presets/`, and the game loads them with `loadPresetFile`.

- Apocalypse equals the Java defaults for all 269 options.
- `SixMonthsLater.lua` is a partial `VERSION = 5` file (139 lines). A key that is not in the file keeps its Java default. On load, the game upgrades the file. The table shows the effective values after that load.
- The table lists only the keys where at least one preset differs from the default. Bold means "differs from the default". All other keys are equal to the default in all five presets. The JSON has every key's value for every preset.

| Key path | Default | Apocalypse | Outbreak | Extinction | Rising | SixMonthsLater |
|---|---|---|---|---|---|---|
| `DayLength` | 4 | 4 | 4 | 4 | 4 | **3** |
| `TimeSinceApo` | 1 | 1 | 1 | 1 | 1 | **7** |
| `StartMonth` | 7 | 7 | 7 | 7 | 7 | **12** |
| `Zombies` | 4 | 4 | 4 | **3** | **5** | **1** |
| `ZombieRespawn` | 4 | 4 | 4 | **2** | **3** | 4 |
| `ZombieLore.Speed` | 4 | 4 | 4 | 4 | **3** | **2** |
| `ZombieLore.SprinterPercentage` | 0 | 0 | 0 | **6** | 0 | 0 |
| `ZombieLore.Strength` | 2 | 2 | 2 | **1** | **3** | **3** |
| `ZombieLore.Toughness` | 4 | 4 | 4 | **1** | **3** | **2** |
| `ZombieLore.Cognition` | 3 | 3 | 3 | **4** | 3 | **2** |
| `ZombieLore.DoorOpeningPercentage` | 0 | 0 | 0 | **10** | 0 | 0 |
| `ZombieLore.CrawlUnderVehicle` | 5 | 5 | 5 | **6** | 5 | 5 |
| `ZombieLore.Memory` | 2 | 2 | 2 | **1** | **3** | 2 |
| `ZombieLore.Sight` | 5 | 5 | 5 | **2** | **2** | **2** |
| `ZombieLore.Hearing` | 5 | 5 | 5 | **2** | **3** | **2** |
| `ZombieLore.ThumpNoChasing` | false | false | false | **true** | false | **true** |
| `ZombieLore.TriggerHouseAlarm` | true | true | true | true | **false** | **false** |
| `ZombieLore.ZombiesCrawlersDragDown` | false | false | false | **true** | false | false |
| `ZombieLore.ZombiesFenceLunge` | true | true | true | true | **false** | true |
| `ZombieLore.DisableFakeDead` | 1 | 1 | 1 | **2** | **3** | 1 |
| `ZombieLore.ZombiesArmorFactor` | 2.0 | 2.0 | 2.0 | 2.0 | **1.0** | 2.0 |
| `ZombieLore.ZombiesMaxDefense` | 85 | 85 | 85 | **90** | **60** | 85 |
| `ZombieLore.PlayerSpawnZombieRemoval` | 1 | 1 | 1 | **2** | 1 | 1 |
| `ZombieConfig.PopulationMultiplier` | 0.65 | 0.65 | 0.65 | **1.2** | **0.15** | **1.6** |
| `ZombieConfig.PopulationStartMultiplier` | 1.0 | 1.0 | 1.0 | **1.5** | 1.0 | **2.0** |
| `ZombieConfig.PopulationPeakMultiplier` | 1.5 | 1.5 | 1.5 | **2.0** | **1.0** | **1.0** |
| `ZombieConfig.PopulationPeakDay` | 28 | 28 | **20** | 28 | 28 | **5** |
| `ZombieConfig.RespawnHours` | 0.0 | 0.0 | 0.0 | **72.0** | **72.0** | **72.0** |
| `ZombieConfig.RespawnUnseenHours` | 0.0 | 0.0 | 0.0 | **16.0** | **16.0** | **16.0** |
| `ZombieConfig.RespawnMultiplier` | 0.0 | 0.0 | 0.0 | **0.1** | **0.1** | **0.5** |
| `ZombieConfig.RedistributeHours` | 12.0 | 12.0 | 12.0 | 12.0 | **18.0** | 12.0 |
| `ZombieConfig.FollowSoundDistance` | 100 | 100 | 100 | **200** | 100 | **300** |
| `ZombieConfig.RallyGroupSize` | 20 | 20 | 20 | **10** | 20 | **200** |
| `ZombieConfig.RallyTravelDistance` | 20 | 20 | 20 | 20 | **30** | **30** |
| `ZombieConfig.RallyGroupRadius` | 3 | 3 | 3 | 3 | **4** | **10** |
| `MaximumLooted` | 25 | 25 | 25 | **50** | **0** | 25 |
| `DaysUntilMaximumLooted` | 90 | 90 | 90 | **60** | 90 | 90 |
| `RuralLooted` | 0.5 | 0.5 | 0.5 | **1.0** | 0.5 | 0.5 |
| `MaximumDiminishedLoot` | 20 | 20 | 20 | **0** | 20 | 20 |
| `DaysUntilMaximumDiminishedLoot` | 3650 | 3650 | 3650 | **1825** | 3650 | 3650 |
| `FoodLootNew` | 0.8 | 0.8 | 0.8 | **0.4** | **0.6** | 0.8 |
| `CannedFoodLootNew` | 0.6 | 0.6 | 0.6 | **0.4** | 0.6 | 0.6 |
| `WeaponLootNew` | 0.6 | 0.6 | **0.8** | **0.4** | **0.4** | 0.6 |
| `RangedWeaponLootNew` | 1.2 | 1.2 | 1.2 | **0.6** | **0.4** | 1.2 |
| `AmmoLootNew` | 0.6 | 0.6 | 0.6 | **0.2** | **0.4** | 0.6 |
| `MedicalLootNew` | 0.6 | 0.6 | 0.6 | **0.4** | 0.6 | 0.6 |
| `SurvivalGearsLootNew` | 0.6 | 0.6 | 0.6 | **0.4** | **2.0** | 0.6 |
| `SkillBookLoot` | 0.6 | 0.6 | **1.0** | **0.4** | **0.4** | 0.6 |
| `RecipeResourceLoot` | 0.6 | 0.6 | 0.6 | **0.4** | **0.8** | 0.6 |
| `LiteratureLootNew` | 0.6 | 0.6 | **0.8** | 0.6 | 0.6 | 0.6 |
| `ContainerLootNew` | 0.6 | 0.6 | 0.6 | **0.4** | 0.6 | 0.6 |
| `KeyLootNew` | 0.4 | 0.4 | **0.6** | 0.4 | **0.6** | 0.4 |
| `MediaLootNew` | 0.6 | 0.6 | **1.2** | **0.4** | **2.0** | 0.6 |
| `CookwareLootNew` | 0.6 | 0.6 | **2.0** | 0.6 | **2.0** | 0.6 |
| `MaterialLootNew` | 0.6 | 0.6 | 0.6 | 0.6 | **3.0** | 0.6 |
| `FarmingLootNew` | 0.6 | 0.6 | 0.6 | 0.6 | **2.0** | 0.6 |
| `ToolLootNew` | 0.6 | 0.6 | **1.0** | **0.4** | **2.0** | 0.6 |
| `OtherLootNew` | 0.8 | 0.8 | 0.8 | **0.4** | **1.0** | 0.8 |
| `GeneratorSpawning` | 4 | 4 | **5** | **2** | 4 | 4 |
| `ZombiePopLootEffect` | 0 | 0 | 0 | **10** | 0 | 0 |
| `WaterShutModifier` | 14 | 14 | 14 | 14 | 14 | **-1** |
| `ElecShutModifier` | 14 | 14 | 14 | 14 | 14 | **-1** |
| `WaterShut` | 2 | 2 | **3** | 2 | **3** | **1** |
| `ElecShut` | 2 | 2 | **3** | 2 | **3** | **1** |
| `Alarm` | 4 | 4 | 4 | **5** | **2** | **1** |
| `LockedHouses` | 6 | 6 | 6 | 6 | **5** | **1** |
| `FuelStationGasMin` | 0.0 | 0.0 | **0.5** | 0.0 | **0.7** | 0.0 |
| `FuelStationGasMax` | 0.8 | 0.8 | **0.9** | **0.7** | **1.0** | 0.8 |
| `FuelStationGasEmptyChance` | 20 | 20 | 20 | **25** | **10** | 20 |
| `LightBulbLifespan` | 2.0 | 2.0 | 2.0 | **1.0** | **3.0** | 2.0 |
| `FridgeFactor` | 3 | 3 | **4** | 3 | 3 | 3 |
| `WorldItemRemovalList` | "Base.Hat, Base.Glasses, Base.Maggots, Base.Slug, Base.Slug2, Base.Snail, Base.Worm, Base.Dung_Mouse, Base.Dung_Rat" | "Base.Hat, Base.Glasses, Base.Maggots, Base.Slug, Base.Slug2, Base.Snail, Base.Worm, Base.Dung_Mouse, Base.Dung_Rat" | "Base.Hat, Base.Glasses, Base.Maggots, Base.Slug, Base.Slug2, Base.Snail, Base.Worm, Base.Dung_Mouse, Base.Dung_Rat" | "Base.Hat, Base.Glasses, Base.Maggots, Base.Slug, Base.Slug2, Base.Snail, Base.Worm, Base.Dung_Mouse, Base.Dung_Rat" | "Base.Hat, Base.Glasses, Base.Maggots, Base.Slug, Base.Slug2, Base.Snail, Base.Worm, Base.Dung_Mouse, Base.Dung_Rat" | **"Base.Hat,Base.Glasses,Base.Maggots,Base.Slug,Base.Slug2,Base.Snail,Base.Worm,Base.Dung_Mouse,Base.Dung_Rat"** |
| `MaximumFireFuelHours` | 8 | 8 | **12** | 8 | 8 | 8 |
| `NightDarkness` | 3 | 3 | 3 | **1** | 3 | 3 |
| `ErosionSpeed` | 4 | 4 | 4 | **3** | 4 | **1** |
| `FarmingSpeedNew` | 1.0 | 1.0 | **1.5** | 1.0 | 1.0 | 1.0 |
| `CompostTime` | 2 | 2 | **1** | 2 | 2 | 2 |
| `FishAbundance` | 2 | 2 | **3** | 2 | **3** | 2 |
| `NatureAbundance` | 3 | 3 | 3 | **2** | 3 | **5** |
| `PlantResilience` | 3 | 3 | **2** | **4** | 3 | 3 |
| `FarmingAmountNew` | 1.0 | 1.0 | **1.5** | 1.0 | 1.0 | 1.0 |
| `PlantGrowingSeasons` | true | true | **false** | true | true | true |
| `EnableTaintedWaterText` | true | true | true | **false** | true | true |
| `Helicopter` | 2 | 2 | 2 | **3** | **1** | 2 |
| `MetaEvent` | 2 | 2 | 2 | **3** | 2 | 2 |
| `SurvivorHouseChance` | 3 | 3 | **4** | **2** | 3 | 3 |
| `AnnotatedMapChance` | 4 | 4 | **5** | **2** | 4 | 4 |
| `DecayingCorpseHealthImpact` | 3 | 3 | 3 | **4** | 3 | 3 |
| `ZombieHealthImpact` | false | false | false | **true** | false | false |
| `ZombieLore.FenceThumpersRequired` | 25 | 25 | 25 | **20** | 25 | **50** |
| `ZombieLore.FenceDamageMultiplier` | 1.0 | 1.0 | 1.0 | **1.5** | 1.0 | 1.0 |
| `Map.AllowMiniMap` | false | false | **true** | false | **true** | false |
| `EndRegen` | 3 | 3 | **2** | 3 | 3 | 3 |
| `StarterKit` | false | false | false | false | **true** | false |
| `ConstructionBonusPoints` | 3 | 3 | **4** | 3 | **4** | 3 |
| `InjurySeverity` | 2 | 2 | **1** | **3** | **1** | 2 |
| `BoneFracture` | true | true | true | true | **false** | true |
| `MuscleStrainFactor` | 0.7 | 0.7 | **0.6** | **1.0** | 0.7 | 0.7 |
| `DiscomfortFactor` | 0.8 | 0.8 | **0.7** | **1.0** | 0.8 | 0.8 |
| `WoundInfectionFactor` | 1.0 | 1.0 | 1.0 | **2.0** | 1.0 | 1.0 |
| `ClothingDegradation` | 3 | 3 | 3 | **4** | 3 | 3 |
| `RearVulnerability` | 3 | 3 | 3 | 3 | **2** | 3 |
| `MultiHitZombies` | false | false | **true** | false | **true** | false |
| `FirearmNoiseMultiplier` | 1.0 | 1.0 | 1.0 | **1.25** | 1.0 | 1.0 |
| `FirearmJamMultiplier` | 1.0 | 1.0 | 1.0 | **1.25** | 1.0 | 1.0 |
| `FirearmMoodleMultiplier` | 1.0 | 1.0 | 1.0 | **1.25** | 1.0 | 1.0 |
| `FirearmWeatherMultiplier` | 1.0 | 1.0 | 1.0 | **1.25** | 1.0 | 1.0 |
| `LiteratureCooldown` | 45 | 45 | **30** | **90** | **90** | 45 |
| `EasyClimbing` | false | false | false | false | **true** | false |
| `MultiplierConfig.GlobalToggle` | true | true | **false** | true | true | true |
| `MultiplierConfig.Fitness` | 1.0 | 1.0 | **1.2** | 1.0 | 1.0 | 1.0 |
| `MultiplierConfig.Strength` | 1.0 | 1.0 | **1.2** | 1.0 | 1.0 | 1.0 |
| `MultiplierConfig.Sprinting` | 1.0 | 1.0 | **1.2** | 1.0 | 1.0 | 1.0 |
| `MultiplierConfig.Lightfoot` | 1.0 | 1.0 | **1.2** | 1.0 | 1.0 | 1.0 |
| `MultiplierConfig.Maintenance` | 1.0 | 1.0 | **1.2** | 1.0 | 1.0 | 1.0 |
| `MultiplierConfig.Farming` | 1.0 | 1.0 | **1.2** | 1.0 | 1.0 | 1.0 |
| `MultiplierConfig.Husbandry` | 1.0 | 1.0 | **1.2** | 1.0 | 1.0 | 1.0 |
| `MultiplierConfig.Woodwork` | 1.0 | 1.0 | **1.2** | 1.0 | 1.0 | 1.0 |
| `MultiplierConfig.Carving` | 1.0 | 1.0 | **1.2** | 1.0 | 1.0 | 1.0 |
| `MultiplierConfig.Cooking` | 1.0 | 1.0 | **1.2** | 1.0 | 1.0 | 1.0 |
| `MultiplierConfig.Electricity` | 1.0 | 1.0 | **1.2** | 1.0 | 1.0 | 1.0 |
| `MultiplierConfig.Doctor` | 1.0 | 1.0 | **1.5** | 1.0 | 1.0 | 1.0 |
| `MultiplierConfig.FlintKnapping` | 1.0 | 1.0 | **1.2** | 1.0 | 1.0 | 1.0 |
| `MultiplierConfig.Masonry` | 1.0 | 1.0 | **1.2** | 1.0 | 1.0 | 1.0 |
| `MultiplierConfig.Mechanics` | 1.0 | 1.0 | **1.4** | 1.0 | 1.0 | 1.0 |
| `MultiplierConfig.Blacksmith` | 1.0 | 1.0 | **1.2** | 1.0 | 1.0 | 1.0 |
| `MultiplierConfig.Pottery` | 1.0 | 1.0 | **1.2** | 1.0 | 1.0 | 1.0 |
| `MultiplierConfig.Tailoring` | 1.0 | 1.0 | **1.4** | 1.0 | 1.0 | 1.0 |
| `MultiplierConfig.MetalWelding` | 1.0 | 1.0 | **1.4** | 1.0 | 1.0 | 1.0 |
| `MultiplierConfig.Fishing` | 1.0 | 1.0 | **1.2** | 1.0 | 1.0 | 1.0 |
| `MultiplierConfig.PlantScavenging` | 1.0 | 1.0 | **1.2** | 1.0 | 1.0 | 1.0 |
| `MultiplierConfig.Tracking` | 1.0 | 1.0 | **1.2** | 1.0 | 1.0 | 1.0 |
| `MultiplierConfig.Trapping` | 1.0 | 1.0 | **1.2** | 1.0 | 1.0 | 1.0 |
| `MultiplierConfig.Butchering` | 1.0 | 1.0 | **1.2** | 1.0 | 1.0 | 1.0 |
| `MultiplierConfig.Glassmaking` | 1.0 | 1.0 | **1.2** | 1.0 | 1.0 | 1.0 |
| `RecentlySurvivorVehicles` | 2 | 2 | **3** | 2 | **3** | 2 |
| `CarSpawnRate` | 3 | 3 | **4** | 3 | **4** | 3 |
| `ChanceHasGas` | 2 | 2 | 2 | **1** | 2 | **1** |
| `InitialGas` | 2 | 2 | **3** | 2 | **3** | 2 |
| `CarGasConsumption` | 1.0 | 1.0 | 1.0 | 1.0 | **0.6** | 1.0 |
| `LockedCar` | 4 | 4 | **3** | **6** | **3** | **1** |
| `CarGeneralCondition` | 3 | 3 | 3 | **2** | 3 | **1** |
| `CarAlarm` | 3 | 3 | 3 | **4** | 3 | **1** |
| `AnimalPregnancyTime` | 4 | 4 | **3** | 4 | **3** | 4 |
| `AnimalEggHatch` | 4 | 4 | **3** | 4 | 4 | 4 |
| `AnimalAgeModifier` | 4 | 4 | **3** | 4 | 4 | 4 |
| `AnimalMilkIncModifier` | 4 | 4 | **3** | 4 | 4 | 4 |
| `AnimalWoolIncModifier` | 4 | 4 | **3** | 4 | 4 | 4 |
| `AnimalRanchChance` | 5 | 5 | **6** | **4** | **6** | 5 |
| `AnimalMetaPredator` | false | false | false | **true** | false | false |
| `AnimalMatingSeason` | true | true | **false** | true | true | true |
| `AnimalSoundAttractZombies` | true | true | true | true | **false** | true |
| `AnimalTrackChance` | 4 | 4 | **5** | 4 | 4 | 4 |


## Advanced combos (UI presets for numeric fields)

Some numeric fields have a combo box in the UI, so you can choose a named level instead of typing a number. `SettingsTable` calls this `advancedCombo`, and the values come from `SettingsTable` and `media/lua/shared/defines.lua`. The combo only helps you pick a value. The file stores the number only. This matters for the linked-group work.

- `Zombies` (enum) drives `ZombieConfig.PopulationMultiplier`. When `Zombies` changes, the UI sets the multiplier to `ZombiePopulationMultiplierTable[Zombies]`, which is {2.5, 1.6, 1.2, 0.65, 0.15, 0.0}. See `SandboxOptions.lua:759`, `ServerSettingsScreen.lua:2737` and `ISServerSandboxOptionsUI.lua:680`.
- The tooltips for `PopulationStartMultiplier` and `PopulationPeakMultiplier` say "Insane = 3.0". The combo values in `defines.lua` say 4.0, and the UI writes the combo value.

| Key path | Advanced combo (label = value) |
|---|---|
| `ZombieLore.SprinterPercentage` | Insane=100; Very High=90; High=50; Normal=33; Low=6; None=0 |
| `ZombieLore.DoorOpeningPercentage` | Insane=100; Very High=90; High=50; Normal=33; Low=6; None=0 |
| `ZombieConfig.PopulationMultiplier` | Insane=2.5; Very High=1.6; High=1.2; Normal=0.65; Low=0.15; None=0.0 |
| `ZombieConfig.PopulationStartMultiplier` | Insane=4.0; Very High=2.0; High=1.5; Normal=1.0; Low=0.5; None=0.0 |
| `ZombieConfig.PopulationPeakMultiplier` | Insane=4.0; Very High=2.0; High=1.5; Normal=1.0; Low=0.5; None=0.0 |
| `MaximumLooted` | Insane=200; Very High=150; High=100; Normal=50; Low=25; None=0 |
| `RuralLooted` | Insane=2.0; Very High=1.5; High=1.0; Normal=0.5; Low=0.25; None=0.0 |
| `MaximumDiminishedLoot` | Insane=100; Very High=80; High=60; Medium=40; Low=20; None=0 |
| `FoodLootNew` | None=0.0; Insane=0.05; Extremely Rare=0.2; Rare=0.4; Normal=0.6; Common=2; Abundant=3 |
| `CannedFoodLootNew` | None=0.0; Insane=0.05; Extremely Rare=0.2; Rare=0.4; Normal=0.6; Common=2; Abundant=3 |
| `WeaponLootNew` | None=0.0; Insane=0.05; Extremely Rare=0.2; Rare=0.4; Normal=0.6; Common=2; Abundant=3 |
| `RangedWeaponLootNew` | None=0.0; Insane=0.05; Extremely Rare=0.2; Rare=0.4; Normal=0.6; Common=2; Abundant=3 |
| `AmmoLootNew` | None=0.0; Insane=0.05; Extremely Rare=0.2; Rare=0.4; Normal=0.6; Common=2; Abundant=3 |
| `MedicalLootNew` | None=0.0; Insane=0.05; Extremely Rare=0.2; Rare=0.4; Normal=0.6; Common=2; Abundant=3 |
| `SurvivalGearsLootNew` | None=0.0; Insane=0.05; Extremely Rare=0.2; Rare=0.4; Normal=0.6; Common=2; Abundant=3 |
| `MechanicsLootNew` | None=0.0; Insane=0.05; Extremely Rare=0.2; Rare=0.4; Normal=0.6; Common=2; Abundant=3 |
| `SkillBookLoot` | None=0.0; Insane=0.05; Extremely Rare=0.2; Rare=0.4; Normal=0.6; Common=2; Abundant=3 |
| `RecipeResourceLoot` | None=0.0; Insane=0.05; Extremely Rare=0.2; Rare=0.4; Normal=0.6; Common=2; Abundant=3 |
| `LiteratureLootNew` | None=0.0; Insane=0.05; Extremely Rare=0.2; Rare=0.4; Normal=0.6; Common=2; Abundant=3 |
| `ClothingLootNew` | None=0.0; Insane=0.05; Extremely Rare=0.2; Rare=0.4; Normal=0.6; Common=2; Abundant=3 |
| `ContainerLootNew` | None=0.0; Insane=0.05; Extremely Rare=0.2; Rare=0.4; Normal=0.6; Common=2; Abundant=3 |
| `KeyLootNew` | None=0.0; Insane=0.05; Extremely Rare=0.2; Rare=0.4; Normal=0.6; Common=2; Abundant=3 |
| `MediaLootNew` | None=0.0; Insane=0.05; Extremely Rare=0.2; Rare=0.4; Normal=0.6; Common=2; Abundant=3 |
| `MementoLootNew` | None=0.0; Insane=0.05; Extremely Rare=0.2; Rare=0.4; Normal=0.6; Common=2; Abundant=3 |
| `CookwareLootNew` | None=0.0; Insane=0.05; Extremely Rare=0.2; Rare=0.4; Normal=0.6; Common=2; Abundant=3 |
| `MaterialLootNew` | None=0.0; Insane=0.05; Extremely Rare=0.2; Rare=0.4; Normal=0.6; Common=2; Abundant=3 |
| `FarmingLootNew` | None=0.0; Insane=0.05; Extremely Rare=0.2; Rare=0.4; Normal=0.6; Common=2; Abundant=3 |
| `ToolLootNew` | None=0.0; Insane=0.05; Extremely Rare=0.2; Rare=0.4; Normal=0.6; Common=2; Abundant=3 |
| `OtherLootNew` | None=0.0; Insane=0.05; Extremely Rare=0.2; Rare=0.4; Normal=0.6; Common=2; Abundant=3 |
| `ZombiePopLootEffect` | None=0; Normal=10; Abundant=20 |
| `FuelStationGasMin` | Empty=0.0; Super Low=0.01; Very Low=0.1; Low=0.5; Normal=0.7; High=0.8; Very High=0.9; Full=1.0 |
| `FuelStationGasMax` | Empty=0.0; Super Low=0.01; Very Low=0.1; Low=0.5; Normal=0.7; High=0.8; Very High=0.9; Full=1.0 |

## Full key table

The rows follow the in-game tab order. `Time 1.3` means tab 1, row 3. Options that are not in the UI come last. For integers and doubles, min and max are the value range. For enums, they are 1..n. Section is the sub-heading inside the tab (`Sandbox_Title_*`). It applies to all rows below it, up to the next sub-heading.

| Tab # | Key path | Type | Min | Max | Default | Enum labels (1..n) | Section |
|---|---|---|---|---|---|---|---|
| Time 1.1 | `DayLength` | enum | 1 | 27 | 4 | 1=15 Minutes; 2=30 Minutes; 3=1 Hour; 4=1 Hour, 30 Minutes; 5=2 Hours; 6=3 Hours; 7=4 Hours; 8=5 Hours; 9=6 Hours; 10=7 Hours; 11=8 Hours; 12=9 Hours; 13=10 Hours; 14=11 Hours; 15=12 Hours; 16=13 Hours; 17=14 Hours; 18=15 Hours; 19=16 Hours; 20=17 Hours; 21=18 Hours; 22=19 Hours; 23=20 Hours; 24=21 Hours; 25=22 Hours; 26=23 Hours; 27=Real-time |  |
| Time 1.2 | `TimeSinceApo` | enum | 1 | 13 | 1 | 1=0; 2=1; 3=2; 4=3; 5=4; 6=5; 7=6; 8=7; 9=8; 10=9; 11=10; 12=11; 13=12 |  |
| Time 1.3 | `StartMonth` | enum | 1 | 12 | 7 | 1=January; 2=February; 3=March; 4=April; 5=May; 6=June; 7=July; 8=August; 9=September; 10=October; 11=November; 12=December |  |
| Time 1.4 | `StartDay` | enum | 1 | 31 | 9 | 1 .. 31 |  |
| Time 1.5 | `StartTime` | enum | 1 | 9 | 2 | 1=7 AM; 2=9 AM; 3=12 PM; 4=2 PM; 5=5 PM; 6=9 PM; 7=12 AM; 8=2 AM; 9=5 AM |  |
| Zombie 2.1 | `Zombies` | enum | 1 | 6 | 4 | 1=Insane; 2=Very High; 3=High; 4=Normal; 5=Low; 6=None |  |
| Zombie 2.2 | `Distribution` | enum | 1 | 2 | 1 | 1=Urban Focused; 2=Uniform |  |
| Zombie 2.3 | `ZombieVoronoiNoise` | boolean |  |  | true |  |  |
| Zombie 2.4 | `ZombieRespawn` | enum | 1 | 4 | 4 | 1=High; 2=Normal; 3=Low; 4=None |  |
| Zombie 2.5 | `ZombieMigrate` | boolean |  |  | true |  |  |
| Zombie 2.6 | `ZombieLore.Speed` | enum | 1 | 4 | 4 | 1=Sprinters; 2=Fast Shamblers; 3=Shamblers; 4=Random | Zombie Lore |
| Zombie 2.7 | `ZombieLore.SprinterPercentage` | integer | 0 | 100 | 0 |  | Zombie Lore |
| Zombie 2.8 | `ZombieLore.Strength` | enum | 1 | 4 | 2 | 1=Superhuman; 2=Normal; 3=Weak; 4=Random | Zombie Lore |
| Zombie 2.9 | `ZombieLore.Toughness` | enum | 1 | 4 | 4 | 1=Tough; 2=Normal; 3=Fragile; 4=Random | Zombie Lore |
| Zombie 2.10 | `ZombieLore.Transmission` | enum | 1 | 4 | 1 | 1=Blood and Saliva; 2=Saliva Only; 3=Everyone's Infected; 4=None | Zombie Lore |
| Zombie 2.11 | `ZombieLore.Mortality` | enum | 1 | 7 | 5 | 1=Instant; 2=0-30 Seconds; 3=0-1 Minutes; 4=0-12 Hours; 5=2-3 Days; 6=1-2 Weeks; 7=Never | Zombie Lore |
| Zombie 2.12 | `ZombieLore.Reanimate` | enum | 1 | 6 | 3 | 1=Instant; 2=0-30 Seconds; 3=0-1 Minutes; 4=0-12 Hours; 5=2-3 Days; 6=1-2 Weeks | Zombie Lore |
| Zombie 2.13 | `ZombieLore.Cognition` | enum | 1 | 4 | 3 | 1=Navigate and Use Doors; 2=Navigate; 3=Basic Navigation; 4=Random | Zombie Lore |
| Zombie 2.14 | `ZombieLore.DoorOpeningPercentage` | integer | 0 | 100 | 0 |  | Zombie Lore |
| Zombie 2.15 | `ZombieLore.CrawlUnderVehicle` | enum | 1 | 7 | 5 | 1=Crawlers Only; 2=Extremely Rare; 3=Rare; 4=Sometimes; 5=Often; 6=Very Often; 7=Always | Zombie Lore |
| Zombie 2.16 | `ZombieLore.Memory` | enum | 1 | 6 | 2 | 1=Long; 2=Normal; 3=Short; 4=None; 5=Random; 6=Random between Normal and None | Zombie Lore |
| Zombie 2.17 | `ZombieLore.Sight` | enum | 1 | 5 | 5 | 1=Eagle; 2=Normal; 3=Poor; 4=Random; 5=Random between Normal and Poor | Zombie Lore |
| Zombie 2.18 | `ZombieLore.Hearing` | enum | 1 | 5 | 5 | 1=Pinpoint; 2=Normal; 3=Poor; 4=Random; 5=Random between Normal and Poor | Zombie Lore |
| Zombie 2.19 | `ZombieLore.SpottedLogic` | boolean |  |  | true |  | Zombie Lore |
| Zombie 2.20 | `ZombieLore.ThumpNoChasing` | boolean |  |  | false |  | Zombie Lore |
| Zombie 2.21 | `ZombieLore.ThumpOnConstruction` | boolean |  |  | true |  | Zombie Lore |
| Zombie 2.22 | `ZombieLore.ActiveOnly` | enum | 1 | 3 | 1 | 1=Both; 2=Night; 3=Day | Zombie Lore |
| Zombie 2.23 | `ZombieLore.TriggerHouseAlarm` | boolean |  |  | true |  | Zombie Lore |
| Zombie 2.24 | `ZombieLore.ZombiesDragDown` | boolean |  |  | true |  | Zombie Lore |
| Zombie 2.25 | `ZombieLore.ZombiesCrawlersDragDown` | boolean |  |  | false |  | Zombie Lore |
| Zombie 2.26 | `ZombieLore.ZombiesFenceLunge` | boolean |  |  | true |  | Zombie Lore |
| Zombie 2.27 | `ZombieLore.DisableFakeDead` | enum | 1 | 3 | 1 | 1=World Zombies; 2=World and Combat Zombies; 3=Never | Zombie Lore |
| Zombie 2.28 | `ZombieLore.ZombiesArmorFactor` | double | 0.0 | 100.0 | 2.0 |  | Zombie Lore |
| Zombie 2.29 | `ZombieLore.ZombiesMaxDefense` | integer | 0 | 100 | 85 |  | Zombie Lore |
| Zombie 2.30 | `ZombieLore.ChanceOfAttachedWeapon` | integer | 0 | 100 | 6 |  | Zombie Lore |
| Zombie 2.31 | `ZombieLore.ZombiesFallDamage` | double | 0.0 | 100.0 | 1.0 |  | Zombie Lore |
| Zombie 2.32 | `ZombieLore.PlayerSpawnZombieRemoval` | enum | 1 | 4 | 1 | 1=Inside the building and around it; 2=Inside the building; 3=Inside the room; 4=Zombies can spawn anywhere | Zombie Lore |
| Zombie 2.33 | `ZombieConfig.PopulationMultiplier` | double | 0.0 | 4.0 | 0.65 |  | Advanced zombie settings |
| Zombie 2.34 | `ZombieConfig.PopulationStartMultiplier` | double | 0.0 | 4.0 | 1.0 |  | Advanced zombie settings |
| Zombie 2.35 | `ZombieConfig.PopulationPeakMultiplier` | double | 0.0 | 4.0 | 1.5 |  | Advanced zombie settings |
| Zombie 2.36 | `ZombieConfig.PopulationPeakDay` | integer | 1 | 365 | 28 |  | Advanced zombie settings |
| Zombie 2.37 | `ZombieConfig.RespawnHours` | double | 0.0 | 8760.0 | 0.0 |  | Advanced zombie settings |
| Zombie 2.38 | `ZombieConfig.RespawnUnseenHours` | double | 0.0 | 8760.0 | 0.0 |  | Advanced zombie settings |
| Zombie 2.39 | `ZombieConfig.RespawnMultiplier` | double | 0.0 | 1.0 | 0.0 |  | Advanced zombie settings |
| Zombie 2.40 | `ZombieConfig.RedistributeHours` | double | 0.0 | 8760.0 | 12.0 |  | Advanced zombie settings |
| Zombie 2.41 | `ZombieConfig.FollowSoundDistance` | integer | 10 | 1000 | 100 |  | Advanced zombie settings |
| Zombie 2.42 | `ZombieConfig.RallyGroupSize` | integer | 0 | 1000 | 20 |  | Advanced zombie settings |
| Zombie 2.43 | `ZombieConfig.RallyGroupSizeVariance` | integer | 0 | 100 | 50 |  | Advanced zombie settings |
| Zombie 2.44 | `ZombieConfig.RallyTravelDistance` | integer | 5 | 50 | 20 |  | Advanced zombie settings |
| Zombie 2.45 | `ZombieConfig.RallyGroupSeparation` | integer | 5 | 25 | 15 |  | Advanced zombie settings |
| Zombie 2.46 | `ZombieConfig.RallyGroupRadius` | integer | 1 | 10 | 3 |  | Advanced zombie settings |
| Zombie 2.47 | `ZombieConfig.ZombiesCountBeforeDelete` | integer | 0 | 5000 | 300 |  | Advanced zombie settings |
| Loot 3.1 | `HoursForLootRespawn` | integer | 0 | 2147483647 | 0 |  |  |
| Loot 3.2 | `SeenHoursPreventLootRespawn` | integer | 0 | 2147483647 | 0 |  |  |
| Loot 3.3 | `MaxItemsForLootRespawn` | integer | 0 | 2147483647 | 5 |  |  |
| Loot 3.4 | `ConstructionPreventsLootRespawn` | boolean |  |  | true |  |  |
| Loot 3.5 | `MaximumLooted` | integer | 0 | 200 | 25 |  |  |
| Loot 3.6 | `DaysUntilMaximumLooted` | integer | 0 | 3650 | 90 |  |  |
| Loot 3.7 | `RuralLooted` | double | 0.0 | 2.0 | 0.5 |  |  |
| Loot 3.8 | `MaximumDiminishedLoot` | integer | 0 | 100 | 20 |  |  |
| Loot 3.9 | `DaysUntilMaximumDiminishedLoot` | integer | 0 | 3650 | 3650 |  |  |
| Loot 3.10 | `MaximumLootedBuildingRooms` | integer | 0 | 200 | 50 |  |  |
| Loot 3.11 | `FoodLootNew` | double | 0.0 | 4.0 | 0.8 |  | Loot rarity |
| Loot 3.12 | `CannedFoodLootNew` | double | 0.0 | 4.0 | 0.6 |  | Loot rarity |
| Loot 3.13 | `WeaponLootNew` | double | 0.0 | 4.0 | 0.6 |  | Loot rarity |
| Loot 3.14 | `RangedWeaponLootNew` | double | 0.0 | 4.0 | 1.2 |  | Loot rarity |
| Loot 3.15 | `AmmoLootNew` | double | 0.0 | 4.0 | 0.6 |  | Loot rarity |
| Loot 3.16 | `MedicalLootNew` | double | 0.0 | 4.0 | 0.6 |  | Loot rarity |
| Loot 3.17 | `SurvivalGearsLootNew` | double | 0.0 | 4.0 | 0.6 |  | Loot rarity |
| Loot 3.18 | `MechanicsLootNew` | double | 0.0 | 4.0 | 0.6 |  | Loot rarity |
| Loot 3.19 | `SkillBookLoot` | double | 0.0 | 4.0 | 0.6 |  | Loot rarity |
| Loot 3.20 | `RecipeResourceLoot` | double | 0.0 | 4.0 | 0.6 |  | Loot rarity |
| Loot 3.21 | `LiteratureLootNew` | double | 0.0 | 4.0 | 0.6 |  | Loot rarity |
| Loot 3.22 | `ClothingLootNew` | double | 0.0 | 4.0 | 0.6 |  | Loot rarity |
| Loot 3.23 | `ContainerLootNew` | double | 0.0 | 4.0 | 0.6 |  | Loot rarity |
| Loot 3.24 | `KeyLootNew` | double | 0.0 | 4.0 | 0.4 |  | Loot rarity |
| Loot 3.25 | `MediaLootNew` | double | 0.0 | 4.0 | 0.6 |  | Loot rarity |
| Loot 3.26 | `MementoLootNew` | double | 0.0 | 4.0 | 0.6 |  | Loot rarity |
| Loot 3.27 | `CookwareLootNew` | double | 0.0 | 4.0 | 0.6 |  | Loot rarity |
| Loot 3.28 | `MaterialLootNew` | double | 0.0 | 4.0 | 0.6 |  | Loot rarity |
| Loot 3.29 | `FarmingLootNew` | double | 0.0 | 4.0 | 0.6 |  | Loot rarity |
| Loot 3.30 | `ToolLootNew` | double | 0.0 | 4.0 | 0.6 |  | Loot rarity |
| Loot 3.31 | `OtherLootNew` | double | 0.0 | 4.0 | 0.8 |  | Loot rarity |
| Loot 3.32 | `GeneratorSpawning` | enum | 1 | 7 | 4 | 1=None (not recommended); 2=Insanely Rare; 3=Extremely Rare; 4=Rare; 5=Normal; 6=Common; 7=Abundant | Loot rarity |
| Loot 3.33 | `LootItemRemovalList` | string |  |  | "" |  | Loot rarity |
| Loot 3.34 | `RemoveStoryLoot` | boolean |  |  | false |  | Loot rarity |
| Loot 3.35 | `RemoveZombieLoot` | boolean |  |  | false |  | Loot rarity |
| Loot 3.36 | `RollsMultiplier` | double | 0.1 | 100.0 | 1.0 |  | Loot rarity |
| Loot 3.37 | `ZombiePopLootEffect` | integer | 0 | 20 | 0 |  | Loot rarity |
| World 4.1 | `WaterShutModifier` | integer | -1 | 2147483647 | 14 |  |  |
| World 4.2 | `ElecShutModifier` | integer | -1 | 2147483647 | 14 |  |  |
| World 4.3 | `WaterShut` | enum | 1 | 9 | 2 | 1=Instant; 2=0 - 30 Days; 3=0 - 2 Months; 4=0 - 6 Months; 5=0 - 1 Year; 6=0 - 5 Years; 7=2 - 6 Months; 8=6 - 12 Months; 9=Disabled |  |
| World 4.4 | `ElecShut` | enum | 1 | 9 | 2 | 1=Instant; 2=14 - 30 Days; 3=14 Days - 2 Months; 4=14 Days - 6 Months; 5=14 Days - 1 Year; 6=14 Days - 5 Years; 7=2 - 6 Months; 8=6 - 12 Months; 9=Disabled |  |
| World 4.5 | `AlarmDecay` | enum | 1 | 6 | 2 | 1=Instant; 2=0 - 30 Days; 3=0 - 2 Months; 4=0 - 6 Months; 5=0 - 1 Year; 6=0 - 5 Years |  |
| World 4.6 | `Alarm` | enum | 1 | 6 | 4 | 1=Never; 2=Extremely Rare; 3=Rare; 4=Sometimes; 5=Often; 6=Very Often |  |
| World 4.7 | `LockedHouses` | enum | 1 | 6 | 6 | 1=Never; 2=Extremely Rare; 3=Rare; 4=Sometimes; 5=Often; 6=Very Often |  |
| World 4.8 | `FireSpread` | boolean |  |  | true |  |  |
| World 4.9 | `AllowExteriorGenerator` | boolean |  |  | true |  |  |
| World 4.10 | `GeneratorTileRange` | integer | 1 | 100 | 20 |  |  |
| World 4.11 | `GeneratorVerticalPowerRange` | integer | 1 | 15 | 3 |  |  |
| World 4.12 | `FuelStationGasInfinite` | boolean |  |  | false |  |  |
| World 4.13 | `FuelStationGasMin` | double | 0.0 | 1.0 | 0.0 |  |  |
| World 4.14 | `FuelStationGasMax` | double | 0.0 | 1.0 | 0.8 |  |  |
| World 4.15 | `FuelStationGasEmptyChance` | integer | 0 | 100 | 20 |  |  |
| World 4.16 | `LightBulbLifespan` | double | 0.0 | 1000.0 | 2.0 |  |  |
| World 4.17 | `FoodRotSpeed` | enum | 1 | 5 | 3 | 1=Very Fast; 2=Fast; 3=Normal; 4=Slow; 5=Very Slow |  |
| World 4.18 | `FridgeFactor` | enum | 1 | 6 | 3 | 1=Very Low; 2=Low; 3=Normal; 4=High; 5=Very High; 6=No decay |  |
| World 4.19 | `DaysForRottenFoodRemoval` | integer | -1 | 2147483647 | -1 |  |  |
| World 4.20 | `WorldItemRemovalList` | string |  |  | "Base.Hat, Base.Glasses, Base.Maggots, Base.Slug, Base.Slug2, Base.Snail, Base.Worm, Base.Dung_Mouse, Base.Dung_Rat" |  |  |
| World 4.21 | `HoursForWorldItemRemoval` | double | 0.0 | 2147483647.0 | 24.0 |  |  |
| World 4.22 | `ItemRemovalListBlacklistToggle` | boolean |  |  | false |  |  |
| World 4.23 | `Basement.SpawnFrequency` | enum | 1 | 7 | 4 | 1=Never; 2=Extremely Rare; 3=Rare; 4=Sometimes; 5=Often; 6=Very Often; 7=Always | Basements |
| World 4.24 | `MaximumFireFuelHours` | integer | 1 | 168 | 8 |  | Basements |
| Nature 5.1 | `NightDarkness` | enum | 1 | 4 | 3 | 1=Pitch Black; 2=Dark; 3=Normal; 4=Bright |  |
| Nature 5.2 | `Temperature` | enum | 1 | 5 | 3 | 1=Very Cold; 2=Cold; 3=Normal; 4=Hot; 5=Very Hot |  |
| Nature 5.3 | `Rain` | enum | 1 | 5 | 3 | 1=Very Dry; 2=Dry; 3=Normal; 4=Rainy; 5=Very Rainy |  |
| Nature 5.4 | `MaxFogIntensity` | enum | 1 | 4 | 1 | 1=Normal; 2=Moderate; 3=Low; 4=None |  |
| Nature 5.5 | `MaxRainFxIntensity` | enum | 1 | 3 | 1 | 1=Normal; 2=Moderate; 3=Low |  |
| Nature 5.6 | `ErosionSpeed` | enum | 1 | 5 | 4 | 1=Very Fast (20 Days); 2=Fast (50 Days); 3=Normal (100 Days); 4=Slow (200 Days); 5=Very Slow (500 Days) |  |
| Nature 5.7 | `ErosionDays` | integer | -1 | 36500 | 0 |  |  |
| Nature 5.8 | `FarmingSpeedNew` | double | 0.1 | 100.0 | 1.0 |  |  |
| Nature 5.9 | `CompostTime` | enum | 1 | 8 | 2 | 1=1 Week; 2=2 Weeks; 3=3 Weeks; 4=4 Weeks; 5=6 Weeks; 6=8 Weeks; 7=10 Weeks; 8=12 Weeks |  |
| Nature 5.10 | `FishAbundance` | enum | 1 | 5 | 2 | 1=Very Poor; 2=Poor; 3=Normal; 4=Abundant; 5=Very Abundant |  |
| Nature 5.11 | `NatureAbundance` | enum | 1 | 5 | 3 | 1=Very Poor; 2=Poor; 3=Normal; 4=Abundant; 5=Very Abundant |  |
| Nature 5.12 | `PlantResilience` | enum | 1 | 5 | 3 | 1=Very High; 2=High; 3=Normal; 4=Low; 5=Very Low |  |
| Nature 5.13 | `FarmingAmountNew` | double | 0.1 | 10.0 | 1.0 |  |  |
| Nature 5.14 | `KillInsideCrops` | boolean |  |  | true |  |  |
| Nature 5.15 | `PlantGrowingSeasons` | boolean |  |  | true |  |  |
| Nature 5.16 | `PlaceDirtAboveground` | boolean |  |  | false |  |  |
| Nature 5.17 | `EnableSnowOnGround` | boolean |  |  | true |  |  |
| Nature 5.18 | `EnableTaintedWaterText` | boolean |  |  | true |  |  |
| Nature 5.19 | `MaximumRatIndex` | integer | 0 | 50 | 25 |  |  |
| Nature 5.20 | `DaysUntilMaximumRatIndex` | integer | 0 | 365 | 90 |  |  |
| Nature 5.21 | `ClayLakeChance` | double | 0.0 | 1.0 | 0.05 |  |  |
| Nature 5.22 | `ClayRiverChance` | double | 0.0 | 1.0 | 0.05 |  |  |
| Meta 6.1 | `Helicopter` | enum | 1 | 4 | 2 | 1=Never; 2=Once; 3=Sometimes; 4=Often |  |
| Meta 6.2 | `MetaEvent` | enum | 1 | 3 | 2 | 1=Never; 2=Sometimes; 3=Often |  |
| Meta 6.3 | `SleepingEvent` | enum | 1 | 3 | 1 | 1=Never; 2=Sometimes; 3=Often |  |
| Meta 6.4 | `GeneratorFuelConsumption` | double | 0.0 | 100.0 | 0.1 |  |  |
| Meta 6.5 | `SurvivorHouseChance` | enum | 1 | 7 | 3 | 1=Never; 2=Extremely Rare; 3=Rare; 4=Sometimes; 5=Often; 6=Very Often; 7=Always Tries |  |
| Meta 6.6 | `VehicleStoryChance` | enum | 1 | 7 | 3 | 1=Never; 2=Extremely Rare; 3=Rare; 4=Sometimes; 5=Often; 6=Very Often; 7=Always Tries |  |
| Meta 6.7 | `ZoneStoryChance` | enum | 1 | 7 | 3 | 1=Never; 2=Extremely Rare; 3=Rare; 4=Sometimes; 5=Often; 6=Very Often; 7=Always Tries |  |
| Meta 6.8 | `AnnotatedMapChance` | enum | 1 | 6 | 4 | 1=Never; 2=Extremely Rare; 3=Rare; 4=Sometimes; 5=Often; 6=Very Often |  |
| Meta 6.9 | `HoursForCorpseRemoval` | double | -1.0 | 2147483647.0 | 216.0 |  |  |
| Meta 6.10 | `DecayingCorpseHealthImpact` | enum | 1 | 5 | 3 | 1=None; 2=Low; 3=Normal; 4=High; 5=Insane |  |
| Meta 6.11 | `ZombieHealthImpact` | boolean |  |  | false |  |  |
| Meta 6.12 | `BloodLevel` | enum | 1 | 5 | 3 | 1=None; 2=Low; 3=Normal; 4=High; 5=Ultra Gore |  |
| Meta 6.13 | `BloodSplatLifespanDays` | integer | 0 | 365 | 0 |  |  |
| Meta 6.14 | `MaggotSpawn` | enum | 1 | 3 | 1 | 1=In and Around Bodies; 2=In Bodies Only; 3=Never |  |
| Meta 6.15 | `MetaKnowledge` | enum | 1 | 3 | 3 | 1=Fully revealed; 2=Shown as ???; 3=Completely hidden |  |
| Meta 6.16 | `DayNightCycle` | enum | 1 | 3 | 1 | 1=Normal; 2=Endless Day; 3=Endless Night |  |
| Meta 6.17 | `ClimateCycle` | enum | 1 | 6 | 1 | 1=Normal; 2=No Weather; 3=Endless Rain; 4=Endless Storm; 5=Endless Snow; 6=Endless Blizzard |  |
| Meta 6.18 | `FogCycle` | enum | 1 | 3 | 1 | 1=Normal; 2=No Fog; 3=Endless Fog |  |
| Meta 6.19 | `ZombieLore.FenceThumpersRequired` | integer | -1 | 100 | 25 |  |  |
| Meta 6.20 | `ZombieLore.FenceDamageMultiplier` | double | 0.009999999776482582 | 100.0 | 1.0 |  |  |
| Meta 6.21 | `Map.AllowWorldMap` | boolean |  |  | true |  | In-game Map |
| Meta 6.22 | `Map.AllowMiniMap` | boolean |  |  | false |  | In-game Map |
| Meta 6.23 | `Map.MapAllKnown` | boolean |  |  | false |  | In-game Map |
| Meta 6.24 | `Map.MapNeedsLight` | boolean |  |  | true |  | In-game Map |
| Character 7.1 | `StatsDecrease` | enum | 1 | 5 | 3 | 1=Very Fast; 2=Fast; 3=Normal; 4=Slow; 5=Very Slow |  |
| Character 7.2 | `EndRegen` | enum | 1 | 5 | 3 | 1=Very Fast; 2=Fast; 3=Normal; 4=Slow; 5=Very Slow |  |
| Character 7.3 | `Nutrition` | boolean |  |  | true |  |  |
| Character 7.4 | `StarterKit` | boolean |  |  | false |  |  |
| Character 7.5 | `CharacterFreePoints` | integer | -100 | 100 | 0 |  |  |
| Character 7.6 | `ConstructionBonusPoints` | enum | 1 | 5 | 3 | 1=Very Low; 2=Low; 3=Normal; 4=High; 5=Very High |  |
| Character 7.7 | `InjurySeverity` | enum | 1 | 3 | 2 | 1=Low; 2=Normal; 3=High |  |
| Character 7.8 | `BoneFracture` | boolean |  |  | true |  |  |
| Character 7.9 | `MuscleStrainFactor` | double | 0.0 | 10.0 | 0.7 |  |  |
| Character 7.10 | `DiscomfortFactor` | double | 0.0 | 10.0 | 0.8 |  |  |
| Character 7.11 | `WoundInfectionFactor` | double | 0.0 | 10.0 | 1.0 |  |  |
| Character 7.12 | `ClothingDegradation` | enum | 1 | 4 | 3 | 1=Disabled; 2=Slow; 3=Normal; 4=Fast |  |
| Character 7.13 | `NoBlackClothes` | boolean |  |  | true |  |  |
| Character 7.14 | `RearVulnerability` | enum | 1 | 3 | 3 | 1=Low; 2=Medium; 3=High |  |
| Character 7.15 | `MultiHitZombies` | boolean |  |  | false |  |  |
| Character 7.16 | `FirearmUseDamageChance` | enum | 1 | 3 | 2 | 1=Disabled; 2=Zombies only; 3=All types of target |  |
| Character 7.17 | `FirearmNoiseMultiplier` | double | 0.2 | 2.0 | 1.0 |  |  |
| Character 7.18 | `FirearmJamMultiplier` | double | 0.0 | 10.0 | 1.0 |  |  |
| Character 7.19 | `FirearmMoodleMultiplier` | double | 0.0 | 10.0 | 1.0 |  |  |
| Character 7.20 | `FirearmWeatherMultiplier` | double | 0.0 | 10.0 | 1.0 |  |  |
| Character 7.21 | `FirearmHeadGearEffect` | boolean |  |  | true |  |  |
| Character 7.22 | `AttackBlockMovements` | boolean |  |  | true |  |  |
| Character 7.23 | `AllClothesUnlocked` | boolean |  |  | false |  |  |
| Character 7.24 | `EnablePoisoning` | enum | 1 | 3 | 1 | 1=True; 2=False; 3=Only bleach poisoning is disabled |  |
| Character 7.25 | `LiteratureCooldown` | integer | 1 | 365 | 45 |  |  |
| Character 7.26 | `NegativeTraitsPenalty` | enum | 1 | 4 | 1 | 1=None; 2=1 point penalty for every 3 negative traits selected; 3=1 point penalty for every 2 negative traits selected; 4=1 point penalty for every negative trait selected after the first |  |
| Character 7.27 | `MinutesPerPage` | double | 0.0 | 60.0 | 2.0 |  |  |
| Character 7.28 | `LevelForDismantleXPCutoff` | integer | 0 | 10 | 0 |  |  |
| Character 7.29 | `LevelForMediaXPCutoff` | integer | 0 | 10 | 3 |  |  |
| Character 7.30 | `EasyClimbing` | boolean |  |  | false |  |  |
| Character 7.31 | `SeeNotLearntRecipe` | boolean |  |  | true |  |  |
| Character 7.32 | `MultiplierConfig.Global` | double | 0.0 | 1000.0 | 1.0 |  | XP multipliers |
| Character 7.33 | `MultiplierConfig.GlobalToggle` | boolean |  |  | true |  | XP multipliers |
| Character 7.34 | `MultiplierConfig.Fitness` | double | 0.0 | 1000.0 | 1.0 |  | XP multipliers |
| Character 7.35 | `MultiplierConfig.Strength` | double | 0.0 | 1000.0 | 1.0 |  | XP multipliers |
| Character 7.36 | `MultiplierConfig.Sprinting` | double | 0.0 | 1000.0 | 1.0 |  | XP multipliers |
| Character 7.37 | `MultiplierConfig.Lightfoot` | double | 0.0 | 1000.0 | 1.0 |  | XP multipliers |
| Character 7.38 | `MultiplierConfig.Nimble` | double | 0.0 | 1000.0 | 1.0 |  | XP multipliers |
| Character 7.39 | `MultiplierConfig.Sneak` | double | 0.0 | 1000.0 | 1.0 |  | XP multipliers |
| Character 7.40 | `MultiplierConfig.Axe` | double | 0.0 | 1000.0 | 1.0 |  | XP multipliers |
| Character 7.41 | `MultiplierConfig.Blunt` | double | 0.0 | 1000.0 | 1.0 |  | XP multipliers |
| Character 7.42 | `MultiplierConfig.SmallBlunt` | double | 0.0 | 1000.0 | 1.0 |  | XP multipliers |
| Character 7.43 | `MultiplierConfig.LongBlade` | double | 0.0 | 1000.0 | 1.0 |  | XP multipliers |
| Character 7.44 | `MultiplierConfig.SmallBlade` | double | 0.0 | 1000.0 | 1.0 |  | XP multipliers |
| Character 7.45 | `MultiplierConfig.Spear` | double | 0.0 | 1000.0 | 1.0 |  | XP multipliers |
| Character 7.46 | `MultiplierConfig.Maintenance` | double | 0.0 | 1000.0 | 1.0 |  | XP multipliers |
| Character 7.47 | `MultiplierConfig.Farming` | double | 0.0 | 1000.0 | 1.0 |  | XP multipliers |
| Character 7.48 | `MultiplierConfig.Husbandry` | double | 0.0 | 1000.0 | 1.0 |  | XP multipliers |
| Character 7.49 | `MultiplierConfig.Woodwork` | double | 0.0 | 1000.0 | 1.0 |  | XP multipliers |
| Character 7.50 | `MultiplierConfig.Carving` | double | 0.0 | 1000.0 | 1.0 |  | XP multipliers |
| Character 7.51 | `MultiplierConfig.Cooking` | double | 0.0 | 1000.0 | 1.0 |  | XP multipliers |
| Character 7.52 | `MultiplierConfig.Electricity` | double | 0.0 | 1000.0 | 1.0 |  | XP multipliers |
| Character 7.53 | `MultiplierConfig.Doctor` | double | 0.0 | 1000.0 | 1.0 |  | XP multipliers |
| Character 7.54 | `MultiplierConfig.FlintKnapping` | double | 0.0 | 1000.0 | 1.0 |  | XP multipliers |
| Character 7.55 | `MultiplierConfig.Masonry` | double | 0.0 | 1000.0 | 1.0 |  | XP multipliers |
| Character 7.56 | `MultiplierConfig.Mechanics` | double | 0.0 | 1000.0 | 1.0 |  | XP multipliers |
| Character 7.57 | `MultiplierConfig.Blacksmith` | double | 0.0 | 1000.0 | 1.0 |  | XP multipliers |
| Character 7.58 | `MultiplierConfig.Pottery` | double | 0.0 | 1000.0 | 1.0 |  | XP multipliers |
| Character 7.59 | `MultiplierConfig.Tailoring` | double | 0.0 | 1000.0 | 1.0 |  | XP multipliers |
| Character 7.60 | `MultiplierConfig.MetalWelding` | double | 0.0 | 1000.0 | 1.0 |  | XP multipliers |
| Character 7.61 | `MultiplierConfig.Aiming` | double | 0.0 | 1000.0 | 1.0 |  | XP multipliers |
| Character 7.62 | `MultiplierConfig.Reloading` | double | 0.0 | 1000.0 | 1.0 |  | XP multipliers |
| Character 7.63 | `MultiplierConfig.Fishing` | double | 0.0 | 1000.0 | 1.0 |  | XP multipliers |
| Character 7.64 | `MultiplierConfig.PlantScavenging` | double | 0.0 | 1000.0 | 1.0 |  | XP multipliers |
| Character 7.65 | `MultiplierConfig.Tracking` | double | 0.0 | 1000.0 | 1.0 |  | XP multipliers |
| Character 7.66 | `MultiplierConfig.Trapping` | double | 0.0 | 1000.0 | 1.0 |  | XP multipliers |
| Character 7.67 | `MultiplierConfig.Butchering` | double | 0.0 | 1000.0 | 1.0 |  | XP multipliers |
| Character 7.68 | `MultiplierConfig.Glassmaking` | double | 0.0 | 1000.0 | 1.0 |  | XP multipliers |
| Vehicles 8.1 | `EnableVehicles` | boolean |  |  | true |  |  |
| Vehicles 8.2 | `VehicleEasyUse` | boolean |  |  | false |  |  |
| Vehicles 8.3 | `RecentlySurvivorVehicles` | enum | 1 | 4 | 2 | 1=None; 2=Low; 3=Normal; 4=High |  |
| Vehicles 8.4 | `ZombieAttractionMultiplier` | double | 0.0 | 100.0 | 1.0 |  |  |
| Vehicles 8.5 | `CarSpawnRate` | enum | 1 | 5 | 3 | 1=None; 2=Very Low; 3=Low; 4=Normal; 5=High |  |
| Vehicles 8.6 | `ChanceHasGas` | enum | 1 | 3 | 2 | 1=Low; 2=Normal; 3=High |  |
| Vehicles 8.7 | `InitialGas` | enum | 1 | 6 | 2 | 1=Very Low; 2=Low; 3=Normal; 4=High; 5=Very High; 6=Full |  |
| Vehicles 8.8 | `CarGasConsumption` | double | 0.0 | 100.0 | 1.0 |  |  |
| Vehicles 8.9 | `LockedCar` | enum | 1 | 6 | 4 | 1=Never; 2=Extremely Rare; 3=Rare; 4=Sometimes; 5=Often; 6=Very Often |  |
| Vehicles 8.10 | `CarGeneralCondition` | enum | 1 | 5 | 3 | 1=Very Low; 2=Low; 3=Normal; 4=High; 5=Very High |  |
| Vehicles 8.11 | `TrafficJam` | boolean |  |  | true |  |  |
| Vehicles 8.12 | `CarAlarm` | enum | 1 | 6 | 3 | 1=Never; 2=Extremely Rare; 3=Rare; 4=Sometimes; 5=Often; 6=Very Often |  |
| Vehicles 8.13 | `PlayerDamageFromCrash` | boolean |  |  | true |  |  |
| Vehicles 8.14 | `CarDamageOnImpact` | enum | 1 | 5 | 3 | 1=Very Low; 2=Low; 3=Normal; 4=High; 5=Very High |  |
| Vehicles 8.15 | `SirenShutoffHours` | double | 0.0 | 168.0 | 0.0 |  |  |
| Vehicles 8.16 | `DamageToPlayerFromHitByACar` | enum | 1 | 5 | 1 | 1=None; 2=Low; 3=Normal; 4=High; 5=Very High |  |
| Vehicles 8.17 | `SirenEffectsZombies` | boolean |  |  | true |  |  |
| Livestock 9.1 | `AnimalStatsModifier` | enum | 1 | 6 | 4 | 1=Ultra Fast; 2=Very Fast; 3=Fast; 4=Normal; 5=Slow; 6=Very Slow |  |
| Livestock 9.2 | `AnimalPregnancyTime` | enum | 1 | 6 | 4 | 1=Ultra Fast; 2=Very Fast; 3=Fast; 4=Normal; 5=Slow; 6=Very Slow |  |
| Livestock 9.3 | `AnimalEggHatch` | enum | 1 | 6 | 4 | 1=Ultra Fast; 2=Very Fast; 3=Fast; 4=Normal; 5=Slow; 6=Very Slow |  |
| Livestock 9.4 | `AnimalAgeModifier` | enum | 1 | 6 | 4 | 1=Ultra Fast; 2=Very Fast; 3=Fast; 4=Normal; 5=Slow; 6=Very Slow |  |
| Livestock 9.5 | `AnimalMilkIncModifier` | enum | 1 | 6 | 4 | 1=Ultra Fast; 2=Very Fast; 3=Fast; 4=Normal; 5=Slow; 6=Very Slow |  |
| Livestock 9.6 | `AnimalWoolIncModifier` | enum | 1 | 6 | 4 | 1=Ultra Fast; 2=Very Fast; 3=Fast; 4=Normal; 5=Slow; 6=Very Slow |  |
| Livestock 9.7 | `AnimalRanchChance` | enum | 1 | 7 | 5 | 1=Never; 2=Extremely Rare; 3=Rare; 4=Sometimes; 5=Often; 6=Very Often; 7=Always |  |
| Livestock 9.8 | `AnimalGrassRegrowTime` | integer | 1 | 9999 | 240 |  |  |
| Livestock 9.9 | `AnimalMetaPredator` | boolean |  |  | false |  |  |
| Livestock 9.10 | `AnimalMatingSeason` | boolean |  |  | true |  |  |
| Livestock 9.11 | `AnimalSoundAttractZombies` | boolean |  |  | true |  |  |
| Livestock 9.12 | `AnimalTrackChance` | enum | 1 | 6 | 4 | 1=Never; 2=Extremely Rare; 3=Rare; 4=Sometimes; 5=Often; 6=Very Often |  |
| Livestock 9.13 | `AnimalPathChance` | enum | 1 | 6 | 4 | 1=Never; 2=Extremely Rare; 3=Rare; 4=Sometimes; 5=Often; 6=Very Often |  |
| (not in UI) | `StartYear` | enum | 1 | 100 | 1 | 1993 .. 2092 |  |
| (not in UI) | `AlarmDecayModifier` | integer | -1 | 2147483647 | 14 |  |  |
| (not in UI) | `InsaneLootFactor` | double | 0.0 | 0.2 | 0.05 |  |  |
| (not in UI) | `ExtremeLootFactor` | double | 0.05 | 0.6 | 0.2 |  |  |
| (not in UI) | `RareLootFactor` | double | 0.2 | 1.0 | 0.6 |  |  |
| (not in UI) | `NormalLootFactor` | double | 0.6 | 2.0 | 1.0 |  |  |
| (not in UI) | `CommonLootFactor` | double | 1.0 | 3.0 | 2.0 |  |  |
| (not in UI) | `AbundantLootFactor` | double | 2.0 | 4.0 | 3.0 |  |  |
| (not in UI) | `Farming` | enum | 1 | 5 | 3 | 1=Very Fast; 2=Fast; 3=Normal; 4=Slow; 5=Very Slow |  |
| (not in UI) | `PlantAbundance` | enum | 1 | 5 | 3 | 1=Very Poor; 2=Poor; 3=Normal; 4=Abundant; 5=Very Abundant |  |
| (not in UI) | `NightLength` | enum | 1 | 5 | 3 | 1=Always Night; 2=Long; 3=Normal; 4=Short; 5=Always Day |  |
| (not in UI) | `AnimalMetaStatsModifier` | enum | 1 | 6 | 4 | 1=Ultra Fast; 2=Very Fast; 3=Fast; 4=Normal; 5=Slow; 6=Very Slow |  |

## Sources

All sources are files in the local install of build 42.21.0 (`4a0e9546ec`):

- `projectzomboid.jar`: `zombie/SandboxOptions.class` and its inner option classes. A reflection program read them at run time. The program and its raw output stayed in the session scratchpad.
- The output of `SandboxOptions.saveServerLuaFile`, saved as `research/b42-default_SandboxVars.lua`.
- `media/lua/client/OptionScreens/ServerSettingsScreen.lua`: `SettingsTable` (tabs, order, section titles, advanced combos), and the loop at the end of the file that maps each option type to a UI control.
- `media/lua/client/OptionScreens/SandboxOptions.lua`: the preset list, `loadGameFile` / `loadPresetFile`, and the link from Zombies to PopulationMultiplier.
- `media/lua/shared/Sandbox/*.lua`: the built-in presets.
- `media/lua/shared/defines.lua`: the population multiplier tables.
- `media/lua/shared/Translate/EN/Sandbox.json`: labels, tooltips, tab names and section names.

## Gaps

- **Clamping is not checked.** I did not check what the game does with an out-of-range value in a file: clamp it, reject it, or reset it to the default. The integer and double option classes store min and max, so clamping is likely.
- **The upgrade rules for VERSION < 6 are not listed.** `upgradeOptionName` and `upgradeLuaTable` are private Java methods, and I did not decompile them. The page must write `VERSION = 6`.
- **Mod options are not included.** Mods add options through `media/sandbox-options.txt` (`CustomSandboxOptions`), with their own `page` names. For the page, these are pass-through keys.
- **Some comments are wrong.** A few comments in the generated file do not match the key below them. For example, the comment above `ClayRiverChance` says "The global temperature". The error comes from the game's own writer, so do not use the comments as data.
- **Labels are English only.** Other languages are in `Translate/<LANG>/Sandbox.json`.
