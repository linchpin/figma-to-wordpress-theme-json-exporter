<table width="100%">
	<tr>
		<td align="left" width="70%">
			<strong>Figma to WordPress theme.json Exporter</strong><br />
			A Figma plugin that exports Figma variables to WordPress theme.json, imports theme.json back into Figma variables, and validates files for seamless design-to-development workflows.
		</td>
		<td align="center" width="30%">
			<a href="https://github.com/linchpin/figma-wordpress-theme-json-sync"><img src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" alt="Maintained: yes" /></a>
			<a href="https://github.com/linchpin/figma-wordpress-theme-json-sync/blob/develop/LICENSE.md"><img src="https://img.shields.io/github/license/linchpin/figma-wordpress-theme-json-sync" alt="License" /></a>
			<a href="https://github.com/linchpin/figma-wordpress-theme-json-sync"><img src="https://img.shields.io/badge/support-beta-blueviolet.svg" alt="Support: Beta" /></a>
		</td>
	</tr>
	<tr>
		<td>
			A <strong><a href="https://linchpin.com">Linchpin</a></strong> project · <em>Actively maintained</em> · Originally forked from <a href="https://github.com/10up/figma-to-wordpress-theme-json-exporter">10up's Figma to theme.json plugin</a>
		</td>
		<td align="center" width="30%">
			<img src="https://assets.linchpin.com/linchpin-logo-primary.svg" width="100" alt="Linchpin" />
		</td>
	</tr>
</table>

## What is this plugin?

This Figma plugin powers a bidirectional workflow between Figma variables and WordPress theme.json. It exports design tokens into theme.json (placing custom variables under `settings.custom`), imports theme.json back into Figma variable collections, and validates theme.json files before you create or merge variables.

