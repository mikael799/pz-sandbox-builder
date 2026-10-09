# Saving between visits

Type: grilling
Status: resolved
Blocked by:

## Question

When you close and reopen the page (a local HTML file), does your work come back? Options: nothing is saved (the server file is the save), the last state is kept in browser storage, or named saved configurations.

## Answer

- The page keeps the last state in browser storage (`localStorage`), saved after every change and restored on open with the message "Restored your last session". No named saves: the server file is the save.
- Stored data: the complete output file text plus the list of override keys. On open, the file goes through the normal paste load path, so new keys fill from defaults, mod keys pass through, and bad data gives the normal error.
- If storage is blocked or empty, the page starts from the game defaults and shows no error. Every storage access is wrapped in try/catch.
