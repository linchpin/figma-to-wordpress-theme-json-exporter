import { describe, it, expect } from 'vitest';
import {
	parseThemeJson,
	inferVariableType,
	isCssVarReference,
	parseCssVarReference,
	hexToFigmaRgba,
	rgbToFigmaRgba,
	colorToFigmaRgba,
	parseCssSize,
	flattenToVariablePaths,
	slugToVariablePath,
	toDisplayName,
	getCollectionNameForSection,
} from './parser';

describe('parseThemeJson', () => {
	it('should parse valid JSON string input', () => {
		const result = parseThemeJson('{"version": 3, "settings": {}}');
		expect(result.version).toBe(3);
	});

	it('should accept object input directly', () => {
		const result = parseThemeJson({ version: 3, settings: {} });
		expect(result.version).toBe(3);
	});

	it('should throw on invalid JSON string', () => {
		expect(() => parseThemeJson('not json')).toThrow('Invalid JSON');
	});

	it('should throw when input is not an object', () => {
		expect(() => parseThemeJson('null')).toThrow('Theme.json must be an object');
		expect(() => parseThemeJson('"string"')).toThrow('Theme.json must be an object');
	});

	it('should throw on unsupported version', () => {
		expect(() => parseThemeJson({ version: 1 })).toThrow('Unsupported theme.json version: 1');
		expect(() => parseThemeJson({ version: 4 })).toThrow('Unsupported theme.json version: 4');
		expect(() => parseThemeJson({})).toThrow('Unsupported theme.json version');
	});

	it('should accept version 2', () => {
		const result = parseThemeJson({ version: 2 });
		expect(result.version).toBe(2);
	});

	it('should accept version 3', () => {
		const result = parseThemeJson({ version: 3 });
		expect(result.version).toBe(3);
	});
});

describe('inferVariableType', () => {
	it('should return COLOR for hex colors', () => {
		expect(inferVariableType('#fff')).toBe('COLOR');
		expect(inferVariableType('#ff0000')).toBe('COLOR');
		expect(inferVariableType('#ff000080')).toBe('COLOR');
	});

	it('should return COLOR for rgb/rgba values', () => {
		expect(inferVariableType('rgb(255, 0, 0)')).toBe('COLOR');
		expect(inferVariableType('rgba(255, 0, 0, 0.5)')).toBe('COLOR');
	});

	it('should return COLOR for hsl/hsla values', () => {
		expect(inferVariableType('hsl(120, 100%, 50%)')).toBe('COLOR');
		expect(inferVariableType('hsla(120, 100%, 50%, 0.5)')).toBe('COLOR');
	});

	it('should return FLOAT for size values with units', () => {
		expect(inferVariableType('16px')).toBe('FLOAT');
		expect(inferVariableType('1rem')).toBe('FLOAT');
		expect(inferVariableType('1.5em')).toBe('FLOAT');
		expect(inferVariableType('100%')).toBe('FLOAT');
		expect(inferVariableType('50vh')).toBe('FLOAT');
		expect(inferVariableType('50vw')).toBe('FLOAT');
	});

	it('should return FLOAT for plain numeric strings', () => {
		expect(inferVariableType('16')).toBe('FLOAT');
		expect(inferVariableType('1.5')).toBe('FLOAT');
		expect(inferVariableType('-3')).toBe('FLOAT');
	});

	it('should return FLOAT for clamp() functions', () => {
		expect(inferVariableType('clamp(16px, 2vw, 32px)')).toBe('FLOAT');
	});

	it('should return FLOAT for number type', () => {
		expect(inferVariableType(16)).toBe('FLOAT');
		expect(inferVariableType(0)).toBe('FLOAT');
	});

	it('should return BOOLEAN for boolean values', () => {
		expect(inferVariableType(true)).toBe('BOOLEAN');
		expect(inferVariableType(false)).toBe('BOOLEAN');
	});

	it('should return STRING for other strings', () => {
		expect(inferVariableType('Inter, sans-serif')).toBe('STRING');
		expect(inferVariableType('hello world')).toBe('STRING');
	});

	it('should return null for CSS var references', () => {
		expect(inferVariableType('var(--wp--preset--color--primary)')).toBeNull();
		expect(inferVariableType('var:preset|color|primary')).toBeNull();
	});

	it('should return null for null/undefined', () => {
		expect(inferVariableType(null)).toBeNull();
		expect(inferVariableType(undefined)).toBeNull();
	});

	it('should handle fluid value objects', () => {
		expect(inferVariableType({ fluid: 'true', min: '16px', max: '32px' })).toBe('FLOAT');
		expect(inferVariableType({ fluid: true, min: '16px', max: '32px' })).toBe('FLOAT');
	});
});

