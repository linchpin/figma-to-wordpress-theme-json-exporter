# Naming Conventions Guide

This guide documents the naming conventions used by the Figma to WordPress theme.json exporter for converting Figma variable collections into WordPress theme.json structure.

## Collection Naming Patterns

Collections are routed to specific parts of the theme.json based on their names. Use these patterns to control where your variables end up.

### Settings Collections

| Collection Name | theme.json Target | Description |
|-----------------|-------------------|-------------|
| `Primitives` | `settings.custom` | Base design tokens (exact match, case-insensitive) |
| `wp.settings` | `settings.*` | Smart routing to settings |
| `wp.settings.color` or `wp.settings.colors` | Color palette presets | Generates `settings.color.palette` |
| `wp.settings.typography` | `settings.typography` | Typography settings |
| `wp.settings.spacing` | `settings.spacing` | Spacing settings |
| `wp.settings.layout` | `settings.layout` | Layout settings (contentSize, wideSize) |
| `wp.settings.shadow` | `settings.shadow` | Shadow presets |
| `wp.settings.background` | `settings.background` | Background settings (v3) |
| `wp.settings.border` | `settings.border` | Border settings (v3) |
| `wp.settings.dimensions` | `settings.dimensions` | Dimension settings (v3) |
| `wp.settings.position` | `settings.position` | Position settings (v3) |
| `wp.settings.custom.*` | `settings.custom.*` | Custom properties |

### Styles Collections

| Collection Name | theme.json Target | Description |
|-----------------|-------------------|-------------|
| `wp.styles` | `styles.*` | Global body-level styles |
| `wp.elements.{element}` | `styles.elements.{element}` | Element-level styles |
| `wp.blocks.{namespace/block}` | `styles.blocks.{namespace/block}` | Block-level styles |

### Fallback Behavior

Collections that don't match any pattern above are merged into `settings.custom` with a sanitized name.

---

## Variable Naming Patterns

Variables within collections use `/` (forward slash) as a separator to create nested structures.

### Basic Structure

```
category/subcategory/property
```

**Example:**
```
color/primary → { color: { primary: "#0073aa" } }
color/button/background → { color: { button: { background: "#0073aa" } } }
```

### CSS Custom Property Generation

Variables are converted to WordPress CSS custom properties following this pattern:

| Variable Path | CSS Custom Property |
|---------------|---------------------|
| `color/primary` | `--wp--custom--color--primary` |
| `spacing/base` | `--wp--custom--spacing--base` |
| `font/size/large` | `--wp--custom--font--size--large` |

### CSS Variable Reference

When referencing custom properties in theme.json values:

```
var(--wp--custom--color--primary)
```

---

## Pseudo-Selector Support

For elements and blocks, you can define pseudo-selector states by prefixing variable names with the selector.

### Supported Pseudo-Selectors

| Selector | Description |
|----------|-------------|
| `:hover` | Mouse hover state |
| `:focus` | Keyboard focus state |
| `:active` | Active/pressed state |
| `:visited` | Visited link state (link element only) |
| `:link` | Unvisited link state (link element only) |

### Variable Naming with Pseudo-Selectors

```
:hover/color/background → { ":hover": { color: { background: "#005a87" } } }
:focus/color/text → { ":focus": { color: { text: "#000000" } } }
```

### Example: Button Element with States

In collection `wp.elements.button`:

```
color/background → Default background
color/text → Default text color
:hover/color/background → Hover background
:hover/color/text → Hover text color
:focus/color/background → Focus background
```

Output:
```json
{
  "styles": {
    "elements": {
      "button": {
        "color": {
          "background": "#0073aa",
          "text": "#ffffff"
        },
        ":hover": {
          "color": {
            "background": "#005a87",
            "text": "#ffffff"
          }
        },
        ":focus": {
          "color": {
            "background": "#005a87"
          }
        }
      }
    }
  }
}
```

---

## Unit Handling

### Automatic Unit Addition

The following categories automatically receive `px` units when values are numbers:

- `spacing`
- `font`
- `size`
- `grid`
- `radius`
- `width`
- `height`

### Rem Conversion

When rem conversion is enabled, px values are converted using a 16px base:

```
16px → 1rem
24px → 1.5rem
8px → 0.5rem
```

---

## WordPress Preset References

For color values in elements and blocks, you can use WordPress palette preset references:

### Format

```
var:preset|{type}|{slug}
```

### CSS Output

```css
var(--wp--preset--color--primary)
var(--wp--preset--font-size--large)
var(--wp--preset--spacing--medium)
```

---

## Examples

### Complete Settings Collection Example

Collection: `wp.settings.typography`

Variables:
```
fluid → true
customFontSize → false
fontSizes/small/size → 14px
fontSizes/small/fluid/min → 12px
fontSizes/small/fluid/max → 14px
```

Output:
```json
{
  "settings": {
    "typography": {
      "fluid": true,
      "customFontSize": false,
      "fontSizes": [
        {
          "slug": "small",
          "size": "14px",
          "fluid": {
            "min": "12px",
            "max": "14px"
          }
        }
      ]
    }
  }
}
```

### Complete Block Collection Example

Collection: `wp.blocks.core/button`

Variables:
```
color/background → #0073aa
color/text → #ffffff
:hover/color/background → #005a87
typography/fontSize → var:preset|font-size|medium
spacing/padding/top → 12px
spacing/padding/bottom → 12px
```

Output:
```json
{
  "styles": {
    "blocks": {
      "core/button": {
        "color": {
          "background": "#0073aa",
          "text": "#ffffff"
        },
        ":hover": {
          "color": {
            "background": "#005a87"
          }
        },
        "typography": {
          "fontSize": "var:preset|font-size|medium"
        },
        "spacing": {
          "padding": {
            "top": "12px",
            "bottom": "12px"
          }
        }
      }
    }
  }
}
```

---

## Best Practices

1. **Use consistent naming**: Follow WordPress naming conventions (camelCase for properties, kebab-case for slugs)

2. **Organize by purpose**: Group related variables together using the path structure

3. **Use semantic names**: `color/primary` instead of `color/blue`

4. **Leverage aliases**: Reference primitive values from semantic collections

5. **Test output**: Always validate the generated theme.json against WordPress schema

---

## Related Guides

- [Blocks Guide](./BLOCKS-GUIDE.md) - Block-level styling
- [Elements Guide](./ELEMENTS-GUIDE.md) - Element-level styling
- [Color Presets Guide](./COLOR-PRESETS-GUIDE.md) - Color palette configuration
- [Spacing Guide](./SPACING-GUIDE.md) - Spacing presets
- [Typography Guide](./TYPOGRAPHY-GUIDE.md) - Typography configuration
