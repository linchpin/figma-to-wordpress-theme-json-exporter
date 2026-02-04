/**
 * WordPress theme.json v3 Type Definitions
 * Based on: https://schemas.wp.org/trunk/theme.json
 */

// =============================================================================
// Top-Level Theme JSON Structure
// =============================================================================

export interface ThemeJsonV3 {
  $schema?: string;
  version: 3;
  title?: string;
  slug?: string;
  description?: string;
  blockTypes?: string[];
  settings?: ThemeSettings;
  styles?: ThemeStyles;
  customTemplates?: CustomTemplate[];
  templateParts?: TemplatePart[];
  patterns?: string[];
}

// =============================================================================
// Settings
// =============================================================================

export interface ThemeSettings {
  appearanceTools?: boolean;
  background?: BackgroundSettings;
  border?: BorderSettings;
  color?: ColorSettings;
  custom?: Record<string, any>;
  dimensions?: DimensionsSettings;
  layout?: LayoutSettings;
  lightbox?: LightboxSettings;
  position?: PositionSettings;
  shadow?: ShadowSettings;
  spacing?: SpacingSettings;
  typography?: TypographySettings;
  useRootPaddingAwareAlignments?: boolean;
  blocks?: BlockSettings;
}

export interface BackgroundSettings {
  backgroundImage?: boolean;
  backgroundSize?: boolean;
}

export interface BorderSettings {
  color?: boolean;
  radius?: boolean;
  style?: boolean;
  width?: boolean;
}

export interface ColorSettings {
  background?: boolean;
  button?: boolean;
  caption?: boolean;
  custom?: boolean;
  customDuotone?: boolean;
  customGradient?: boolean;
  defaultDuotone?: boolean;
  defaultGradients?: boolean;
  defaultPalette?: boolean;
  duotone?: DuotonePreset[];
  gradients?: GradientPreset[];
  heading?: boolean;
  link?: boolean;
  palette?: ColorPreset[];
  text?: boolean;
}

export interface DimensionsSettings {
  aspectRatio?: boolean;
  minHeight?: boolean;
}

export interface LayoutSettings {
  contentSize?: string;
  wideSize?: string;
  allowEditing?: boolean;
  allowCustomContentAndWideSize?: boolean;
}

export interface LightboxSettings {
  enabled?: boolean;
  allowEditing?: boolean;
}

export interface PositionSettings {
  sticky?: boolean;
}

export interface ShadowSettings {
  defaultPresets?: boolean;
  presets?: ShadowPreset[];
}

export interface SpacingSettings {
  blockGap?: boolean | null;
  customSpacingSize?: boolean;
  margin?: boolean;
  padding?: boolean;
  spacingSizes?: SpacingPreset[];
  spacingScale?: SpacingScale;
  units?: string[];
}

export interface SpacingScale {
  operator?: '+' | '*';
  increment?: number;
  steps?: number;
  mediumStep?: number;
  unit?: string;
}

export interface TypographySettings {
  customFontSize?: boolean;
  defaultFontSizes?: boolean;
  dropCap?: boolean;
  fluid?: boolean | FluidTypography;
  fontFamilies?: FontFamilyPreset[];
  fontSizes?: FontSizePreset[];
  fontStyle?: boolean;
  fontWeight?: boolean;
  letterSpacing?: boolean;
  lineHeight?: boolean;
  textAlign?: boolean;
  textColumns?: boolean;
  textDecoration?: boolean;
  textTransform?: boolean;
  writingMode?: boolean;
}

export interface FluidTypography {
  minFontSize?: string;
  maxViewportWidth?: string;
  minViewportWidth?: string;
}

export interface BlockSettings {
  [blockName: string]: Partial<ThemeSettings>;
}

// =============================================================================
// Presets
// =============================================================================

export interface ColorPreset {
  name: string;
  slug: string;
  color: string;
}

export interface DuotonePreset {
  name: string;
  slug: string;
  colors: [string, string];
}

export interface GradientPreset {
  name: string;
  slug: string;
  gradient: string;
}

export interface ShadowPreset {
  name: string;
  slug: string;
  shadow: string;
}

export interface SpacingPreset {
  name: string;
  slug: string;
  size: string;
}

export interface FontFamilyPreset {
  name: string;
  slug: string;
  fontFamily: string;
  fontFace?: FontFace[];
}

export interface FontFace {
  fontFamily: string;
  fontWeight?: string | number;
  fontStyle?: string;
  fontStretch?: string;
  src: string | string[];
  fontDisplay?: 'auto' | 'block' | 'fallback' | 'optional' | 'swap';
  ascentOverride?: string;
  descentOverride?: string;
  fontVariant?: string;
  fontFeatureSettings?: string;
  fontVariationSettings?: string;
  lineGapOverride?: string;
  sizeAdjust?: string;
  unicodeRange?: string;
}

export interface FontSizePreset {
  name: string;
  slug: string;
  size: string;
  fluid?: boolean | FluidFontSize;
}

export interface FluidFontSize {
  min?: string;
  max?: string;
}

// =============================================================================
// Styles
// =============================================================================

export interface ThemeStyles {
  background?: StyleBackground;
  border?: StyleBorder;
  color?: StyleColor;
  css?: string;
  dimensions?: StyleDimensions;
  elements?: StyleElements;
  blocks?: StyleBlocks;
  filter?: StyleFilter;
  outline?: StyleOutline;
  shadow?: string;
  spacing?: StyleSpacing;
  typography?: StyleTypography;
  variations?: StyleVariations;
}

