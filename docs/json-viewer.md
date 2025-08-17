# NHS-Styled JsonViewer Component

A reusable React component to display JSON with NHS styling and accessible collapsible sections.

## Location

`client/src/components/common/JsonViewer.jsx`

## Features

- __NHS styling__: Uses NHS.UK classes and the native `details` pattern.
- __Nested collapse__: Objects/arrays render as nested `details` you can expand/collapse.
- __No metadata clutter__: Labels/values only (no “object, X keys” or “array, N items”).
- __Toolbar__: Copy JSON to clipboard, Expand all, Collapse all.
- __Accessible__: ARIA labels and live region feedback on copy.
- __Consistent behavior__: All top-level sections default closed; nested toggles don’t collapse the whole tree.

## Props

- `title: string` – Section title for the root details header.
- `data: any` – JSON value to render.
- `initiallyOpen?: boolean` – Currently ignored to maintain consistent behavior (default closed for parity across sections).

## Notes on behavior

- Expand/Collapse all interacts with the full subtree, using the DOM `open` attribute on nested `details`.
- Nested `details` stop the `toggle` event from bubbling to the root; root `toggle` is tracked with `currentTarget` to avoid unintended “collapse all”.
- The toolbar aligns right and maintains consistent button heights and spacing.

## Usage

```jsx
import JsonViewer from '../components/common/JsonViewer';

<JsonViewer title="Patient resource" data={patient} />
```

## Related files

- Synthea page usage: `client/src/pages/SyntheaPage.jsx`
- Synthea API: `client/src/services/syntheaApi.js`
