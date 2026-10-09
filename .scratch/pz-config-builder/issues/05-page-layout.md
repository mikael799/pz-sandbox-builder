# Page layout

Type: prototype
Status: resolved
Blocked by: 01

## Question

How does the page look and behave? Tab grouping, search, how a driver shows its linked followers, how an override looks and resets, and where the paste input and the copy output sit. Also where load messages show: parse errors, version warnings, the filled-keys count, and red out-of-range values.

## Comments

Prototype: prototype/page-layout.html (3 variants, ?variant=A|B|C, real schema embedded).

## Answer

Layout B (three panes), as restyled in `prototype/page-layout.html?variant=B`. That file is the reference. Variants A and C are rejected.
- Left: search box, the 9 tabs (each with a count of changed settings), the preset selector.
- Middle: the tab title, then sections as rounded cards, at most 720 px wide and centered. A row shows the label, its tags and the control. The raw key shows on hover only. Followers sit right under their driver, marked with a thin green line. Changed rows have a yellow background. Ignored (gated) rows are faded.
- Right: Copy file (primary) and Download at the top, a folded "Paste existing file" input, then the load messages, then the complete file. Unchanged lines are grey, and changed lines are dark on yellow.
- Tags: "sets N" or "numbers differ" on drivers, "from <driver>" on followers, "override" with a reset button, "re-roll" on shutoff drivers, "ignored: <reason>" on gated fields, "day N is already past at start" for shutoff days.
- Look: Segoe UI Variable 15px with 1.55 line height, Cascadia Code for the file, thin scrollbars with no track, light and dark themes.
- Rejected by the user: crowded rows, default scrollbars, the small system font.
