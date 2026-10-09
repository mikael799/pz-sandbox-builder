# Context: PZ sandbox config builder

## Sandbox file
The Project Zomboid server file `<servername>_SandboxVars.lua`. It holds world, zombie and loot settings. Not the server `.ini` file.

## Linked group
A set of sandbox fields that the game uses together, so that one change needs the others to follow.

## Driver field
The field in a linked group that you change on purpose, usually a dropdown. A change sets the followers from the game's own table.

## Follower field
A field in a linked group that the page sets when its driver changes.

## Override
A follower field that you edited by hand. Driver changes no longer touch it until you reset it.

## Preset
A named full set of sandbox values (for example Apocalypse) that a session can start from.

## Pass-through key
A key in a pasted sandbox file that the page does not know. The page copies it to the output unchanged.

## Gate
A field whose value makes the game ignore another field. Example: `SprinterPercentage` counts only when `Speed` is Random.
