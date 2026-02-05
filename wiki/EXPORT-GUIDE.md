# Export Guide

## Overview

The exporter converts Figma variables into a WordPress theme.json v3 file. Custom variables are placed under `settings.custom`, with optional preset generation for typography, color, and spacing. When color modes or button variants are detected, the exporter writes additional style variation files and bundles everything into a zip.

## Quick Start

1. In Figma, go to Menu > Plugins > WordPress Theme.json Export > Export to theme.json.
2. (Optional) Upload an existing theme.json to merge into.
3. Choose export options (typography, color presets, spacing presets).
4. Click "Export Variables".
5. Review the generated files and click "Download Theme Files".

## Export Options

### Base theme merge

- Upload a base theme.json to preserve existing settings and styles.
- Variables from Figma are merged in, with custom variables placed under `settings.custom`.
- Existing custom variables with the same name are updated.

### Preset generation

- Typography presets can be created from local text styles.
- Color presets are created from color variables (with a selection modal).
- Spacing presets are created from spacing variables and support fluid detection.

See **[TYPOGRAPHY-GUIDE.md](TYPOGRAPHY-GUIDE.md)**, **[COLOR-PRESETS-GUIDE.md](COLOR-PRESETS-GUIDE.md)**, and **[SPACING-GUIDE.md](SPACING-GUIDE.md)** for detailed behavior.

### Collection routing

The exporter routes collections based on their names (for example, `wp.settings.*`, `wp.elements.*`, `wp.blocks.*`). Use the naming conventions guide to make sure collections end up in the intended theme.json sections.

See **[NAMING-CONVENTIONS.md](NAMING-CONVENTIONS.md)** for the full mapping rules.

### Responsive and fluid variables

Collections with exactly two modes named "Desktop" and "Mobile" are treated as fluid variables, producing objects with `min` and `max` values. See **[FLUID-VARIABLES-GUIDE.md](FLUID-VARIABLES-GUIDE.md)** for setup details.

### Color modes and button variants

- Color collections with multiple modes can generate section style variations (`styles/section-*.json`).
- Button variants in color collections can generate block style variations (`styles/button-*.json`).

## Output Files

Typical output:

```
wordpress-theme-files.zip
├── theme.json
└── styles/
    ├── section-light.json
    ├── section-dark.json
    ├── button-secondary.json
    └── button-tertiary.json
```

A single `theme.json` is produced when no variations are detected; otherwise, the exporter bundles multiple files into a zip for download.

## Tips

- Publish variables and keep collections organized for predictable output.
- Use the preview panel to sanity check generated files before downloading.
- When exporting WordPress blocks or elements, align collection names with the naming conventions guide.