describe('isCssVarReference', () => {
	it('should return true for var() format', () => {
		expect(isCssVarReference('var(--wp--preset--color--primary)')).toBe(true);
	});

	it('should return true for var: format', () => {
		expect(isCssVarReference('var:preset|color|primary')).toBe(true);
	});

	it('should return false for hex colors', () => {
		expect(isCssVarReference('#ff0000')).toBe(false);
	});

	it('should return false for non-string values', () => {
		expect(isCssVarReference(42)).toBe(false);
		expect(isCssVarReference(null)).toBe(false);
		expect(isCssVarReference({})).toBe(false);
	});
});

describe('parseCssVarReference', () => {
	it('should parse var:preset|type|slug format', () => {
		const result = parseCssVarReference('var:preset|color|primary');
		expect(result).toEqual({ type: 'preset', path: ['color', 'primary'] });
	});

	it('should parse var(--wp--custom--...) format', () => {
		const result = parseCssVarReference('var(--wp--custom--spacing--base)');
		expect(result).toEqual({ type: 'custom', path: ['spacing', 'base'] });
	});

	it('should parse var(--wp--preset--...) format', () => {
		const result = parseCssVarReference('var(--wp--preset--color--primary)');
		expect(result).toEqual({ type: 'preset', path: ['color', 'primary'] });
	});

	it('should return null for non-matching values', () => {
		expect(parseCssVarReference('#ff0000')).toBeNull();
		expect(parseCssVarReference('16px')).toBeNull();
	});
});

describe('hexToFigmaRgba', () => {
	it('should parse 3-digit hex', () => {
		const result = hexToFigmaRgba('#fff');
		expect(result).toEqual({ r: 1, g: 1, b: 1, a: 1 });
	});

	it('should parse 6-digit hex', () => {
		const result = hexToFigmaRgba('#ff0000');
		expect(result).toEqual({ r: 1, g: 0, b: 0, a: 1 });
	});

	it('should parse 8-digit hex with alpha', () => {
		const result = hexToFigmaRgba('#ff000080');
		expect(result.r).toBeCloseTo(1, 2);
		expect(result.g).toBeCloseTo(0, 2);
		expect(result.b).toBeCloseTo(0, 2);
		expect(result.a).toBeCloseTo(0.502, 1);
	});

	it('should return values in 0-1 range', () => {
		const result = hexToFigmaRgba('#808080');
		expect(result.r).toBeCloseTo(0.502, 1);
		expect(result.g).toBeCloseTo(0.502, 1);
		expect(result.b).toBeCloseTo(0.502, 1);
	});

	it('should throw for invalid hex', () => {
		expect(() => hexToFigmaRgba('#zz')).toThrow('Invalid hex color');
	});
});

describe('rgbToFigmaRgba', () => {
	it('should parse rgb(255, 0, 0)', () => {
		const result = rgbToFigmaRgba('rgb(255, 0, 0)');
		expect(result).toEqual({ r: 1, g: 0, b: 0, a: 1 });
	});

	it('should parse rgba(255, 0, 0, 0.5)', () => {
		const result = rgbToFigmaRgba('rgba(255, 0, 0, 0.5)');
		expect(result).toEqual({ r: 1, g: 0, b: 0, a: 0.5 });
	});

	it('should throw for invalid rgb string', () => {
		expect(() => rgbToFigmaRgba('not-rgb')).toThrow('Invalid RGB color');
	});
});

describe('colorToFigmaRgba', () => {
	it('should route hex to hexToFigmaRgba', () => {
		const result = colorToFigmaRgba('#ff0000');
		expect(result).toEqual({ r: 1, g: 0, b: 0, a: 1 });
	});

	it('should route rgb to rgbToFigmaRgba', () => {
		const result = colorToFigmaRgba('rgb(0, 255, 0)');
		expect(result).toEqual({ r: 0, g: 1, b: 0, a: 1 });
	});

	it('should throw for unsupported formats', () => {
		expect(() => colorToFigmaRgba('hsl(120, 100%, 50%)')).toThrow('Unsupported color format');
	});
});

