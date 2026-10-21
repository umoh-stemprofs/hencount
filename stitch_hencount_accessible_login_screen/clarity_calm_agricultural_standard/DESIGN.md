---
name: Clarity & Calm Agricultural Standard
colors:
  surface: '#f9f9ff'
  surface-dim: '#d2daf0'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3ff'
  surface-container: '#e9edff'
  surface-container-high: '#e0e8ff'
  surface-container-highest: '#dbe2f9'
  on-surface: '#141b2c'
  on-surface-variant: '#524437'
  inverse-surface: '#293041'
  inverse-on-surface: '#edf0ff'
  outline: '#857465'
  outline-variant: '#d7c3b2'
  surface-tint: '#8a5100'
  primary: '#784600'
  on-primary: '#ffffff'
  primary-container: '#9a5b00'
  on-primary-container: '#ffe7d2'
  inverse-primary: '#ffb86e'
  secondary: '#0054cb'
  on-secondary: '#ffffff'
  secondary-container: '#346ee5'
  on-secondary-container: '#fefcff'
  tertiary: '#005f27'
  on-tertiary: '#ffffff'
  tertiary-container: '#137a37'
  on-tertiary-container: '#a7ffb1'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdcbd'
  primary-fixed-dim: '#ffb86e'
  on-primary-fixed: '#2c1600'
  on-primary-fixed-variant: '#693c00'
  secondary-fixed: '#dae2ff'
  secondary-fixed-dim: '#b1c5ff'
  on-secondary-fixed: '#001847'
  on-secondary-fixed-variant: '#0040a0'
  tertiary-fixed: '#98f8a5'
  tertiary-fixed-dim: '#7cdb8b'
  on-tertiary-fixed: '#002109'
  on-tertiary-fixed-variant: '#005321'
  background: '#f9f9ff'
  on-background: '#141b2c'
  surface-variant: '#dbe2f9'
typography:
  display-stat:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-lg-bold:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 28px
  body-base:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  label-base:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-tablet: 1.5rem
  gutter-desktop: 2rem
  margin: 1rem
  margin-tablet: 2rem
  margin-desktop: 3rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system is engineered for zero-friction cognitive comprehension in active, outdoor, and high-stress field environments. Built for poultry farm managers, field hands, and operators who may experience reading fatigue, low literacy levels, or cognitive processing differences, the interface prioritizes 5-second situational awareness over visual novelty.

The visual direction follows **Radical Utilitarian Minimalism** fused with calm, human-centered accessibility:
- **Zero Ambiguity:** Every metric, action, and state pair an unambiguous stroke icon with plain, direct terminology (e.g., "Add Eggs", "Lost Birds", "Needs Water").
- **No Decorative Fluff:** No gradients, no abstract background art, no multi-layered nested menus, and no non-functional illustrations. Visual elements exist strictly to deliver data or trigger action.
- **Cognitive Protection:** Low-saturation atmospheric backgrounds minimize eye fatigue under direct sunlight or dusty barn conditions, while critical touchpoints display decisive, high-contrast feedback.

## Colors

The palette establishes immediate functional hierarchy through uncompromising contrast ratios that meet or exceed WCAG 2.1 AAA standards on core interactive surfaces.

### Core Roles
- **Primary Accent (`#9A5B00`):** Warm Ochre / Amber. Used exclusively for primary call-to-action buttons, active navigation markers, and interactive links. Provides distinct warmth without the cognitive alarm of pure red or yellow.
- **Canvas (`#F7F8FA`):** Low-strain, ultra-light cool grey base that prevents glare in high-light farm environments.
- **Surface Cards (`#FFFFFF`):** High-clarity white card backgrounds framed with crisp structural separation.
- **Text & Content:**
  - High-Contrast Primary: `#101828` (Text, headers, high-importance counts).
  - Secondary / Muted: `#475467` (Helper labels, metadata, secondary instructions). Minimum contrast ratio strictly maintained above 4.5:1 against card backgrounds.
- **Structural Outlines:** `#E4E7EC` (Subtle boundary borders) and `#D0D5DD` (Interactive component borders).

### Feedback & Status Tokens
Status signals must always pair an explicit line icon with a clear text label; color is never used as the sole conveyor of status:
- **Success (`#1B7F3B`):** Healthy flock states, completed daily logs, safe thresholds.
- **Warning (`#B54708`):** Low feed levels, temperature warnings, pending reviews.
- **Danger (`#B42318`):** Mortality spikes, feed depletion, critical equipment failure.
- **Info (`#175CD3`):** System updates, scheduled reminders, operational tips.

## Typography

Typography relies entirely on **Inter** to ensure maximum glyph distinction, open apertures, and clarity at a distance.

### Rules of Legibility
- **Strict Size Floor:** No text element anywhere in the system may render smaller than `16px`. Sub-16px text is strictly prohibited to accommodate users with low vision or reading difficulties.
- **Primary Body:** Standard running copy and operational prompts default to `18px` (`body-lg`) to foster easy, relaxed tracking.
- **Metrics & Totals (`display-stat`):** Large numbers (daily egg counts, mortality totals, batch weights) render at `40px` bold. Metrics stand isolated from surrounding text to support immediate visual extraction.
- **Letter Spacing & Line Height:** Line heights are kept generous (minimum 1.4x font size) to prevent visual crowding when users track lines with a finger on mobile devices.

## Layout & Spacing

