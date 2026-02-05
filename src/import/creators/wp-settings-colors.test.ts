import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockCollection, createMockVariable, mockFigma, resetMockIdCounter } from '../../test-setup';
import { createColorPaletteCollection } from './wp-settings-colors';

describe('createColorPaletteCollection', () => {
	let getOrCreateCollection: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		vi.clearAllMocks();
		resetMockIdCounter();
		getOrCreateCollection = vi.fn();
	});

	const defaultOptions = { themeJson: {} } as any;

	function setupCollection(overrides: Parameters<typeof createMockCollection>[0] = {}) {
		const collection = createMockCollection({ name: 'wp.settings.colors', variableIds: [], ...overrides });
		getOrCreateCollection.mockResolvedValue(collection);
		return collection;
	}

	it('creates COLOR variables from palette presets', async () => {
		setupCollection();
		const palette = [
			{ name: 'Primary', slug: 'primary', color: '#ff0000' },
			{ name: 'Secondary', slug: 'secondary', color: '#00ff00' },
		];
		const result = await createColorPaletteCollection(palette, defaultOptions, getOrCreateCollection);
		expect(result.variablesCreated).toBe(2);
		expect(mockFigma.variables.createVariable).toHaveBeenCalledWith('primary', expect.anything(), 'COLOR');
		expect(mockFigma.variables.createVariable).toHaveBeenCalledWith('secondary', expect.anything(), 'COLOR');
	});

	it('uses slug as variable name', async () => {
		setupCollection();
		const palette = [{ name: 'My Color', slug: 'my-color', color: '#abcdef' }];
		await createColorPaletteCollection(palette, defaultOptions, getOrCreateCollection);
		expect(mockFigma.variables.createVariable).toHaveBeenCalledWith('my-color', expect.anything(), 'COLOR');
	});

	it('sets description to preset name', async () => {
		setupCollection();
		const palette = [{ name: 'Vivid Red', slug: 'vivid-red', color: '#ff0000' }];
		await createColorPaletteCollection(palette, defaultOptions, getOrCreateCollection);
		const createdVar = mockFigma.variables.createVariable.mock.results[0].value;
		expect(createdVar.description).toBe('Vivid Red');
	});

	it('parses hex colors to RGBA and calls setValueForMode', async () => {
		setupCollection();
		const palette = [{ name: 'Blue', slug: 'blue', color: '#0000ff' }];
		await createColorPaletteCollection(palette, defaultOptions, getOrCreateCollection);
		const createdVar = mockFigma.variables.createVariable.mock.results[0].value;
		expect(createdVar.setValueForMode).toHaveBeenCalledWith('mode-1', expect.objectContaining({ r: 0, g: 0, b: 1, a: 1 }));
	});

	it('skips CSS var references', async () => {
		setupCollection();
		const palette = [{ name: 'Primary', slug: 'primary', color: 'var(--wp--preset--color--base)' }];
		const result = await createColorPaletteCollection(palette, defaultOptions, getOrCreateCollection);
		expect(result.variablesCreated).toBe(0);
		expect(result.warnings).toContainEqual(expect.stringContaining('Skipped CSS var reference'));
	});

	it('returns warning for empty palette', async () => {
		const result = await createColorPaletteCollection([], defaultOptions, getOrCreateCollection);
		expect(result.warnings).toContainEqual('No colors found in settings.color.palette');
		expect(getOrCreateCollection).not.toHaveBeenCalled();
	});

	it('returns warning when collection is null', async () => {
		getOrCreateCollection.mockResolvedValue(null);
		const palette = [{ name: 'Primary', slug: 'primary', color: '#ff0000' }];
		const result = await createColorPaletteCollection(palette, defaultOptions, getOrCreateCollection);
		expect(result.warnings).toContainEqual(expect.stringContaining('Skipped wp.settings.colors'));
	});

	it('skips existing vars when overwriteExisting is false', async () => {
		const existingVar = createMockVariable({ name: 'primary', id: 'ev-1' });
		setupCollection({ variableIds: ['ev-1'] });
		mockFigma.variables.getVariableByIdAsync.mockResolvedValue(existingVar);
		const palette = [{ name: 'Primary', slug: 'primary', color: '#ff0000' }];
		const result = await createColorPaletteCollection(palette, { themeJson: {}, overwriteExisting: false } as any, getOrCreateCollection);
		expect(result.variablesCreated).toBe(0);
		expect(result.warnings).toContainEqual(expect.stringContaining('Skipped existing color'));
	});

	it('handles invalid colors gracefully', async () => {
		setupCollection();
		const palette = [{ name: 'Bad', slug: 'bad', color: 'not-a-color' }];
		const result = await createColorPaletteCollection(palette, defaultOptions, getOrCreateCollection);
		expect(result.warnings).toContainEqual(expect.stringContaining('Invalid color value'));
		expect(result.errors).toHaveLength(0);
	});
});
