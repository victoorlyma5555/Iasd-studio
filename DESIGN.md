---
version: 4
colors:
  background: "#0e0818"
  foreground: "#f4efe8"
  muted: "#a8a2bd"
  accent: "#7c5cdb"
  highlight: "#f5c518"
  positive: "#35f0b9"
  critical: "#ff7d98"
typography:
  display:
    fontFamily: "Bricolage Grotesque, Instrument Sans, sans-serif"
  body:
    fontFamily: "Instrument Sans, Inter, system-ui, sans-serif"
  utility:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
rounded:
  card: "22px"
  control: "9px"
spacing:
  page: "30px"
  card: "22px"
components:
  dashboard-photo-mural:
    ratio: "2.72 / 1 desktop; 1.08 / 1 mobile"
    images: "Up to five images already configured by site administrators"
    actions: "Open login or account creation"
  landing-phone-demo:
    behavior: "Animated vertical walkthrough of real dashboard capabilities"
    fallback: "Static first frame when reduced motion is enabled"
  landing-product-scroll:
    behavior: "Desktop hero uses native page scroll to flatten and enlarge the real IASD Studio monitor while moving the phone to the foreground edge"
    fallback: "Stable product composition on compact screens and for reduced-motion preferences"
  public-landing-theme:
    mode: "Always light"
    palette: "Corporate Trust: slate white, indigo primary, violet secondary, deep slate text"
    typography: "Plus Jakarta Sans for the public landing; product UI keeps the existing application families"
    depth: "Indigo/violet colored shadows, restrained atmospheric orbs, and product-led 3D perspective"
  shared-surface:
    border: "1px solid rgba(var(--au-w), .11)"
    background: "var(--au-card1)"
omitted:
  - section: elevation
    reason: "Surfaces use theme-aware borders and restrained shadows."
---

## Overview

IASD APP is a Portuguese-language toolkit for Adventist church members, volunteers, and administrators. Signed-out visitors first see a photographic product hero with login actions and an animated phone walkthrough of the dashboard. After authentication, the frontend uses a warm, card-led community language inspired by the selected Church Community App reference: generous rounded cards, purple as the participation accent, yellow as a small highlight, clear task hierarchy, and reachable actions for use during the week. The authenticated Home starts with primary destinations, then presents the greeting, prayer and community actions, permitted schedule, and daily passage. Interior tabs retain the shared desktop/mobile shell and use page-family treatments for organization, Bible study, games, creation, media, and administration.

`ui/aurora.css` owns semantic palette and theme tokens. `ui/frontend-redesign.css` provides the shared structural redesign, and `ui/iasd-app-2026.css` is the final visual layer for Home and interior tabs. Use the existing `--au-*` variables for theme-sensitive surfaces so dark mode, light mode, and the user's supported palette remain intact. The final layer adds restrained gold and functional blue accents while keeping those preferences authoritative.

## Colors and typography

Use semantic theme variables rather than hard-coded screen-specific colors. Preserve adequate contrast for both theme modes. Use Bricolage Grotesque for short display headings, Instrument Sans for product copy and controls, and JetBrains Mono only for compact metadata. All visible application copy is Brazilian Portuguese; support accents, wrapping, and long translated labels.

## Application shell

On operational pages, use the expanded labeled sidebar, a compact utility header, and a centered page canvas. The signed-out landing hides the application shell and places login actions inside the hero. The authenticated Home hides the sidebar and mobile bottom bar, then starts with its labeled module navigation. Search, account, theme, presence, and route actions remain connected to the shared shell after login.

## Page families

- **Landing:** always-light Corporate Trust hero with a concise product promise, login/create-account actions, an animated phone walkthrough, and a scroll-led reveal of the real IASD Studio monitor on desktop. Use indigo-to-violet accents, Plus Jakarta Sans, colored depth, and generous white space while keeping the real products dominant.
- **Authenticated Home:** clearly titled module directory, greeting, a prominent prayer card, community actions, permission-gated schedule, and daily passage in one scrollable rhythm. The brand remains visible in the utility header while the Home keeps its direct-navigation layout.
- **Operational pages:** Cronograma, Escalas, Alertas, permissions, media, profile, and administration use a shared hierarchy, clear actions, readable lists/tables, explicit empty states, and theme-aware form controls. Calendar and media-gallery layouts adapt to the dataset and available width.
- **Study and community pages:** Bible, Sabbath School, games, Hinário, Estudo, and Palavra em Cena keep their specialized reading, play, and authoring layouts while sharing page headers, control states, spacing, typography, surfaces, and visible keyboard focus.
- **IASD Studio projection:** remains a dedicated live-use surface. Preserve projector controls, status indicators, keyboard behavior, and its collapsible navigation.

Use 22px corners for Home feature cards, 14px for denser operational surfaces, and 9px controls. Keep primary actions visually clear, secondary actions quieter, and danger actions explicit. Interactive motion uses transform and color transitions with a restrained ease-out curve; pressed controls scale to 0.975. Honor `prefers-reduced-motion`.

## Do's and don'ts

- Use the administrator-configured Home banner images as the photo mural; do not invent church events, people, schedules, or announcements.
- Keep route labels and permission-controlled destinations aligned with the existing router and access rules.
- Make the current activity and the full-schedule action discoverable on Home.
- Keep focus visible, labels persistent, and empty, loading, unavailable, and error states understandable.
- Keep mobile content in logical DOM order and prevent horizontal page overflow.
- Preserve theme and palette settings across every route.
