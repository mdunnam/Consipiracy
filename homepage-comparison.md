# Homepage Comparison: `index-original.html` vs `index.html` (Redesign)

---

## Summary

| | `index-original.html` | `index.html` (Redesign) |
|---|---|---|
| File size | ~28 KB | ~52 KB |
| CSS stylesheet links | `css/style.css` only | `css/style.css` + `css/enhancements.css` |
| Loading screen | None | ✅ Animated boot screen with progress bar and loading log |
| Hero layout | Centred single-column | Two-column split (copy left / panel right) |
| H1 text | "THE TRUTH ARCHIVE" | "SEE THE PATTERN" |
| Hero eyebrow | "CLASSIFIED RESEARCH ARCHIVE — LEVEL OMEGA CLEARANCE" | "CLASSIFIED RESEARCH NETWORK // PATTERN RECOGNITION FOR THE AWAKE" |
| H1 style | Glitch effect | Glitch + gold gradient fill |
| Floating background glyphs | None | ✅ △ 👁 ✦ ⬡ ☉ ☾ positioned absolutely in hero |
| Signal chips (status badges) | None | ✅ "● Live Archive", "422 Pages Indexed", "Level Omega Access" |
| Hero body copy | Generic intro paragraph | Lead with redacted-word spans (perception control / surveillance) |
| Hero CTA buttons | ↓ Enter the Archive · 📖 Read the eBook · 🕸 Connection Map | ↓ Start the Descent · 🕸 Open Connection Map · 📖 Read Full eBook |
| Live counter | `<span class="live-counter-wrap">` | ✅ Same, plus subscriber counter section |
| Symbol inline row (4-cell icon grid under hero copy) | None | ✅ Hero Seal / Pyramid Mark / Occult Glyph / Node Icon |
| Signal line (3-cell stat bar under symbol row) | None | ✅ "Built to Pull" / "Symbol-Ready" / "Standalone Mockup" |
| Hero right panel | None | ✅ Dossier panel with sigil slot, featured dossier, 3 intel items |

---

## Sections — Original Only

These sections exist in `index-original.html` and are **absent** from the redesign:

- **Stats bar** — 4-stat grid: "12 Core Truth Chapters", "200+ Documented Connections", "500 Years of Hidden History", "1 Agenda Behind It All"
- **Intro / Red Pill section** — "Welcome to the Archive" prose, J. Edgar Hoover blockquote, declassified banner
- **12-chapter card grid** — Full 3-column card grid with icon, title, description, chapter number, and "Read More →" for all 12 chapters (Flat Earth through Metaphysical)
- **Power Hierarchy section** — "Who Really Runs the World?" — 6-item numbered list (Hidden Hand → Secret Orders → Supranational → Governments → Corporations → Public), plus fact box, alert box, and Maps card aside
- **eBook CTA banner** — "All 12 Chapters — In One Document" banner with gold button

---

## Sections — Redesign Only

These sections exist in `index.html` (redesign) and are **absent** from the original:

- **Red Thread section** — 4-card row below hero: Banking→Policy / Media→Perception / Technology→Surveillance / Metaphysics→Meaning
- **Countdown + subscriber counter** — "Next Classified File Release" 24-hour countdown + "Researchers Worldwide" animated counter
- **Updated stats bar** — "422 Pages Across the Archive", "12 Core Rabbit Holes", "65 Map Nodes Connected", "1 Unifying Power Thesis"
- **Archive progress bar** — "Archive accessed: X of 422 files" animated progress track
- **Symbol/Sigil band section** — 8-slot grid of named placeholder art zones: All-Seeing Eye / Pyramid / Network Node / Occult Glyph / Solar Seal / Lunar Mark / Target/Crosshair / Archive Diamond
- **Three Route cards section** — "Start Here" with 3 entry routes: Route 01 // Systems (Deep State) / Route 02 // Cosmology (Flat Earth) / Route 03 // Symbolism (Secret Societies); each with icon shell and route depth label
- **Spotlight / Core Thesis section** — Two-column: left = "The strongest version of this homepage" argument with 3 spotlight points; right = 3 aside cards (Visual Direction / What This Mockup Changes / Recommended live changes)
- **Signal Matrix section** — 4 matrix cards: "This archive is deep" / "This archive has a thesis" / (2 more)
- **Chapter directory grid** — 4-column compact chapter directory (different from the original 3-column card grid)

---

## Navigation Differences

| | Original | Redesign |
|---|---|---|
| Nav items | Great Awakening, Flat Earth, Deep State, Secret Societies, Banking, Media, Space Deception, Big Pharma, Tech & Control, False Flags, Suppressed History, Metaphysical, eBook | Great Awakening, Flat Earth, Deep State, Secret Societies, Banking, Media, Space Deception, Big Pharma, eBook only (Tech/Control, False Flags, Suppressed History, Metaphysical removed) |

---

## Visual / CSS Differences

| Feature | Original | Redesign |
|---|---|---|
| Hero class | `hero` | `hero hero-redesign` |
| Hero layout | Centred flex column | CSS Grid `1.3fr 0.9fr` two-column |
| Hero background gradients | Via `css/style.css` globals | Overridden with tighter radial + diagonal red gradient |
| Gold grid overlay | Via global | Faded with `mask-image` to bottom |
| H1 treatment | Glitch pseudo-elements only | Glitch + `-webkit-background-clip` gold gradient text |
| `.route-card` | Not present | Hover lift, gold radial glow reveal, red kicker badge |
| `.spotlight-*` | Not present | Two-column asymmetric layout with red left-border accent points |
| `.matrix-card` | Not present | Dark gradient cards with mono tag labels |
| `.symbol-slot` | Not present | Circle icon shell, dashed-gold border, `PLACEHOLDER ART` badge |
| Responsive breakpoints | Via `css/style.css` | Adds breakpoints at 1100px and 760px inline for new grid classes |

---

## Intent Note (from redesign copy)

The redesign explicitly states its purpose inside the HTML:

> *"This version of the homepage leans harder into that feeling — faster entry, more atmosphere, and obvious places to drop custom icon and sigil artwork."*

> *"This file is separate from the live homepage and does not overwrite the current index."*

> *"Rebuild the current `index.html` around this structure, keep the chapter cards further down, and add one featured 'start here' route above the fold."*
