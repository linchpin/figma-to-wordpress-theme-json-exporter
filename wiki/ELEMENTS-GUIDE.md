# Element Styling Guide

This guide explains how to create Figma variable collections that generate WordPress element-level styles in theme.json.

## Overview

WordPress theme.json allows you to define styles for HTML elements across your entire theme. This plugin supports creating element collections in Figma that export to the `styles.elements` section of theme.json.

## Collection Naming Pattern

Element collections must follow this naming convention:

```
wp.elements.{element-name}
```

Or create a single collection for all elements:

```
wp.elements
```

---

## Valid Element Names

WordPress theme.json v3 supports the following elements:

| Element | Description |
|---------|-------------|
| `button` | Button elements and button-styled links |
| `link` | Anchor (`<a>`) elements |
| `heading` | All heading levels (h1-h6) |
| `h1` | Heading level 1 |
| `h2` | Heading level 2 |
| `h3` | Heading level 3 |
| `h4` | Heading level 4 |
| `h5` | Heading level 5 |
| `h6` | Heading level 6 |
| `caption` | Caption elements |
| `cite` | Citation elements |
| `code` | Code/preformatted elements |

---

## Collection Approaches

### Approach 1: Single Collection for All Elements

Create one collection `wp.elements` and organize by element:

```
button/color/background
button/color/text
button/:hover/color/background
link/color/text
link/:hover/color/text
heading/typography/fontFamily
h1/typography/fontSize
h2/typography/fontSize
```

### Approach 2: Separate Collection per Element

Create individual collections:

- `wp.elements.button`
- `wp.elements.link`
- `wp.elements.heading`

Variables in `wp.elements.button`:
```
color/background
color/text
:hover/color/background
:hover/color/text
```

---

## Pseudo-Selector Support

Different elements support different pseudo-selectors:

### All Elements

| Selector | Description |
|----------|-------------|
| `:hover` | Mouse hover state |
| `:focus` | Keyboard focus state |
| `:active` | Active/pressed state |

### Link Element Only

| Selector | Description |
|----------|-------------|
| `:visited` | Visited link state |
| `:link` | Unvisited link state |

### Example: Link with All States

Collection: `wp.elements.link`

Variables:
```
color/text              → Default link color
:hover/color/text       → Hover state
:focus/color/text       → Focus state
:active/color/text      → Active/pressed state
:visited/color/text     → Visited link color
:link/color/text        → Unvisited link color
```

---

## Style Categories

Elements support the following style categories:

| Category | Properties |
|----------|------------|
| `color` | `background`, `text`, `gradient` |
| `typography` | `fontFamily`, `fontSize`, `fontWeight`, `fontStyle`, `lineHeight`, `letterSpacing`, `textDecoration`, `textTransform` |
| `spacing` | `padding`, `margin` (with `top`, `right`, `bottom`, `left`) |
| `border` | `color`, `radius`, `style`, `width` (with directional variants) |
| `shadow` | Box shadow value |
| `outline` | `color`, `offset`, `style`, `width` |

---

## Complete Examples

### Button Element

Collection: `wp.elements.button`