> **Note:** This is a heavily modified fork of the original [10up Figma to theme.json plugin](https://github.com/10up/figma-to-wordpress-theme-json-exporter). This fork has changed dramatically and is now the more stable, actively evolving track for our workflows. The 10up version remains supported and stays closer to the original scope.

## Why use this plugin?

### **Design token conversion**
- **Figma variables to theme.json** — Export colors, spacing, typography, and other design tokens directly to WordPress format.
- **CSS custom properties** — Automatically converts variable references using WordPress naming conventions (`--wp--custom--*`).
- **Proper structure** — Places all variables under `settings.custom` according to WordPress theme.json specification.

### **Preset generation**
- **Typography presets** — Convert Figma text styles to WordPress typography presets with proper line height conversion (120% → 1.2).
- **Color presets** — Generate WordPress color palette from Figma color variables with customizable selection via an interactive modal.
- **Spacing presets** — Create WordPress spacing presets from Figma spacing variables with automatic fluid spacing detection.

### **Bidirectional workflow**
- **theme.json import** — Create Figma variable collections from `settings.custom`, `settings.color.palette`, `settings.typography.fontSizes`, and `settings.spacing.spacingSizes`.
- **Preview + conflict checks** — See what collections and variables will be created before importing.
- **Schema-aware validation** — Validates theme.json structure and schema (when available) with actionable errors and warnings.

### **Advanced features**
- **Responsive/fluid variables** — Supports Desktop/Mobile mode pairs for fluid typography and spacing.
- **Color modes & sections** — Export multiple color modes as separate WordPress style variation files.
- **Button variants** — Automatic generation of button variant style files for WordPress block styles.
- **Base theme merging** — Merge variables into an existing theme.json file while preserving all settings.

### **Developer experience**
- **Multi-file export** — Automatic zip packaging when exporting complex themes with multiple style files.
- **Resizable interface** — Drag to resize the plugin window for better workflow integration.
- **Clean output** — Omits empty or invalid properties rather than using fallbacks.

## Usage

### Export to theme.json

For a full export walkthrough, presets, and multi-file output details, see **[EXPORT-GUIDE.md](wiki/EXPORT-GUIDE.md)**.

1. **To export Figma variables to theme.json:**
   - Go to Menu > Plugins > WordPress Theme.json Export > Export to theme.json
   - Optionally upload an existing theme.json file to merge variables into it
   - Configure export options (typography, color presets, spacing presets)
   - Click "Export Variables" to generate the theme files
   - View the generated theme.json and additional style files in the plugin UI
   - Click "Download Theme Files" to save all files as a zip package

### Export Options

2. **To merge with an existing theme.json:**
   - Click "Choose File" in the Base theme.json section
   - Select your existing theme.json file
   - The plugin will merge your Figma variables into the existing theme structure
   - All existing theme.json settings and styles will be preserved
   - New variables will be added under settings.custom

3. **Typography Presets:**
   - Check "Generate typography presets from text styles"
   - The plugin will convert all local text styles in your Figma document
   - Typography presets are added to `settings.custom.typography.presets`
   - See [TYPOGRAPHY-GUIDE.md](wiki/TYPOGRAPHY-GUIDE.md) for detailed information

4. **Color Presets:**
   - Check "Generate color presets from color variables"
   - Click "Customize" to select specific colors from your collections
   - Use the color selection modal to choose which variables to include
   - Color presets are added to `settings.color.palette`
   - Supports preview of actual color values and organized by collection
   - See [COLOR-PRESETS-GUIDE.md](wiki/COLOR-PRESETS-GUIDE.md) for detailed information

5. **Spacing Presets:**
   - Check "Generate spacing presets from spacing variables"
   - The plugin automatically detects spacing-related variables
   - Spacing presets are added to `settings.spacing.spacingSizes`
   - See [SPACING-GUIDE.md](wiki/SPACING-GUIDE.md) for detailed information

### Import from theme.json

1. **To create Figma variables from a theme.json file:**
   - Go to Menu > Plugins > WordPress Theme.json Export > Import from theme.json
   - Upload a theme.json file or paste JSON directly
   - Review validation status and warnings before continuing
   - Preview which collections and variables will be created
   - Click "Import" to create variable collections in Figma

2. **Importable sections (v3):**
   - `settings.custom` → Primitives collection
   - `settings.color.palette` → `wp.settings.colors` collection
   - `settings.typography.fontSizes` → `wp.settings.typography` collection
   - `settings.spacing.spacingSizes` → `wp.settings.spacing` collection

### Validation

- Validation runs before preview/import and reports errors and warnings inline.
- Checks include required fields, version, structural rules, and schema validation (when the WordPress schema is reachable).
- Warnings highlight missing sections, unsupported areas, or unknown top-level keys so you can fix issues before import.

### Plugin Interface Features

- **Resizable Interface**: Drag the resize handle in the bottom-right corner to adjust plugin size
- **File Preview**: View generated files with syntax highlighting and copy functionality
- **Multi-file Download**: Automatic zip packaging when multiple files are generated
- **Error Handling**: Clear error messages and validation feedback

## WordPress theme.json Structure

The plugin generates a valid WordPress theme.json file with all variables placed under the `settings.custom` section:

```json
{
  "version": 3,
  "settings": {
    "custom": {
      "color": {
        "primary": "#000000",
        "secondary": "#ffffff",
        "accent": "var(--wp--custom--color--primary)",
        "button": {
          "default": {
            "background": "var(--wp--custom--color--button--primary--default--background)",
            "text": "var(--wp--custom--color--button--primary--default--text)"
          },
          "hover": {
            "background": "var(--wp--custom--color--button--primary--hover--background)",
            "text": "var(--wp--custom--color--button--primary--hover--text)"
          }
        }
      },
      "spacing": {
        "base": "8px",
        "large": "24px"
      }
    }
  }
}
```

### Base Theme Merging

When uploading an existing theme.json file:
- The plugin preserves all existing theme settings and styles
- New variables from Figma are merged into the `settings.custom` section
- Existing custom variables with the same name are updated with new values
- Other sections of the theme.json file remain untouched
- Color modes and button styles are still exported as separate files

### Collection Processing Architecture

The plugin uses a sophisticated processor-based architecture to handle different types of Figma variable collections. Each collection is processed by a specific processor based on its name and structure, ensuring optimal handling for different use cases.

### Processor System

The plugin employs a list of processors that are evaluated in sequence:

1. **Primitives Processor** - Handles the "Primitives" collection as the base theme
2. **WordPress Settings Colors Processor** - Processes color collections for palette generation
3. **WordPress Settings Subset Processor** - Handles layout, spacing, typography, and shadow collections
4. **WordPress Settings Extended Processor** - Handles background, border, dimensions, and position collections (theme.json v3)
5. **WordPress Settings Processor** - Processes general WordPress settings collections
6. **WordPress Styles Global Processor** - Handles `wp.styles` collections for body-level styles
7. **WordPress Elements Processor** - Handles element-specific collections (buttons, headings, links, etc.)
8. **WordPress Blocks Processor** - Handles block-specific collections (`wp.blocks.{namespace/block}`)
9. **Fallback Selected Processor** - Catches any remaining collections and adds them to custom settings

### Collection Types and Processing

#### Primitives Collection

Variables from a collection named "Primitives" are used as the base theme and are always processed first:
- Merged directly into `settings.custom` without a namespace
- Serves as the foundation for all other custom variables
- Always processed first in the processor chain

#### WordPress Settings Collections

Collections following the `wp.settings.*` naming convention are processed according to their specific type:

**Color Collections (`wp.settings.color`)**
- Intentionally NOT merged into `settings.custom`
- Colors are surfaced via palette presets instead of custom variables
- Button styles are extracted and processed separately

**Subset Collections (`wp.settings.layout`, `wp.settings.spacing`, `wp.settings.typography`, `wp.settings.shadow`)**
- Merged directly into the corresponding WordPress settings section
- Example: `wp.settings.spacing` variables go into `settings.spacing`
- Supports deep merging with existing settings

**General Settings Collections (`wp.settings`)**
- Known WordPress settings keys are merged into the appropriate sections
- Unknown keys are placed under `settings.custom`
- Supports both exact matches and nested paths

#### WordPress Elements Collections

Collections following the `wp.elements.*` naming convention:
- Processed into `styles.elements` structure
- Special handling for button elements with automatic style file generation
- Supports nested element paths (e.g., `wp.elements.buttons` → `styles.elements.button`)

#### Fallback Processing

Any collection not matched by specific processors:
- Automatically added to `settings.custom` with sanitized naming
- Color-related properties are filtered out to prevent conflicts
- Ensures all variables are captured regardless of naming conventions

### Processing Order and Priority

The processor system ensures that:
- More specific processors run before general ones
- WordPress-specific collections are handled appropriately
- All collections are processed regardless of naming conventions
- No variables are lost during the export process

This architecture provides flexibility for different design system approaches while maintaining compatibility with WordPress theme.json standards.

### Legacy Collection Handling

For backward compatibility, the plugin also provides special handling for certain legacy collection names:

#### Color Collection with Multiple Modes

If a collection named "Color" has multiple modes:
- The first mode is merged into the main theme.json
- Each mode (including the first) is also exported as a separate file: `styles/section-{mode-name}.json`
- These files include proper metadata for WordPress theme variations

#### Button Styles

When the "Color" collection includes a "button" group with variants:
- Button variant properties from the primary button are referenced at the root level with CSS variables
- Each non-primary button variant (e.g., secondary, tertiary, etc.) is exported as a separate file: `styles/button-{variant-name}.json`
- These files include proper metadata for WordPress block style variations

### Typography Handling

The plugin can generate typography presets from Figma text styles:

- Font family, size, weight, and line height are extracted from text styles
- Line height values in percentage format (120%) are automatically converted to decimal format (1.2) as required by WordPress
- Text decoration properties (color, style, thickness, offset) are properly handled
- The plugin omits empty or invalid properties rather than using fallbacks to ensure clean output

### Responsive/Fluid Variables

If a collection has exactly two modes named "Desktop" and "Mobile", the plugin treats them as responsive variables:

```json
{
  "spacing": {
    "base": {
      "fluid": "true",
      "min": "8px",
      "max": "16px"
    }
  }
}
```

Note: The "fluid" property is output as a string value "true" rather than a boolean to ensure compatibility with WordPress theme.json parsing.

### Units Handling

The plugin automatically adds "px" units to numeric values in appropriate categories:
- spacing
- font
- size
- grid
- radius
- width
- height

### CSS Custom Properties

The plugin automatically converts references between variables to WordPress CSS custom property format. According to WordPress conventions:

- All custom properties are prefixed with `--wp--custom--`
- Each level of nesting adds another `--` separator
- CamelCase names are converted to kebab-case (lowercase with hyphens)

For example:
```
settings.custom.colorPalette.brandAccent → var(--wp--custom--color-palette--brand-accent)
```

This ensures that your theme.json file follows WordPress best practices and that all variable references will work correctly in your theme.

For more information on the WordPress theme.json format, see the [WordPress documentation](https://developer.wordpress.org/block-editor/how-to-guides/themes/global-settings-and-styles/).

## Color Presets

The plugin can generate WordPress color presets from your Figma color variables, making them available in the WordPress block editor's color picker. For comprehensive information about this feature, see [COLOR-PRESETS-GUIDE.md](wiki/COLOR-PRESETS-GUIDE.md).

### Quick Overview

- Processes color variables from all collections except "Primitives"
- Customizable selection through an interactive modal interface
- Organized by collection with visual color previews
- Creates WordPress color presets under `settings.color.palette`

## Spacing Presets

The plugin automatically generates WordPress spacing presets from Figma spacing variables. For detailed information about spacing presets, see [SPACING-GUIDE.md](wiki/SPACING-GUIDE.md).

### Quick Overview

- Processes variables from "Spacing" and "Primitives" collections
- Automatically detects spacing-related keywords (spacing, gap, margin, padding, size)
- Special handling for fluid spacing variables (e.g., `24_16` becomes "Fluid (16 → 24)")
- Creates WordPress spacing presets under `settings.spacing.spacingSizes`

## Output Files

The plugin generates several types of files depending on your configuration and Figma setup:

### Core Files

1. **Main theme.json**
   - Contains the base theme settings from the "Primitives" collection
   - Includes the first mode of the "Color" collection
   - Contains all custom variables under `settings.custom`
   - Includes typography, color, and spacing presets if enabled

### Style Variation Files

2. **Section Files** (when applicable)
   - Located in the "styles" directory
   - File naming: `section-{mode-name}.json`
   - Generated for Color collections with multiple modes
   - Each file represents a color mode that can be applied to groups or sections
   - Includes proper WordPress theme variation metadata

3. **Button Style Files** (when applicable)
   - Located in the "styles" directory
   - File naming: `button-{variant-name}.json`
   - Generated when button variants are found in the Color collection
   - Each file represents a button style variant for WordPress block styles
   - Includes proper WordPress block style variation metadata

### File Generation Logic

- **Single file**: When only basic variables are exported without additional modes or button variants
- **Multiple files**: When Color collections have multiple modes or button variants are detected
- **Automatic zip packaging**: When multiple files are generated, they're automatically packaged into a zip file for download

### File Structure Example

For a complex setup, you might get:
```
wordpress-theme-files.zip
├── theme.json                    # Main theme file
└── styles/
    ├── section-light.json        # Light color mode
    ├── section-dark.json         # Dark color mode
    ├── button-secondary.json     # Secondary button variant
    └── button-tertiary.json      # Tertiary button variant
```

All files are packed into a single zip download for easy use in WordPress themes.

## Detailed Guides

For comprehensive information on specific features, see these detailed guides:

- **[EXPORT-GUIDE.md](wiki/EXPORT-GUIDE.md)** - Full export workflow, presets, and output details
- **[INSTALL.md](wiki/INSTALL.md)** - Complete installation and setup instructions
- **[NAMING-CONVENTIONS.md](wiki/NAMING-CONVENTIONS.md)** - Complete naming conventions reference for collections and variables
- **[BLOCKS-GUIDE.md](wiki/BLOCKS-GUIDE.md)** - Block-level styling with `wp.blocks.*` collections
- **[ELEMENTS-GUIDE.md](wiki/ELEMENTS-GUIDE.md)** - Element-level styling with `wp.elements.*` collections
- **[TYPOGRAPHY-GUIDE.md](wiki/TYPOGRAPHY-GUIDE.md)** - Typography presets and text style conversion
- **[COLOR-PRESETS-GUIDE.md](wiki/COLOR-PRESETS-GUIDE.md)** - Color presets and customization modal
- **[SPACING-GUIDE.md](wiki/SPACING-GUIDE.md)** - Spacing presets and variable detection
- **[FLUID-VARIABLES-GUIDE.md](wiki/FLUID-VARIABLES-GUIDE.md)** - Responsive/fluid variables setup
- **[DEVELOPER.md](wiki/DEVELOPER.md)** - Architecture, code structure, and contribution guide for developers

## Development

This plugin uses TypeScript and the Figma Plugin API.

| Dependency   | Description |
| ------------ | ----------- |
| **TypeScript** | Source language for type-safe development. |
| **Figma Plugin API** | Interface for accessing Figma document data. |
| **esbuild** | Fast bundler for building the plugin. |

```bash
npm install        # Install dependencies
npm run watch      # Watch for changes during development
npm run build      # Build for production
```

For architecture details and contribution guidelines, see [DEVELOPER.md](wiki/DEVELOPER.md).

## Support

**Beta:** This project is actively maintained but still evolving. Bug reports, feature requests, and pull requests are welcome. Please be cautious using this in production environments.

- [Open an issue](https://github.com/linchpin/figma-wordpress-theme-json-sync/issues) for bugs or feature requests
- [View the changelog](https://github.com/linchpin/figma-wordpress-theme-json-sync/blob/develop/CHANGELOG.md) for release history

## Contributing

This project uses [Conventional Commits](https://www.conventionalcommits.org/) for commit messages, enforced via [commitlint](https://commitlint.js.org/) and [husky](https://typicode.github.io/husky/). Releases are automated using [Release Please](https://github.com/googleapis/release-please).

### Commit Message Format

```
<type>(<scope>): <description>

[optional body]
[optional footer(s)]
```

| Type | Description |
| ---- | ----------- |
| **feat** | New feature (triggers minor version bump) |
| **fix** | Bug fix (triggers patch version bump) |
| **docs** | Documentation only |
| **style** | Code style changes (formatting, etc.) |
| **refactor** | Code refactoring |
| **perf** | Performance improvements |
| **test** | Adding or updating tests |
| **build** | Build system or dependencies |
| **ci** | CI/CD configuration |
| **chore** | Other changes |

When commits are merged to develop, Release Please automatically creates a Release PR with updated changelog and version bump.

## Credits

This plugin is a fork of the original [Figma to theme.json plugin](https://github.com/10up/figma-to-wordpress-theme-json-exporter) by [10up](https://10up.com/). We appreciate their foundational work which made this project possible.

## License

[MIT License](LICENSE.md) · Copyright © [Linchpin](https://linchpin.com)