export interface StyleBackground {
  backgroundImage?: string | BackgroundImageValue;
  backgroundPosition?: string;
  backgroundRepeat?: string;
  backgroundSize?: string;
}

export interface BackgroundImageValue {
  url?: string;
  ref?: string;
}

export interface StyleBorder {
  color?: string;
  radius?: string | BorderRadius;
  style?: string;
  width?: string;
  top?: BorderSide;
  right?: BorderSide;
  bottom?: BorderSide;
  left?: BorderSide;
}

export interface BorderRadius {
  topLeft?: string;
  topRight?: string;
  bottomLeft?: string;
  bottomRight?: string;
}

export interface BorderSide {
  color?: string;
  style?: string;
  width?: string;
}

export interface StyleColor {
  background?: string;
  gradient?: string;
  text?: string;
}

export interface StyleDimensions {
  aspectRatio?: string;
  minHeight?: string;
}

export interface StyleFilter {
  duotone?: string;
}

export interface StyleOutline {
  color?: string;
  offset?: string;
  style?: string;
  width?: string;
}

export interface StyleSpacing {
  blockGap?: string;
  margin?: SpacingValue;
  padding?: SpacingValue;
}

export interface SpacingValue {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
}

export interface StyleTypography {
  fontFamily?: string;
  fontSize?: string;
  fontStyle?: string;
  fontWeight?: string;
  letterSpacing?: string;
  lineHeight?: string;
  textColumns?: string | number;
  textDecoration?: string;
  textTransform?: string;
  writingMode?: string;
}

// =============================================================================
// Elements
// =============================================================================

export interface StyleElements {
  button?: ElementStyle;
  caption?: ElementStyle;
  cite?: ElementStyle;
  code?: ElementStyle;
  heading?: ElementStyle;
  h1?: ElementStyle;
  h2?: ElementStyle;
  h3?: ElementStyle;
  h4?: ElementStyle;
  h5?: ElementStyle;
  h6?: ElementStyle;
  link?: ElementStyle & LinkPseudoSelectors;
}

export interface ElementStyle extends BaseStyle, PseudoSelectors {}

export interface BaseStyle {
  border?: StyleBorder;
  color?: StyleColor;
  spacing?: StyleSpacing;
  typography?: StyleTypography;
  shadow?: string;
  outline?: StyleOutline;
}

export interface PseudoSelectors {
  ':hover'?: BaseStyle;
  ':focus'?: BaseStyle;
  ':active'?: BaseStyle;
}

export interface LinkPseudoSelectors extends PseudoSelectors {
  ':visited'?: BaseStyle;
  ':link'?: BaseStyle;
}

// =============================================================================
// Blocks
// =============================================================================

export interface StyleBlocks {
  [blockName: string]: BlockStyle;
}

export interface BlockStyle extends BaseStyle, PseudoSelectors {
  elements?: StyleElements;
  variations?: BlockVariations;
}

export interface BlockVariations {
  [variationName: string]: BaseStyle & PseudoSelectors;
}

export interface StyleVariations {
  [variationName: string]: ThemeStyles;
}

// =============================================================================
// Templates
// =============================================================================

export interface CustomTemplate {
  name: string;
  title: string;
  postTypes?: string[];
}

export interface TemplatePart {
  name: string;
  title?: string;
  area?: 'header' | 'footer' | 'sidebar' | 'uncategorized' | string;
}

// =============================================================================
// Constants
// =============================================================================

/**
 * Valid WordPress element names for styles.elements
 */
export const VALID_ELEMENTS = [
  'button',
  'caption',
  'cite',
  'code',
  'heading',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'link',
] as const;

export type ValidElement = typeof VALID_ELEMENTS[number];

/**
 * Valid pseudo-selectors for elements and blocks
 */
export const VALID_PSEUDO_SELECTORS = [
  ':hover',
  ':focus',
  ':active',
  ':visited',
  ':link',
] as const;

export type ValidPseudoSelector = typeof VALID_PSEUDO_SELECTORS[number];

/**
 * WordPress core block namespaces
 */
export const CORE_BLOCK_PREFIX = 'core/';

/**
 * Common WordPress core blocks
 */
export const COMMON_CORE_BLOCKS = [
  'core/button',
  'core/buttons',
  'core/paragraph',
  'core/heading',
  'core/image',
  'core/gallery',
  'core/list',
  'core/list-item',
  'core/quote',
  'core/code',
  'core/preformatted',
  'core/pullquote',
  'core/table',
  'core/verse',
  'core/group',
  'core/columns',
  'core/column',
  'core/cover',
  'core/media-text',
  'core/separator',
  'core/spacer',
  'core/navigation',
  'core/navigation-link',
  'core/site-title',
  'core/site-logo',
  'core/site-tagline',
  'core/query',
  'core/post-template',
  'core/post-title',
  'core/post-content',
  'core/post-date',
  'core/post-excerpt',
  'core/post-featured-image',
  'core/post-terms',
  'core/template-part',
  'core/search',
  'core/social-links',
  'core/social-link',
  'core/file',
  'core/audio',
  'core/video',
  'core/embed',
  'core/shortcode',
  'core/archives',
  'core/categories',
  'core/latest-posts',
  'core/latest-comments',
  'core/calendar',
  'core/rss',
  'core/tag-cloud',
  'core/page-list',
] as const;