Variables:
```
color/background
color/text
typography/fontSize
typography/fontWeight
typography/fontFamily
spacing/padding/top
spacing/padding/right
spacing/padding/bottom
spacing/padding/left
border/radius
border/width
border/style
border/color
:hover/color/background
:hover/color/text
:hover/border/color
:focus/outline/color
:focus/outline/width
:focus/outline/offset
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
        "typography": {
          "fontSize": "16px",
          "fontWeight": "600",
          "fontFamily": "var(--wp--preset--font-family--system)"
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
          "radius": "4px",
          "width": "0px",
          "style": "solid",
          "color": "transparent"
        },
        ":hover": {
          "color": {
            "background": "#005a87",
            "text": "#ffffff"
          },
          "border": {
            "color": "transparent"
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

### Link Element

Collection: `wp.elements.link`

Variables:
```
color/text
typography/textDecoration
:hover/color/text
:hover/typography/textDecoration
:focus/color/text
:focus/outline/color
:visited/color/text
```

Output:
```json
{
  "styles": {
    "elements": {
      "link": {
        "color": {
          "text": "#0073aa"
        },
        "typography": {
          "textDecoration": "underline"
        },
        ":hover": {
          "color": {
            "text": "#005a87"
          },
          "typography": {
            "textDecoration": "none"
          }
        },
        ":focus": {
          "color": {
            "text": "#005a87"
          },
          "outline": {
            "color": "#005a87"
          }
        },
        ":visited": {
          "color": {
            "text": "#551a8b"
          }
        }
      }
    }
  }
}
```

### Heading Hierarchy

Collection: `wp.elements` (single collection approach)

Variables:
```
heading/typography/fontFamily
heading/typography/fontWeight
heading/typography/lineHeight
h1/typography/fontSize
h2/typography/fontSize
h3/typography/fontSize
h4/typography/fontSize
h5/typography/fontSize
h6/typography/fontSize
```

Output:
```json
{
  "styles": {
    "elements": {
      "heading": {
        "typography": {
          "fontFamily": "var(--wp--preset--font-family--heading)",
          "fontWeight": "700",
          "lineHeight": "1.2"
        }
      },
      "h1": {
        "typography": {
          "fontSize": "48px"
        }
      },
      "h2": {
        "typography": {
          "fontSize": "36px"
        }
      },
      "h3": {
        "typography": {
          "fontSize": "28px"
        }
      },
      "h4": {
        "typography": {
          "fontSize": "24px"
        }
      },
      "h5": {
        "typography": {
          "fontSize": "20px"
        }
      },
      "h6": {
        "typography": {
          "fontSize": "16px"
        }
      }
    }
  }
}
```

---

## Using Preset References

For color values, you can reference WordPress palette presets.

### Export Mode Options

In the Configure step, choose the "Elements color export" mode:

- **Use color values**: Exports resolved hex values (e.g., `#0073aa`)
- **Use palette preset references**: Exports WordPress references (e.g., `var:preset|color|primary`)

### Output Comparison

With color values:
```json
{
  "color": {
    "text": "#0073aa"
  }
}
```

With preset references:
```json
{
  "color": {
    "text": "var:preset|color|primary"
  }
}
```

---

## Button Variants

When you have button color variants in your `wp.elements.button` collection (e.g., secondary, tertiary), the plugin automatically generates button style variation files.

### Detected Variants

The plugin detects these button variant names:
- `secondary`
- `tertiary`
- `outline`
- `ghost`
- `link`
- `destructive`

### Variable Structure for Variants

In `wp.elements.button`:
```
color/button/primary/default/background
color/button/primary/hover/background
color/button/secondary/default/background
color/button/secondary/hover/background
color/button/tertiary/default/background
color/button/tertiary/hover/background
```

### Generated Files

The plugin generates separate style files:
- `styles/button-secondary.json`
- `styles/button-tertiary.json`

These are WordPress block style variations that can be selected in the block editor.

---

## Validation Warnings

The plugin validates element names and pseudo-selectors. You'll see warnings for:

- Unknown element names (not in the valid list)
- Invalid pseudo-selectors
- Using `:visited` or `:link` on non-link elements

Warnings are non-blocking - export continues but you're informed of potential issues.

---

## Best Practices

1. **Start with `heading` for base styles**: Define common heading styles in `heading`, then override specific levels in `h1`, `h2`, etc.

2. **Consider accessibility**: Always define `:focus` styles for interactive elements

3. **Use semantic colors**: Reference your color palette instead of hardcoding values

4. **Test link states**: Ensure `:visited` links are still readable

5. **Mind the cascade**: Element styles apply globally - use blocks for specific components

6. **Use `buttons` or `button`**: The plugin normalizes `wp.elements.buttons` to `button` automatically

---

## Related Guides

- [Naming Conventions](./NAMING-CONVENTIONS.md) - Complete naming reference
- [Blocks Guide](./BLOCKS-GUIDE.md) - Block-level styling
- [Color Presets Guide](./COLOR-PRESETS-GUIDE.md) - Color palette configuration