describe('parseCssSize', () => {
	it('should parse px values', () => {
		expect(parseCssSize('16px')).toBe(16);
	});

	it('should parse rem values (base 16)', () => {
		expect(parseCssSize('1rem')).toBe(16);
		expect(parseCssSize('2rem')).toBe(32);
	});

	it('should parse em values (base 16)', () => {
		expect(parseCssSize('1.5em')).toBe(24);
	});

	it('should parse unitless numbers', () => {
		expect(parseCssSize('16')).toBe(16);
	});

	it('should parse clamp() extracting max value', () => {
		expect(parseCssSize('clamp(16px, 2vw, 32px)')).toBe(32);
	});

	it('should throw for invalid size strings', () => {
		expect(() => parseCssSize('invalid')).toThrow('Invalid size value');
	});
});

describe('flattenToVariablePaths', () => {
	it('should flatten nested object to path/value pairs', () => {
		const result = flattenToVariablePaths({ color: { primary: '#ff0000' } });
		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({
			path: 'color/primary',
			value: '#ff0000',
			type: 'COLOR',
			isReference: false,
		});
	});

	it('should handle deeply nested objects', () => {
		const result = flattenToVariablePaths({ spacing: { padding: { top: '16px' } } });
		expect(result).toHaveLength(1);
		expect(result[0].path).toBe('spacing/padding/top');
	});

	it('should handle fluid value objects without recursing', () => {
		const result = flattenToVariablePaths({ size: { fluid: 'true', min: '16px', max: '32px' } });
		expect(result).toHaveLength(1);
		expect(result[0].path).toBe('size');
		expect(result[0].value).toEqual({ fluid: 'true', min: '16px', max: '32px' });
	});

	it('should skip null/undefined values', () => {
		const result = flattenToVariablePaths({ a: null, b: undefined, c: '16px' });
		expect(result).toHaveLength(1);
		expect(result[0].path).toBe('c');
	});

	it('should mark CSS var references', () => {
		const result = flattenToVariablePaths({ color: 'var(--wp--preset--color--primary)' });
		expect(result[0].isReference).toBe(true);
	});

	it('should infer types for each value', () => {
		const result = flattenToVariablePaths({
			color: '#ff0000',
			size: '16px',
			name: 'hello',
		});
		expect(result.find(v => v.path === 'color')?.type).toBe('COLOR');
		expect(result.find(v => v.path === 'size')?.type).toBe('FLOAT');
		expect(result.find(v => v.path === 'name')?.type).toBe('STRING');
	});
});

describe('slugToVariablePath', () => {
	it('should replace hyphens with slashes', () => {
		expect(slugToVariablePath('font-size-large')).toBe('font/size/large');
	});

	it('should leave strings without hyphens unchanged', () => {
		expect(slugToVariablePath('primary')).toBe('primary');
	});
});

describe('toDisplayName', () => {
	it('should convert camelCase to title case', () => {
		expect(toDisplayName('fontSize')).toBe('Font Size');
	});

	it('should convert kebab-case to title case', () => {
		expect(toDisplayName('font-size')).toBe('Font Size');
	});

	it('should capitalize single word', () => {
		expect(toDisplayName('primary')).toBe('Primary');
	});
});

describe('getCollectionNameForSection', () => {
	it('should return Primitives for settings.custom', () => {
		expect(getCollectionNameForSection('settings.custom')).toBe('Primitives');
	});

	it('should return wp.settings.colors for settings.color.palette', () => {
		expect(getCollectionNameForSection('settings.color.palette')).toBe('wp.settings.colors');
	});

	it('should return wp.settings.typography for settings.typography', () => {
		expect(getCollectionNameForSection('settings.typography')).toBe('wp.settings.typography');
	});

	it('should return wp.settings.spacing for settings.spacing.spacingSizes', () => {
		expect(getCollectionNameForSection('settings.spacing.spacingSizes')).toBe('wp.settings.spacing');
	});

	it('should return the section name as-is for unknown sections', () => {
		expect(getCollectionNameForSection('unknown.section')).toBe('unknown.section');
	});
});
