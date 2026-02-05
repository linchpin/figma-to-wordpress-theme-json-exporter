import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockCollection, createMockVariable, mockFigma, resetMockIdCounter } from '../../test-setup';
import { createPrimitivesCollection } from './primitives';

describe('createPrimitivesCollection', () => {
	let getOrCreateCollection: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		vi.clearAllMocks();
		resetMockIdCounter();
		getOrCreateCollection = vi.fn();
	});

	const defaultOptions = { themeJson: {} } as any;

	function setupCollection(overrides: Parameters<typeof createMockCollection>[0] = {}) {
		const collection = createMockCollection({ name: 'Primitives', variableIds: [], ...overrides });
		getOrCreateCollection.mockResolvedValue(collection);
		return collection;
	}

	it('creates COLOR variables for hex values', async () => {
		setupCollection();
		const data = { color: { primary: '#ff0000', secondary: '#00ff00' } };
		const result = await createPrimitivesCollection(data, defaultOptions, getOrCreateCollection);
		expect(result.variablesCreated).toBe(2);
		expect(mockFigma.variables.createVariable).toHaveBeenCalledWith('color/primary', expect.objectContaining({ name: 'Primitives' }), 'COLOR');
	});

	it('creates FLOAT variables for px values', async () => {
		setupCollection();
		const data = { spacing: { base: '16px' } };
		const result = await createPrimitivesCollection(data, defaultOptions, getOrCreateCollection);
		expect(result.variablesCreated).toBe(1);
		expect(mockFigma.variables.createVariable).toHaveBeenCalledWith('spacing/base', expect.anything(), 'FLOAT');
	});

	it('skips CSS var references with warning', async () => {
		setupCollection();
		const data = { color: { link: 'var(--wp--preset--color--primary)' } };
		const result = await createPrimitivesCollection(data, defaultOptions, getOrCreateCollection);
		expect(result.variablesCreated).toBe(0);
		expect(result.warnings).toContainEqual(expect.stringContaining('Skipped CSS var reference'));
	});

	it('skips STRING and BOOLEAN types with warning', async () => {
		setupCollection();
		const data = { font: { family: 'Inter, sans-serif' }, feature: { enabled: true } };
		const result = await createPrimitivesCollection(data, defaultOptions, getOrCreateCollection);
		expect(result.variablesCreated).toBe(0);
		expect(result.warnings).toContainEqual(expect.stringContaining('Skipped unsupported type (STRING)'));
		expect(result.warnings).toContainEqual(expect.stringContaining('Skipped unsupported type (BOOLEAN)'));
	});

	it('returns warning for empty data', async () => {
		const result = await createPrimitivesCollection({}, defaultOptions, getOrCreateCollection);
		expect(result.warnings).toContainEqual('No variables found in settings.custom');
		expect(getOrCreateCollection).not.toHaveBeenCalled();
	});

	it('returns warning when collection is null (skip strategy)', async () => {
		getOrCreateCollection.mockResolvedValue(null);
		const data = { color: { primary: '#ff0000' } };
		const result = await createPrimitivesCollection(data, defaultOptions, getOrCreateCollection);
		expect(result.warnings).toContainEqual(expect.stringContaining('Skipped Primitives'));
		expect(result.variablesCreated).toBe(0);
	});

	it('skips existing variables when overwriteExisting is false', async () => {
		const existingVar = createMockVariable({ name: 'color/primary', id: 'ev-1' });
		setupCollection({ variableIds: ['ev-1'] });
		mockFigma.variables.getVariableByIdAsync.mockResolvedValue(existingVar);
		const data = { color: { primary: '#ff0000' } };
		const result = await createPrimitivesCollection(data, { themeJson: {}, overwriteExisting: false } as any, getOrCreateCollection);
		expect(result.variablesCreated).toBe(0);
		expect(result.warnings).toContainEqual(expect.stringContaining('Skipped existing variable'));
	});

	it('updates existing variables when overwriteExisting is true', async () => {
		const existingVar = createMockVariable({ name: 'color/primary', id: 'ev-1' });
		setupCollection({ variableIds: ['ev-1'] });
		mockFigma.variables.getVariableByIdAsync.mockResolvedValue(existingVar);
		const data = { color: { primary: '#00ff00' } };
		const result = await createPrimitivesCollection(data, { themeJson: {}, overwriteExisting: true } as any, getOrCreateCollection);
		expect(existingVar.setValueForMode).toHaveBeenCalled();
		expect(mockFigma.variables.createVariable).not.toHaveBeenCalled();
	});

	it('reports correct counts', async () => {
		setupCollection();
		const data = { color: { primary: '#ff0000' }, spacing: { base: '16px' }, font: { family: 'Inter' } };
		const result = await createPrimitivesCollection(data, defaultOptions, getOrCreateCollection);
		expect(result.variablesCreated).toBe(2);
		expect(result.collectionsCreated).toBe(1);
		expect(result.collections).toHaveLength(1);
	});
});
