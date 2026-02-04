# Developer Documentation

This document provides technical documentation for developers contributing to the Figma to WordPress theme.json Exporter plugin.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Directory Structure](#directory-structure)
- [Plugin Entry Point](#plugin-entry-point)
- [Message Protocol](#message-protocol)
- [Data Flow](#data-flow)
- [Collection Processor System](#collection-processor-system)
- [Key Modules](#key-modules)
- [Utility Functions](#utility-functions)
- [Adding New Features](#adding-new-features)
- [Testing](#testing)

## Architecture Overview

The plugin follows a dual-thread architecture required by Figma plugins:

```
┌─────────────────────────────────────────────────────────────┐
│                        UI Thread                            │
│  ┌─────────────────┐    ┌─────────────────────────────────┐│
│  │  export.html    │    │      css-vars.html              ││
│  │  - File upload  │    │      - Apply CSS var syntax     ││
│  │  - Options UI   │    │      - Status display           ││
│  │  - Preview      │    │                                 ││
│  │  - Download     │    │                                 ││
│  └────────┬────────┘    └────────────────┬────────────────┘│
│           │                              │                  │
│           └──────────────┬───────────────┘                  │
│                          │ postMessage                      │
└──────────────────────────┼──────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                          │                                  │
│  ┌───────────────────────▼────────────────────────────────┐│
│  │                    code.ts                             ││
│  │                (Message Router)                        ││
│  └───────────────────────┬────────────────────────────────┘│
│                          │                                  │
│  ┌───────────────────────▼────────────────────────────────┐│
│  │                 export/index.ts                        ││
│  │              (Export Orchestrator)                     ││
│  └───────────────────────┬────────────────────────────────┘│
│                          │                                  │
│  ┌───────────────────────▼────────────────────────────────┐│
│  │              collections/registry.ts                   ││
│  │              (Processor Dispatch)                      ││
│  └───────────────────────┬────────────────────────────────┘│
│                          │                                  │
│  ┌───────────────────────▼────────────────────────────────┐│
│  │              collections/processors/*                  ││
│  │   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐     ││
│  │   │ primitives  │ │ wp-settings │ │ wp-elements │     ││
│  │   └─────────────┘ └─────────────┘ └─────────────┘     ││
│  └────────────────────────────────────────────────────────┘│
│                        Code Thread                          │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
src/
├── code.ts                      # Plugin entry point, message handler
├── types.ts                     # TypeScript interfaces and types
│
├── export/
│   └── index.ts                 # Main export orchestration (exportToJSON)
│
├── collection/
│   └── index.ts                 # processCollectionData, processCollectionModeData
│
├── collections/
│   ├── types.ts                 # CollectionProcessor interface
│   ├── registry.ts              # Processor registration and dispatch
│   └── processors/
│       ├── primitives.ts        # Primitives collection processor
│       ├── wp-settings.ts       # wp.settings.* processor
│       ├── wp-settings-colors.ts# wp.settings.color processor
│       ├── wp-settings-subset.ts# wp.settings.{layout,spacing,...}
│       ├── wp-elements.ts       # wp.elements.* processor
│       └── fallback-selected.ts # Fallback for selected non-wp collections
│
├── color/
│   └── index.ts                 # Color preset generation
│
├── typography/
│   └── index.ts                 # Typography preset generation
│
├── spacing/
│   └── index.ts                 # Spacing preset generation
│
├── button/
│   └── index.ts                 # Button variant style generation
│
└── utils/
    ├── index.ts                 # Core utilities (merge, format, convert)
    ├── css.ts                   # CSS custom property builders
    ├── color.ts                 # RGB to Hex conversion
    ├── figma-variables.ts       # CSS variable syntax application
    └── validation.ts            # theme.json validation utilities
```

## Plugin Entry Point

The main entry point is `src/code.ts`. It handles:

1. **UI Initialization** - Shows the appropriate UI based on the command
2. **Message Routing** - Dispatches incoming messages to handlers
3. **Response Coordination** - Sends results back to the UI

### Commands

| Command | UI File | Description |
|---------|---------|-------------|
| `export` | export.html | Main export interface |
| `css-vars` | css-vars.html | CSS variable syntax utility |

### Message Handlers

```typescript
figma.ui.onmessage = async (msg) => {
  switch (msg.type) {
    case 'EXPORT':           // Trigger exportToJSON()
    case 'GET_COLOR_PRESETS': // Return color presets for UI
    case 'GET_COLLECTIONS':   // Return available collections
    case 'APPLY_CSS_VAR_SYNTAX': // Apply CSS var syntax
    case 'RESIZE':            // Handle window resize
  }
};
```

## Message Protocol

### Request Messages (UI → Code)

```typescript
// Export request
{ type: 'EXPORT', options: ExportOptions }

// Get color presets for customization modal
{ type: 'GET_COLOR_PRESETS', selectedCollectionIds?: string[] }

// Get available collections
{ type: 'GET_COLLECTIONS' }

// Apply CSS variable syntax
{ type: 'APPLY_CSS_VAR_SYNTAX', overwriteExisting: boolean }

// Resize plugin window
{ type: 'RESIZE', width: number, height: number }
```

### Response Messages (Code → UI)

```typescript
// Export result
{
  type: 'EXPORT_RESULT',
  files: Array<{ fileName: string; body: object }>,
  error?: string
}

// Color presets for customization
{
  type: 'COLOR_PRESETS_RESULT',
  colorPresets: ColorPresetData[]
}

// Available collections
{
  type: 'COLLECTIONS_RESULT',
  collections: Array<{ id, name, modeCount, variableCount }>
}
```

## Data Flow

### Export Flow

```
exportToJSON(options)
    │
    ├─1. Fetch local variable collections from Figma
    │
    ├─2. Filter collections (by selectedCollections if provided)
    │
    ├─3. Identify and process Primitives collection first
    │
    ├─4. Route remaining collections through processor registry
    │   ├── primitivesProcessor
    │   ├── wpSettingsColorsProcessor
    │   ├── wpSettingsSubsetProcessor
    │   ├── wpSettingsProcessor
    │   ├── wpElementsProcessor
    │   └── fallbackSelectedProcessor
    │
    ├─5. Process each mode's variables
    │   ├── Convert colors to hex
    │   ├── Resolve variable aliases to CSS var references
    │   ├── Handle fluid variables (Desktop/Mobile modes)
    │   └── Apply unit formatting (px, rem)
    │
    ├─6. Generate specialized presets
    │   ├── Color presets → settings.color.palette
    │   ├── Typography presets → settings.typography
    │   └── Spacing presets → settings.spacing.spacingSizes
    │
    ├─7. Generate button variant style files
    │
    ├─8. Construct final theme.json structure
    │
    └─9. Return files array
```

### Variable Processing

For each variable in a collection:

1. **Fetch Details** - Get name, resolvedType, valuesByMode
2. **Extract Value** - Get value for target mode (Desktop for fluid)
3. **Resolve Aliases** - Follow VARIABLE_ALIAS chains (max 10 hops)
4. **Convert Values**
   - Colors: RGB → Hex/RGBA
   - Numbers: Add units (px/rem)
   - Aliases: Convert to `var(--wp--custom--...)`
5. **Build Nested Structure** - Split name by "/" to create object hierarchy
6. **Merge into Theme** - Route to appropriate location

## Collection Processor System

The processor system uses a chain-of-responsibility pattern. Each processor:
- Has a `matches(name)` function to determine if it handles a collection
- Has a `process(collection, ctx, options)` function to process the collection

### Processor Interface

```typescript
// src/collections/types.ts
interface CollectionProcessor {
  matches: (collectionName: string) => boolean;
  process: (
    collection: VariableCollection,
    ctx: ProcessorContext,
    options: ExportOptions
  ) => Promise<void>;
}

interface ProcessorContext {
  themeJson: object;           // Main theme.json being built
  allFiles: FileOutput[];      // Additional output files
  processedVariants: Set<string>; // Track processed button variants
}
```

### Processor Chain

Processors are evaluated in order. The first matching processor handles the collection:

| Order | Processor | Matches | Destination |
|-------|-----------|---------|-------------|
| 1 | primitivesProcessor | `primitives` (case-insensitive) | settings.custom |
| 2 | wpSettingsColorsProcessor | `wp.settings.color` or `wp.settings.colors` | Button styles only |
| 3 | wpSettingsSubsetProcessor | `wp.settings.{layout\|spacing\|typography\|shadow}` | settings.{subset} |
| 4 | wpSettingsProcessor | `wp.settings.*` | settings or settings.custom |
| 5 | wpElementsProcessor | `wp.elements.*` | styles.elements |
| 6 | fallbackSelectedProcessor | Everything else | settings.custom |

### Adding a New Processor

1. Create a new file in `src/collections/processors/`:

```typescript
// src/collections/processors/my-processor.ts
import { CollectionProcessor } from '../types';
import { processCollectionData } from '../../collection';

export const myProcessor: CollectionProcessor = {
  matches: (name: string) => {
    return name.toLowerCase().startsWith('my-prefix.');
  },

  process: async (collection, ctx, options) => {
    const data = await processCollectionData(collection, options);

    // Process and merge data into ctx.themeJson
    // Or add files to ctx.allFiles
  }
};
```

2. Register in `src/collections/registry.ts`:

```typescript
import { myProcessor } from './processors/my-processor';

export const collectionProcessors: CollectionProcessor[] = [
  primitivesProcessor,
  myProcessor,  // Add in appropriate order
  // ... other processors
  fallbackSelectedProcessor, // Always keep last
];
```

## Key Modules

### Export Module (`src/export/index.ts`)

Main function: `exportToJSON(options: ExportOptions)`

Coordinates the entire export process. Creates the base theme.json structure, routes collections through processors, and generates presets.

### Collection Module (`src/collection/index.ts`)

Functions:
- `processCollectionData(collection, options)` - Process entire collection
- `processCollectionModeData(collection, mode, options)` - Process single mode

Handles the core logic of converting Figma variables to theme.json structure.

### Color Module (`src/color/index.ts`)

Functions:
- `getColorPresets(selectedColorIds?)` - Get presets with CSS var references
- `getColorPresetsWithValues(selectedColorIds?)` - Get presets with actual hex values
- `getAllColorPresets(selectedCollectionIds?)` - Get all presets for UI display

### Typography Module (`src/typography/index.ts`)

Functions:
- `getWordPressTypographyPresets(options?)` - Modern WordPress typography structure
- `getTypographyPresets(options?)` - Legacy preset structure

Converts Figma text styles to WordPress typography presets.

### Button Module (`src/button/index.ts`)

Function: `processButtonStyles(buttonData, allFiles)`

Generates separate theme.json style files for button variants (secondary, tertiary, outline, etc.).

## Utility Functions

### Core Utilities (`src/utils/index.ts`)

| Function | Purpose |
|----------|---------|
| `isVariableAlias(value)` | Check if value is VARIABLE_ALIAS type |
| `isWordPressSettingsCollection(name)` | Detect wp.settings.* collections |
| `isWordPressElementsCollection(name)` | Detect wp.elements.* collections |
| `mergeCollectionData(target, path, data)` | Deep merge at path |
| `deepMerge(target, source)` | Recursive object merge |
| `shouldAddPxUnit(nameParts, value)` | Determine if px units needed |
| `formatValueWithUnits(nameParts, value)` | Add appropriate units |
| `toCamelCase(input)` | Convert to camelCase |
| `convertPxToRem(pxValue)` | Convert pixels to rem |

### CSS Utilities (`src/utils/css.ts`)

| Function | Purpose |
|----------|---------|
| `buildWpCustomPropertyPath(nameParts)` | Build `--wp--custom--...` path |
| `buildCssVarReference(nameParts)` | Build `var(--wp--custom--...)` |
| `sanitizeCollectionName(name)` | Convert to valid CSS property |
| `camelToKebabCase(value)` | Convert camelCase to kebab-case |

### Color Utilities (`src/utils/color.ts`)

| Function | Purpose |
|----------|---------|
| `rgbToHex(color)` | Convert RGB object to hex string |

## Adding New Features

### Adding a New Export Option

1. Add the option to `ExportOptions` in `src/types.ts`:

```typescript
interface ExportOptions {
  // ... existing options
  myNewOption?: boolean;
}
```

2. Update the export.html UI to include the option
3. Handle the option in `src/export/index.ts`

### Adding a New Preset Type

1. Create a new module in `src/{preset-type}/index.ts`
2. Implement functions to extract and format the preset data
3. Call your function from `exportToJSON()` in `src/export/index.ts`
4. Merge the output into the appropriate theme.json location

### Supporting a New Variable Type

1. Update `processCollectionModeData()` in `src/collection/index.ts`
2. Add conversion logic for the new type
3. Update unit handling in `src/utils/index.ts` if needed

## Testing

The project uses Vitest for testing.

### Running Tests

```bash
npm run test          # Run tests in watch mode
npm run test:run      # Run tests once
npm run test:coverage # Generate coverage report
```

### Test Structure

Tests are co-located with source files using the `.test.ts` extension:

```
src/
├── utils/
│   ├── index.ts
│   └── index.test.ts
├── color/
│   ├── index.ts
│   └── index.test.ts
```

### Writing Tests

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from './index';

describe('myFunction', () => {
  it('should handle basic case', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

## Build Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Build for production |
| `npm run watch` | Watch mode for development |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run lint:types` | TypeScript type checking |
| `npm run test` | Run tests in watch mode |
| `npm run test:coverage` | Generate coverage report |

## Key Implementation Patterns

### Nested Object Building

Variables with paths create nested structures:

```typescript
// Variable: "color/button/primary/background"
// Becomes:
{
  color: {
    button: {
      primary: {
        background: value
      }
    }
  }
}
```

### Fluid Variables

Collections with Desktop/Mobile modes produce fluid objects:

```typescript
// Desktop: 32px, Mobile: 16px
{
  "fluid": "true",
  "min": "16px",
  "max": "32px"
}
```

### Variable Aliases

Aliases are converted to CSS variable references:

```typescript
// Figma: References "color/primary"
// Output: "var(--wp--custom--color--primary)"
```

### WordPress Preset References

For wp.elements colors, aliases can export as preset references:

```typescript
// elementsColorExportMode: "preset"
// Output: "var:preset|color|primary"
```
