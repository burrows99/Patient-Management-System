# Frontend Triage Description Refactor — Engineering Story

Date: 2025-08-17
Status: In progress (phase 1 complete)
Owners: Web Frontend

## Context and Goals
- The `Triage Simulator` description page contained long, monolithic JSX with mixed content and structure.
- Goals:
  - Improve modularity and maintainability
  - Align with NHS.UK Design System for tabs, panels, and accessibility
  - Enable easier iteration on datasets, methodology, and baseline content

## Summary of Changes
- Implemented NHS.UK tabs in `client/src/pages/TriageSimulatorDescriptionPage.jsx` with proper ARIA and `nhsuk-tabs` classes.
- Split large text blocks into topic components in `client/src/components/common/text/`:
  - `DatasetsContent.jsx` (dataset comparison table + inset summary)
  - `MethodologyContent.jsx` (hybrid MoA pipeline and step-wise training approach)
  - `BaselineContent.jsx` (current triage methods, bottlenecks, references)
- Replaced inline content in the page with the new components; ensured only one visible panel at a time using `aria-hidden` and `hidden`.
- Fixed import paths and cleaned up unused imports.

## Why This Approach
- **SRP & modularity:** Each topic is its own component for readability and reuse.
- **Accessibility:** Conforms to NHS.UK tabs pattern (roles, aria attributes, hidden panels) improving keyboard/screen reader behavior.
- **Consistency:** Centralises NHS styles and patterns; content components can be reused elsewhere if needed.

## Notable Learnings & Insights (from diffs and tests)
- **Hidden vs aria-hidden:** Use both `hidden` and `aria-hidden` on non-active panels to avoid screen reader exposure of inactive content.
- **Avoid duplicate content:** Methodology narrative was duplicated under datasets; consolidation improved clarity and reduced maintenance.
- **Refactor safety:** Introducing components first, then wiring tabs, avoided large diff conflicts.
- **Import hygiene:** Shared links component lives at `components/common/links/ExternalLink`. Content components under `text/` should import via `../links/ExternalLink`.

## Alternatives Considered
- **Single long page with anchors:** Simpler, but poorer UX and accessibility vs tabs.
- **Third-party tabs library:** Unnecessary; NHS.UK provides a clear pattern.
- **Markdown pipeline:** Considered MDX for content, but JSX components better match NHS classes and interactivity for now.

## Next Steps
- **Keyboard navigation:** Add left/right arrow navigation between tabs while preserving anchor semantics.
- **Deep linking:** Sync URL hash to active tab to allow direct linking and back/forward behavior.
- **Content QA:** Pass through clinical review for terminology and claims in `MethodologyContent.jsx` and `BaselineContent.jsx`.
- **Unit tests (lightweight):** Snapshot tests for `TriageSimulatorDescriptionPage.jsx` to ensure tab visibility logic and imports don’t regress.
- **Docs alignment:** Keep this story updated as we iterate (record decisions, PR links, and screenshots).

## File Map (after refactor)
- `client/src/pages/TriageSimulatorDescriptionPage.jsx` — tabs container and CTA
- `client/src/components/common/text/DatasetsContent.jsx`
- `client/src/components/common/text/MethodologyContent.jsx`
- `client/src/components/common/text/BaselineContent.jsx`
- `client/src/components/common/links/ExternalLink.jsx`

## References
- NHS Design System — Tabs: https://service-manual.nhs.uk/design-system/components/tabs
- NHS Design System — Accessibility guidance: https://service-manual.nhs.uk/accessibility
