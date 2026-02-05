import { describe, it, expect, vi, beforeEach } from 'vitest';
import { importFromThemeJSON, validateThemeJSON, previewImport, checkExistingCollections } from './index';
import { mockFigma, createMockCollection, resetMockIdCounter } from '../test-setup';

// Mock fetch for schema validation
global.fetch = vi.fn();

describe('importFromThemeJSON', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		resetMockIdCounter();
		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([]);
		(global.fetch as any).mockResolvedValue({ ok: true, json: async () => ({}) });
	});

	it('returns error for missing themeJson', async () => {
		const result = await importFromThemeJSON({} as any);
		expect(result.success).toBe(false);
		expect(result.errors).toContainEqual(expect.stringContaining('Missing theme.json'));
	});

	it('returns error for invalid JSON string', async () => {
		const result = await importFromThemeJSON({ themeJson: 'not json' });
		expect(result.success).toBe(false);
		expect(result.errors.length).toBeGreaterThan(0);
	});

	it('returns error for unsupported version', async () => {
		const result = await importFromThemeJSON({ themeJson: { version: 1 } });
		expect(result.success).toBe(false);
		expect(result.errors.length).toBeGreaterThan(0);
	});

	it('successfully imports valid theme.json', async () => {
		const themeJson = {
			version: 3,
			$schema: 'https://schemas.wp.org/trunk/theme.json',
			settings: {
				custom: { color: { primary: '#ff0000' } },
			},
		};
		const result = await importFromThemeJSON({ themeJson });
		expect(result.success).toBe(true);
	});

	it('sets success based on errors', async () => {
		const result = await importFromThemeJSON({ themeJson: { version: 3, settings: {} } });
		expect(typeof result.success).toBe('boolean');
	});
});

describe('validateThemeJSON', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(global.fetch as any).mockResolvedValue({ ok: true, json: async () => ({}) });
	});

	it('validates a valid theme.json', async () => {
		const result = await validateThemeJSON({ version: 3, settings: { custom: { x: '1px' } } });
		expect(result.isValid).toBe(true);
	});

	it('returns error for unparseable JSON string', async () => {
		const result = await validateThemeJSON('bad json');
		expect(result.isValid).toBe(false);
	});

	it('warns when neither settings nor styles present', async () => {
		const result = await validateThemeJSON({ version: 3 });
		expect(result.warnings).toContainEqual(expect.stringContaining('neither settings nor styles'));
	});

	it('warns when no importable sections found', async () => {
		const result = await validateThemeJSON({ version: 3, settings: {} });
		expect(result.warnings).toContainEqual(expect.stringContaining('No importable sections'));
	});
});

describe('previewImport', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		resetMockIdCounter();
		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([]);
	});

	it('previews primitives collection', async () => {
		const input = { version: 3, settings: { custom: { color: { primary: '#ff0000' } } } };
		const result = await previewImport(input);
		expect(result.isValid).toBe(true);
		const primCollection = result.collections.find(c => c.name === 'Primitives');
		expect(primCollection).toBeDefined();
		expect(primCollection!.variableCount).toBeGreaterThan(0);
	});

	it('previews color palette collection', async () => {
		const input = { version: 3, settings: { color: { palette: [{ name: 'Primary', slug: 'primary', color: '#ff0000' }] } } };
		const result = await previewImport(input);
		const colorsCollection = result.collections.find(c => c.name === 'wp.settings.colors');
		expect(colorsCollection).toBeDefined();
		expect(colorsCollection!.variableCount).toBe(1);
	});

	it('previews typography collection', async () => {
		const input = { version: 3, settings: { typography: { fontSizes: [{ name: 'S', slug: 's', size: '13px' }] } } };
		const result = await previewImport(input);
		const typoCollection = result.collections.find(c => c.name === 'wp.settings.typography');
		expect(typoCollection).toBeDefined();
	});

	it('previews spacing collection', async () => {
		const input = { version: 3, settings: { spacing: { spacingSizes: [{ name: 'S', slug: 's', size: '8px' }] } } };
		const result = await previewImport(input);
		const spacingCollection = result.collections.find(c => c.name === 'wp.settings.spacing');
		expect(spacingCollection).toBeDefined();
	});

	it('detects existing collections', async () => {
		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([
			createMockCollection({ name: 'Primitives' }),
		]);
		const input = { version: 3, settings: { custom: { x: '1px' } } };
		const result = await previewImport(input);
		const primCollection = result.collections.find(c => c.name === 'Primitives');
		expect(primCollection?.existsAlready).toBe(true);
	});

	it('generates warnings for unsupported sections', async () => {
		const input = {
			version: 3,
			settings: {
				color: {
					gradients: [{ name: 'G', slug: 'g', gradient: 'linear-gradient(#000,#fff)' }],
					duotone: [{ name: 'D', slug: 'd', colors: ['#000', '#fff'] }],
				},
				shadow: { presets: [{ name: 'S', slug: 's', shadow: '0 0 10px' }] },
			},
			styles: {
				elements: { button: { color: { text: '#fff' } } },
				blocks: { 'core/paragraph': { color: { text: '#000' } } },
			},
		};
		const result = await previewImport(input);
		expect(result.warnings).toContainEqual(expect.stringContaining('gradient'));
		expect(result.warnings).toContainEqual(expect.stringContaining('duotone'));
		expect(result.warnings).toContainEqual(expect.stringContaining('shadow'));
	});

	it('handles parse errors gracefully', async () => {
		const result = await previewImport('invalid');
		expect(result.errors.length).toBeGreaterThan(0);
	});
});

describe('checkExistingCollections', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns existing collections that match', async () => {
		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([
			createMockCollection({ name: 'Primitives', id: 'prim-id' }),
		]);
		const result = await checkExistingCollections(['Primitives']);
		expect(result).toHaveLength(1);
		expect(result[0].name).toBe('Primitives');
	});

	it('performs case-insensitive matching', async () => {
		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([
			createMockCollection({ name: 'Primitives', id: 'prim-id' }),
		]);
		const result = await checkExistingCollections(['primitives']);
		expect(result).toHaveLength(1);
	});

	it('returns empty array when no matches', async () => {
		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([]);
		const result = await checkExistingCollections(['Primitives']);
		expect(result).toHaveLength(0);
	});
});
