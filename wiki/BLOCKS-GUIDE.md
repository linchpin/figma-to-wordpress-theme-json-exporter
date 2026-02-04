# Block Styling Guide

This guide explains how to create Figma variable collections that generate WordPress block-level styles in theme.json.

## Overview

WordPress theme.json allows you to define styles for specific blocks. This plugin supports creating block collections in Figma that export to the `styles.blocks` section of theme.json.

## Collection Naming Patterns

The plugin supports two patterns for organizing block styles:

### Pattern 1: Group-Based (Recommended)

Create a single `wp.blocks` collection and organize variables using Figma's group hierarchy:

```
Collection: wp.blocks
  └── Group: core
        ├── cover
        │     └── color/background
        │     └── color/text
        └── heading
              └── color/text
```

Variable naming pattern: `{namespace}/{block-name}/{property-path}`

| Variable Name | Block Target | Property |
|--------------|--------------|----------|
| `core/cover/color/background` | `core/cover` | `color.background` |
| `core/heading/color/text` | `core/heading` | `color.text` |
| `acf/hero/spacing/padding` | `acf/hero` | `spacing.padding` |

### Pattern 2: Collection-Per-Block (Legacy)

Create separate collections for each block. Note: Figma interprets `/` in collection names as folder separators, which may cause issues.

```
wp.blocks.{namespace}/{block-name}
```

| Collection Name | Block Target |
|-----------------|--------------|
| `wp.blocks.core/button` | WordPress core button block |
| `wp.blocks.core/paragraph` | WordPress core paragraph block |
| `wp.blocks.core/heading` | WordPress core heading block |
| `wp.blocks.acf/hero` | ACF custom hero block |
| `wp.blocks.theme/feature-card` | Theme custom feature card block |

---

## Core vs Custom Blocks

### Core Blocks

WordPress core blocks use the `core/` namespace. The plugin recognizes these and displays a blue "Core" badge in the UI.

Common core blocks:
- `core/button`, `core/buttons`
- `core/paragraph`
- `core/heading`
- `core/image`, `core/gallery`
- `core/list`, `core/list-item`
- `core/quote`, `core/pullquote`
- `core/group`, `core/columns`, `core/column`
- `core/cover`, `core/media-text`
- `core/navigation`, `core/navigation-link`
- `core/query`, `core/post-template`
- `core/search`

### Custom Blocks

Any non-core namespace is treated as a custom block and displays a purple "Custom" badge.

Common namespaces:
- `acf/` - Advanced Custom Fields blocks
- `theme/` - Theme-specific blocks
- `plugin-name/` - Plugin-provided blocks

---

## Variable Structure

Within a block collection, organize variables by their style category.

### Supported Style Categories

| Category | Description |
|----------|-------------|
| `color` | Background, text, and gradient colors |
| `typography` | Font family, size, weight, style, line height |
| `spacing` | Padding, margin, block gap |
| `border` | Border color, radius, style, width |
| `shadow` | Box shadow |
| `dimensions` | Min height, aspect ratio |
| `filter` | Duotone filter |
| `outline` | Outline properties |

### Variable Path Structure

```
{category}/{property}
{category}/{subcategory}/{property}
:{pseudo-selector}/{category}/{property}
```

---

## Pseudo-Selector Support

Blocks support the following pseudo-selectors:

| Selector | Usage |
|----------|-------|
| `:hover` | Mouse hover state |
| `:focus` | Keyboard focus state |
| `:active` | Active/pressed state |

### Example with Pseudo-Selectors

Collection: `wp.blocks.core/button`

Variables:
```
color/background           → Default background
color/text                 → Default text color
:hover/color/background    → Hover background
:hover/color/text          → Hover text color
:focus/color/background    → Focus background
:focus/outline/color       → Focus outline color
:active/color/background   → Active/pressed background
```

---

## Nested Elements in Blocks

Blocks can contain nested element styles using the `elements/` prefix.

### Structure

```
elements/{element-name}/{category}/{property}
```

### Example: Button Block with Link Element

Collection: `wp.blocks.core/button`

Variables:
```
color/background           → Block background
elements/link/color/text   → Link text color inside button
elements/link/:hover/color/text → Link hover color
```

Output:
```json
{
  "styles": {
    "blocks": {
      "core/button": {
        "color": {
          "background": "#0073aa"
        },
        "elements": {
          "link": {
            "color": {
              "text": "#ffffff"
            },
            ":hover": {
              "color": {
                "text": "#cccccc"
              }
            }
          }
        }
      }
    }
  }
}
```

---

## Complete Example

### Collection: `wp.blocks.core/button`

Variables in Figma:
```
color/background
color/text
typography/fontSize
typography/fontWeight
spacing/padding/top
spacing/padding/right
spacing/padding/bottom
spacing/padding/left
border/radius
:hover/color/background
:hover/color/text
:focus/outline/color
:focus/outline/width
:focus/outline/offset
```

### Output (theme.json)

```json
{
  "styles": {
    "blocks": {
      "core/button": {
        "color": {
          "background": "#0073aa",
          "text": "#ffffff"
        },
        "typography": {
          "fontSize": "16px",
          "fontWeight": "600"
        },
        "spacing": {
          "padding": {
            "top": "12px",
            "right": "24px",
            "bottom": "12px",
            "left": "24px"
          }
        },
        "border": {
          "radius": "4px"
        },
        ":hover": {
          "color": {
            "background": "#005a87",
            "text": "#ffffff"
          }
        },
        ":focus": {
          "outline": {
            "color": "#005a87",
            "width": "2px",
            "offset": "2px"
          }
        }
      }
    }
  }
}
```

---

## Using Preset References

For color values, you can reference WordPress palette presets:

### In Figma

Create a variable alias that references your color palette:

```
color/background → alias to wp.settings.colors/primary
```

### Export Mode

When exporting, choose the color export mode:
- **Use color values**: Exports resolved hex values
- **Use palette preset references**: Exports `var:preset|color|{slug}` references

### Output with Preset Reference

```json
{
  "styles": {
    "blocks": {
      "core/button": {
        "color": {
          "background": "var:preset|color|primary",
          "text": "var:preset|color|white"
        }
      }
    }
  }
}
```

---

## UI Features

### Block Detection

The plugin automatically detects all `wp.blocks.*` collections and displays them in the "Detected Blocks" section of the Configure step.

### Block Badges

- **Blue "Core" badge**: WordPress core blocks (`core/*`)
- **Purple "Custom" badge**: Custom/third-party blocks

### Collapsible List

Click the "Detected Blocks" header to expand or collapse the list.

---

## Best Practices

1. **Match WordPress block names exactly**: Use the correct namespace and block name as registered in WordPress

2. **Use semantic color references**: Reference your color palette variables instead of hardcoding hex values

3. **Test in WordPress**: Validate that your block styles apply correctly in the block editor

4. **Consider cascade**: Block styles override global and element styles, so use them intentionally

5. **Group related blocks**: Consider creating a naming convention for your custom blocks (e.g., `theme/hero`, `theme/testimonial`)

---

## Validation Warnings

The plugin validates block collection names and will display warnings for:
- Invalid block name format (missing namespace or block name)
- Invalid pseudo-selectors

Warnings are non-blocking - export continues but you're informed of potential issues.

---

## Related Guides

- [Naming Conventions](./NAMING-CONVENTIONS.md) - Complete naming reference
- [Elements Guide](./ELEMENTS-GUIDE.md) - Element-level styling
- [Color Presets Guide](./COLOR-PRESETS-GUIDE.md) - Color palette configuration
