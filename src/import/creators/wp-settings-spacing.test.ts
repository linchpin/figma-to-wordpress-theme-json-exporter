import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockCollection, mockFigma, resetMockIdCounter } from '../../test-setup';
import { createSpacingCollection } from './wp-settings-spacing';

describe('createSpacingCollection', () => {
	let getOrCreateCollection: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		vi.clearAllMocks();
		resetMockIdCounter();
		getOrCreateCollection = vi.fn();
	});

	const defaultOptions = { themeJson: {} } as any;

	function setupCollection(overrides: Parameters<typeof createMockCollection>[0] = {}) {
		const collection = createMockCollection({ name: 'wp.settings.spacing', variableIds: [], ...overrides });
		getOrCreateCollection.mockResolvedValue(collection);
		return collection;
	}

	it('creates FLOAT variables from spacingSizes', async () => {
		setupCollection();
		const sizes = [
			{ name: 'Small', slug: 'small', size: '8px' },
			{ name: 'Large', slug: 'large', size: '32px' },
		];
		const result = await createSpacingCollection(sizes, defaultOptions, getOrCreateCollection);
		expect(result.variablesCreated).toBe(2);
		expect(mockFigma.variables.createVariable).toHaveBeenCalledWith('small', expect.anything(), 'FLOAT');
		expect(mockFigma.variables.createVariable).toHaveBeenCalledWith('large', expect.anything(), 'FLOAT');
	});

	it('parses px values to numbers', async () => {
		setupCollection();
		const sizes = [{ name: 'Base', slug: 'base', size: '16px' }];
		await createSpacingCollection(sizes, defaultOptions, getOrCreateCollection);
		const createdVar = mockFigma.variables.createVariable.mock.results[0].value;
		expect(createdVar.setValueForMode).toHaveBeenCalledWith('mode-1', 16);
	});

	it('parses rem values', async () => {
		setupCollection();
		const sizes = [{ name: 'Big', slug: 'big', size: '2rem' }];
		await createSpacingCollection(sizes, defaultOptions, getOrCreateCollection);
		const createdVar = mockFigma.variables.createVariable.mock.results[0].value;
		expect(createdVar.setValueForMode).toHaveBeenCalledWith('mode-1', 32);
	});

	it('handles clamp() values as fluid spacing', async () => {
		const collection = setupCollection();
		collection.addMode.mockReturnValue('mobile-mode');
		const sizes = [{ name: 'Fluid', slug: 'fluid', size: 'clamp(16px, 3vw, 32px)' }];
		const result = await createSpacingCollection(sizes, defaultOptions, getOrCreateCollection);
		expect(result.variablesCreated).toBe(1);
		expect(collection.renameMode).toHaveBeenCalledWith('mode-1', 'Desktop');
		expect(collection.addMode).toHaveBeenCalledWith('Mobile');
		const createdVar = mockFigma.variables.createVariable.mock.results[0].value;
		// Desktop should get max (32), Mobile should get min (16)
		expect(createdVar.setValueForMode).toHaveBeenCalledWith('mode-1', 32);
		expect(createdVar.setValueForMode).toHaveBeenCalledWith('mobile-mode', 16);
	});

	it('skips CSS var references', async () => {
		setupCollection();
		const sizes = [{ name: 'Var', slug: 'var', size: 'var(--wp--custom--spacing--base)' }];
		const result = await createSpacingCollection(sizes, defaultOptions, getOrCreateCollection);
		expect(result.variablesCreated).toBe(0);
		expect(result.warnings).toContainEqual(expect.stringContaining('Skipped CSS var reference'));
	});

	it('returns warning for empty spacingSizes', async () => {
		const result = await createSpacingCollection([], defaultOptions, getOrCreateCollection);
		expect(result.warnings).toContainEqual(expect.stringContaining('No spacing sizes'));
		expect(getOrCreateCollection).not.toHaveBeenCalled();
	});

	it('sets description to preset name', async () => {
		setupCollection();
		const sizes = [{ name: 'Medium', slug: 'medium', size: '16px' }];
		await createSpacingCollection(sizes, defaultOptions, getOrCreateCollection);
		const createdVar = mockFigma.variables.createVariable.mock.results[0].value;
		expect(createdVar.description).toBe('Medium');
	});

	it('returns warning when collection is null', async () => {
		getOrCreateCollection.mockResolvedValue(null);
		const sizes = [{ name: 'S', slug: 's', size: '8px' }];
		const result = await createSpacingCollection(sizes, defaultOptions, getOrCreateCollection);
		expect(result.warnings).toContainEqual(expect.stringContaining('Skipped wp.settings.spacing'));
	});

	it('respects createFluidModes: false', async () => {
		const collection = setupCollection();
		const sizes = [{ name: 'Fluid', slug: 'fluid', size: 'clamp(16px, 3vw, 32px)' }];
		const options = { themeJson: {}, createFluidModes: false } as any;
		await createSpacingCollection(sizes, options, getOrCreateCollection);
		expect(collection.addMode).not.toHaveBeenCalled();
		expect(collection.renameMode).not.toHaveBeenCalled();
	});
});
