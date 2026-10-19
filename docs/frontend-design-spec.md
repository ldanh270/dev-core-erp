# Frontend Design Spec — DevCore ERP

**Status:** Finalized  
**Default Theme:** Light  
**Dark Mode:** `.dark` class on `html` or `body`

## 1. Vision & Goals
- **Professional & Trustworthy:** High-quality enterprise UI using a **Blue/Slate** palette.
- **Approachable & Modern:** Friendly "Pill" aesthetic for interactive elements to reduce the "stiff" feeling of corporate software.
- **Ergonomic Density:** "Comfortable & Spacious" layout to minimize visual fatigue for users spending 8+ hours a day in the system.

## 2. Branding & Color System (HEX)
All colors follow the Blue/Slate professional identity.

### 2.1 Light Mode
| Token | HEX | Usage |
| --- | --- | --- |
| --background | #ffffff | Main application background |
| --foreground | #020817 | Primary text color |
| --primary | #2563eb | Brand blue for primary actions |
| --primary-foreground | #f8fafc | Text on primary buttons |
| --secondary | #f1f5f9 | Slate background for secondary elements |
| --muted-foreground | #64748b | De-emphasized text |
| --border | #e2e8f0 | Default borders and separators |
| --ring | #2563eb | Focus indicators |

### 2.2 Dark Mode
| Token | HEX | Usage |
| --- | --- | --- |
| --background | #020817 | Deep dark background |
| --foreground | #f8fafc | Off-white text for readability |
| --primary | #3b82f6 | Vibrant blue for dark mode visibility |
| --secondary | #1e293b | Dark slate for surfaces |
| --border | #1e293b | Subdued borders |

## 3. Shape & Geometry (The "Pill" Rule)
The system uses a mixed-radius strategy to balance friendliness with structure.

- **Interactive Components (Pill):** `rounded-full` (9999px).
  - *Applied to:* Buttons, Badges, Input fields, Avatars, Search bars.
- **Container Components (Soft-Square):** `rounded-xl` (~8px).
  - *Applied to:* Cards, Dialogs, Modals, Popovers, Dashboard Widgets.
- **Sub-containers / inner wrappers:** `rounded-lg` (~6px).
  - *Applied to:* Table wrappers, inner sections within a card.
- **Focus Rings:** 2px offset with `ring-primary`.

## 4. Layout & Spacing
Adheres to the "Comfortable & Spacious" principle.

- **Page Padding:** 32px (`p-8`) to provide breathing room.
- **Card Padding:** 24px - 32px (`p-6` to `p-8`).
- **Data Table Row Height:** 64px (Large touch targets, reduced density).
- **Navigation:**
  - Sidebar width: 300px (Expanded) / 80px (Collapsed).
  - Top bar height: 72px.

## 5. Typography
- **Font Stack:** Inter (Variable) for UI; Fira Code for technical IDs/Data.
- **Hierarchy:**
  - **Heading:** Semibold (600), relaxed leading.
  - **Body:** Regular (400), 1rem base size.
  - **Labels:** Medium (500), 0.875rem.

## 6. Component Specifics (shadcn UI)
- **Buttons:** Height 44px-48px. Must use `rounded-full`.
- **Inputs:** Height 48px. Must use `rounded-full` for text inputs.
- **Tables:** No vertical borders. Sticky headers. Row hover uses `#f1f5f9` (Light) / `#1e293b` (Dark).
- **Status Pills:** High contrast. Green (#16a34a) for Success, Amber (#f59e0b) for Warning.

## 7. Motion & Feedback
- **Duration:** 200ms ease-in-out for most transitions.
- **Hover States:** Subtle scaling (1.02x) for cards to indicate interactivity.
- **Loading:** Shimmer skeletons that match the exact border-radius of the component they replace.
