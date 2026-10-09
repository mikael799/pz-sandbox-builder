# Map: PZ sandbox config builder

Label: wayfinder:map

## Destination (reached: see spec.md)

A build-ready spec for a single static HTML page. The page edits a Project Zomboid Build 42 sandbox file (`<servername>_SandboxVars.lua`) and always outputs the complete file. When you change a driver field, the page sets its linked follower fields from the game's own tables.

## Notes

- Domain: Project Zomboid Build 42 dedicated server, sandbox file only. Glossary is in `/CONTEXT.md`.
- Each session consults the `grilling` and `domain-modeling` skills. Research tickets use the `research` skill and write findings to `research/`.
- Standing decisions from charting:
  - The page is one HTML file with no build step and no dependencies.
  - Two start paths: paste an existing sandbox file (main path), or start from defaults or a preset.
  - The page shows all settings, grouped like the in-game tabs, with a search box.
  - Linked fields: a driver change sets its followers from the game's own tables. No custom maths. A follower that you edit by hand becomes an override. The page marks it, keeps it on later driver changes, and gives it a reset button.
  - Unknown keys (mod options, new patch keys) pass through to the output unchanged.
  - The output is always the complete file, ready to copy to the server.

## Decisions so far

- [Saving between visits](issues/07-saving-between-visits.md): auto-save the last state (output file plus overrides) to browser storage and restore it through the paste path. No named saves.
- [Preset list](issues/06-preset-list.md): all 5 built-in presets, loaded as shipped. Shutoff days are rolled on load like single player. An inline confirm before a preset replaces your changes.
- [Page layout](issues/05-page-layout.md): three panes. Tabs on the left, settings cards in the middle, the live file with highlighted changes and the Copy button on the right. Reference: `prototype/page-layout.html?variant=B`.
- [File round-trip fidelity](issues/04-file-round-trip-fidelity.md): values survive, layout does not. The page always writes the file in the game's own format. Unknown keys pass through as raw text. VERSION below 6 is refused, missing keys come from defaults, out-of-range values are marked, not clamped.
- [Linked groups and scaling rules](issues/03-linked-groups-and-scaling.md): game tables only. `Zombies` sets population, start and peak multipliers to the same level. Respawn, migration and shutoff dropdowns write their numbers. Gates grey out ignored fields.
- [B42 sandbox file schema](issues/01-b42-sandbox-schema.md): 269 keys in 9 tabs, VERSION 6 format, 5 built-in presets, all read from the game's own files (B42.21.0) into `research/b42-sandbox-schema.json`.
- [Linked field candidates](issues/02-linked-field-candidates.md): seven groups. Start and Peak multiply with population, so their effects stack. Dropdowns are labels for numbers. Day length is not linked in game.

## Not yet specified


## Out of scope

- The server file (`<servername>.ini`): PVP, mods, slots, passwords.
- Build 41 support.
- Integration with a host web panel. The page only outputs a file to copy.
