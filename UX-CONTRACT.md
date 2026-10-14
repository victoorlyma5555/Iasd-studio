# UX Contract

## Product context

- Audience: Adventist church members, volunteers, and administrators.
- Locale: Brazilian Portuguese (`pt-BR`). Dates and times use the device's local time zone.
- Accessibility target: WCAG 2.2 AA for changed surfaces.
- Visual system: [DESIGN.md](DESIGN.md), implemented by `ui/aurora.css`, `ui/frontend-redesign.css`, and the final `ui/iasd-app-2026.css` layer.

## Canonical UI map

| Capability | Canonical owner | Contract |
|---|---|---|
| Navigation, search, account, theme | `ui/shell.js`, `core/router.js` | Keep existing route names, history, permissions, and desktop/mobile navigation behavior. |
| Public photographic hero | `homePhotoMuralMarkup()` in `app/main.js`, `auLanding()` in `ui/shell.js` | Render up to five configured Home images behind the product promise, authentication actions, and animated phone walkthrough. Keep administrator photo management. Never fabricate church photography. |
| Authenticated Home navigation | `auHomeNavigation()` in `ui/shell.js` | Start the signed-in dashboard with labeled module buttons. Hide the desktop sidebar, Home hamburger, and mobile bottom bar while Home is active. Keep existing route actions and permission-filtered destinations. |
| Home schedule | `scheduleHTML()` and `canViewSchedules()` in `ui/shell.js` / `app/main.js` | Only signed-in, non-anonymous members with an approved role and `IASDAccess.canViewSchedules` see or load schedules. The same rule filters menu, search, mobile navigation, Home summary, and direct route rendering. If access is removed while a session is open, clear schedules and return from the protected route to Home. |
| Community resources | `extrasHTML()` in `ui/shell.js`, shared styles in `ui/frontend-redesign.css` and `ui/iasd-app-2026.css` | Keep the existing five `IASDExtras.open` actions. Present prayer first, followed by the other actions in a warm responsive card feed using current theme tokens, clear labels, and keyboard focus. |
| Daily passage | `passageHTML()` and `loadPassage()` in `ui/shell.js` | Retain existing Bible service, cache, fallback passage, and Bible route. |
| Theme and palette | `ui/aurora.css`, existing theme preference | Preserve light/dark mode and all saved palette variants. |
| Operational pages | Existing page renderers in `ui/pages.js`, modules, and `ui/cargos.js` | Preserve each screen's data, forms, permissions, and interactions; use page-family headers and the shared card, type, focus, field, and responsive-list rules. |
| Study and creative modules | Bible, Sabbath School, games, Hinário, Estudo, and Jogral renderers in `ui/pages.js`, modules, and `ui/*` | Retain specialized reading/play/authoring controls while applying shared focus, responsive, loading, empty, and error states. |
| Site media and profile | Existing profile and media renderers in `app/main.js` / `ui/pages.js` | Preserve upload, crop, edit, save, and permission flows; present gallery/profile items as responsive content surfaces. |
| IASD Studio projection | Sonoplastia projection module | Preserve the dedicated live projection behavior, controls, and status indicators. |

## Home contract

- Visitors without an authenticated session see only the public photographic hero and its login/create-account actions. Dashboard modules, community actions, schedule, passage, and Studio promotion render only after authentication.
- The public hero always uses its light palette. The saved light/dark preference resumes after login and remains available in the dashboard.
- The primary hero action opens the existing login screen. Successful authentication returns to `Painel`, where the authenticated dashboard is rendered. Direct attempts to open dashboard routes while signed out return to the public hero and open login.
- The photographic hero is the signed-out entry screen and uses configured site assets with their saved framing values. It shows up to five distinct images, a short IASD APP promise, login/create-account actions, and a phone mockup with an automatic dashboard walkthrough; image assets may include the existing video format where supported.
- After login, the primary module navigation appears before the welcome, schedule, or passage content. No duplicate Home sidebar, hamburger menu, or mobile bottom navigation is shown.
- With no configured images, show the landing hero empty state. Administrators manage the configured photography through the existing site media tools.
- If every configured image fails to load, show the unavailable state without hiding the navigation or the rest of Home.
- The dashboard greeting uses the local date and current user name only when the authenticated profile provides it.
- Schedule is omitted for users without an approved member role and `canViewSchedules`; schedule data is not queried for them. Approved view-only members may see the published schedule. Schedule and passage services keep their existing loading, empty, cache, and recovery behavior when permitted.
- “Oração e vida em comunidade” remains on Home before the schedule and daily passage. Its five actions preserve their existing feature handlers while using a responsive, high-contrast card layout inspired by the selected Church Community App reference; theme/palette preferences remain authoritative.

## Shared interaction contract

- Every navigation destination is an existing route or permission-controlled tab; do not create substitute routes.
- Controls keep visible labels, keyboard focus indicators, and a logical reading order. Focus must not rely on color alone.
- At narrow widths, page content reflows to one column and remains clear of the bottom navigation and device safe areas.
- Reduced-motion preferences disable nonessential movement and transitions.
- Empty and unavailable states explain what happened and retain an existing recovery action when one exists.
- Shared styling must not alter live projection keyboard controls, permissions, data ownership, or save behavior.

## Scope and verification

This redesign covers the shared frontend shell, Home, all existing user-facing tabs, and shared presentation rules across operational, study, creative, media, profile, and administration page families. It does not change business data, auth, access policy, routes, or backend contracts. Review representative screens in each family at desktop and mobile widths before release. IASD Studio projection remains an embedded live-use surface and keeps its own control styling and keyboard behavior.