Layouts use a predictable, fluid single-axis structural flow. Farm operators frequently navigate interfaces one-handed while carrying equipment or wearing protective gear.

### Layout Mechanics
- **Single-Column Mobile Focus:** On mobile, screens default to a single-column stacked card layout with a fixed base margin of `16px` (`1rem`). Complex horizontal card splitting is avoided to keep the visual reading path strictly vertical.
- **Adaptive Multi-Column Desktop/Tablet:**
  - **Tablet:** 6-column fluid grid with `24px` (`1.5rem`) gutters.
  - **Desktop:** 12-column fixed-max grid (capped at `1200px` content width) with `32px` (`2rem`) gutters, keeping interactive panels centered and preventing overly long text line lengths.
- **Spacing Rhythm:** Built on an intentional `8px` baseline. Padding tokens below `8px` are avoided except for tightly constrained badge containers. Critical form fields and interactive rows use `space-lg` (`24px`) margins to prevent mis-taps.

## Elevation & Depth

Visual depth is achieved through physical card separation and controlled, soft ambient diffusion. Surfaces do not rely on high-opacity drop shadows, dramatic blurs, or complex lighting tricks.

### Elevation Hierarchy
- **Level 0 (Canvas Base):** Flat `#F7F8FA`. No elevation.
- **Level 1 (Data Cards & Work Surfaces):** Base white `#FFFFFF` surface bounded by a continuous 1px solid stroke in `#E4E7EC`. It carries a subtle, diffused resting shadow: `0px 2px 4px rgba(16, 24, 40, 0.04), 0px 1px 2px rgba(16, 24, 40, 0.02)`.
- **Level 2 (Popovers, Modals & Floating Action Strips):** Floating white `#FFFFFF` surface with an explicit 1px outline in `#D0D5DD` and a grounded elevated shadow: `0px 12px 24px -4px rgba(16, 24, 40, 0.08), 0px 4px 8px -2px rgba(16, 24, 40, 0.04)`.
- **Focus / Active State:** Elements never use fuzzy shadow-only focus rings. Focus states apply a crisp, high-visibility 3px outer stroke in `#9A5B00` separated by a 2px white gap.

## Shapes

The design system maintains a balanced, approachable geometry with an explicit base corner radius of `12px` (`rounded-lg` level) on core surface containers.

### Boundary Specifications
- **Cards & Data Containers:** Fixed `12px` corner radius. This softens the interface without feeling overly playful or reducing readable rectangular surface space.
- **Interactive Buttons & Inputs:** `10px` to `12px` corner radius, creating visual continuity with the card frames.
- **Status Tags & Chips:** `8px` corner radius. Rounded pill shapes are avoided for informational chips to distinguish them clearly from round-ended physical buttons and toggle switches.

## Components

### Buttons & Interactive Triggers
- **Touch Target:** Minimum 52px height across all primary actions to facilitate easy operation with gloves or damp hands.
- **Primary Action Button:** Solid `#9A5B00` background with `#FFFFFF` text (`label-lg`, 18px bold). Always contains a left-aligned 24px stroke icon paired with direct, plain action text (e.g., [Plus Icon] "Add Morning Count").
- **Secondary Action Button:** White `#FFFFFF` background, solid 2px outline in `#D0D5DD`, and `#101828` text.
- **Touch Feedback:** Distinct state change to 10% darker surface tone on active tap; no ambiguous micro-animations.

### Cards
- **Structure:** `#FFFFFF` background, `12px` border radius, `1px solid #E4E7EC`, padding `24px` (`space-lg`).
- **Metric Presentation:** Prominently displays the key count at `40px` bold (`#101828`) accompanied by an explicit category label at `18px` (`#475467`). Cards are self-contained; clicking any card opens the detailed drill-down for that flock or metric.

### Input Fields & Steppers
- **Text & Number Inputs:** 54px min-height, 2px solid border in `#D0D5DD`, white background, `18px` text. Input labels are permanently visible above the field in `18px` semibold (`#101828`)—never rely on placeholder text alone.
- **Large Numeric Steppers:** For quick barn tallies, provide large physical "+" and "−" tap targets (minimum 56x56px) flanking the central `40px` bold number display.

### Selection Controls (Checkboxes & Radios)
- **Scale:** Oversized 28x28px physical hit markers with a distinct 2px border.
- **Checked State:** Checkboxes display a bold, clear checkmark inside `#9A5B00`; radios display a solid centered circle with a high-contrast white ring.
- **Touch Area:** The clickable hit area spans the entire width of the card or row (minimum 56px height) rather than just the circular or square icon.

### Status Badges & Chips
- **Format:** Always a 20px line icon paired with an explicit, plain-English status word (e.g., [Checkmark Icon] "Good", [Alert Triangle Icon] "Low Feed", [X-Circle Icon] "Sick Bird").
- **Colors:**
  - Success: `#E8F5E9` background, `#1B7F3B` text and icon.
  - Warning: `#FEF0C7` background, `#B54708` text and icon.
  - Danger: `#FEE4E2` background, `#B42318` text and icon.
  - Info: `#EFF8FF` background, `#175CD3` text and icon.
- **Borders:** Thin 1px solid border matching the status color family for maximum edge contrast.

### Lists & Row Items
- **Spacing:** Minimum row height of 64px with horizontal padding of `16px`.
- **Dividers:** Clean 1px solid dividers in `#E4E7EC`.
- **Structure:** Leading icon or status pill on the left, primary descriptive title and subtitle in the center, and large numerical metric or chevron on the right.