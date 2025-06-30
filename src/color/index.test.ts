import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getColorPresets, getAllColorPresets } from './index';
import { mockFigma } from '../test-setup';

describe('getColorPresets', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Reset all mock implementations
		mockFigma.variables.getLocalVariableCollectionsAsync.mockReset();
		mockFigma.variables.getVariableByIdAsync.mockReset();
		mockFigma.getLocalPaintStylesAsync.mockReset();
		// Default mock for paint styles - empty array
		mockFigma.getLocalPaintStylesAsync.mockResolvedValue([]);
	});

	it('should return empty array when no color variables exist', async () => {
		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([
			{
				name: 'Typography',
				modes: [{ modeId: 'mode1', name: 'Default' }],
				variableIds: ['var1'],
			},
		]);

		mockFigma.variables.getVariableByIdAsync.mockResolvedValue({
			name: 'font-size',
			resolvedType: 'FLOAT',
			valuesByMode: {
				mode1: 16,
			},
		});

		const result = await getColorPresets();
		expect(result).toEqual([]);
	});

	it('should generate color presets from color variables', async () => {
		const mockColorCollection = {
			name: 'Color',
			modes: [{ modeId: 'mode1', name: 'Default' }],
			variableIds: ['var1', 'var2'],
		};

		const mockVariable1 = {
			name: 'primary/500',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode1: { r: 0.2, g: 0.4, b: 0.8, a: 1 },
			},
		};

		const mockVariable2 = {
			name: 'secondary-accent',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode1: { r: 1, g: 0.5, b: 0, a: 1 },
			},
		};

		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([
			mockColorCollection,
		]);

		mockFigma.variables.getVariableByIdAsync
			.mockResolvedValueOnce(mockVariable1)
			.mockResolvedValueOnce(mockVariable2);

		const result = await getColorPresets();

		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({
			name: 'Primary 500',
			slug: 'primary-500',
			color: 'var(--wp--preset--color--primary-500)',
		});
		expect(result[1]).toEqual({
			name: 'Secondary Accent',
			slug: 'secondary-accent',
			color: 'var(--wp--preset--color--secondary-accent)',
		});
	});

	it('should handle both variable aliases and direct color values', async () => {
		const mockColorCollection = {
			name: 'Color',
			modes: [{ modeId: 'mode1', name: 'Default' }],
			variableIds: ['var1', 'var2'],
		};

		const mockVariable1 = {
			name: 'primary',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode1: { r: 0.2, g: 0.4, b: 0.8, a: 1 },
			},
		};

		const mockVariable2 = {
			name: 'alias',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode1: { type: 'VARIABLE_ALIAS', id: 'var1' },
			},
		};

		const mockReferencedVariable = {
			name: 'primitives/blue/500',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode1: { r: 0.2, g: 0.4, b: 0.8, a: 1 },
			},
		};

		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([
			mockColorCollection,
		]);

		mockFigma.variables.getVariableByIdAsync
			.mockResolvedValueOnce(mockVariable1)
			.mockResolvedValueOnce(mockVariable2)
			.mockResolvedValueOnce(mockReferencedVariable); // For the alias lookup

		const result = await getColorPresets();

		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({
			name: 'Alias',
			slug: 'alias',
			color: 'var(--wp--preset--color--alias)',
		});
		expect(result[1]).toEqual({
			name: 'Primary',
			slug: 'primary',
			color: 'var(--wp--preset--color--primary)',
		});
	});

	it('should skip non-color variables', async () => {
		const mockColorCollection = {
			name: 'Color',
			modes: [{ modeId: 'mode1', name: 'Default' }],
			variableIds: ['var1', 'var2'],
		};

		const mockVariable1 = {
			name: 'spacing',
			resolvedType: 'FLOAT',
			valuesByMode: {
				mode1: 16,
			},
		};

		const mockVariable2 = {
			name: 'primary',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode1: { r: 0.2, g: 0.4, b: 0.8, a: 1 },
			},
		};

		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([
			mockColorCollection,
		]);

		mockFigma.variables.getVariableByIdAsync
			.mockResolvedValueOnce(mockVariable1)
			.mockResolvedValueOnce(mockVariable2);

		const result = await getColorPresets();

		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({
			name: 'Primary',
			slug: 'primary',
			color: 'var(--wp--preset--color--primary)',
		});
	});

	it('should sort presets by name', async () => {
		const mockColorCollection = {
			name: 'Color',
			modes: [{ modeId: 'mode1', name: 'Default' }],
			variableIds: ['var1', 'var2', 'var3'],
		};

		const mockVariable1 = {
			name: 'zebra',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode1: { r: 0, g: 0, b: 0, a: 1 },
			},
		};

		const mockVariable2 = {
			name: 'alpha',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode1: { r: 1, g: 1, b: 1, a: 1 },
			},
		};

		const mockVariable3 = {
			name: 'beta',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode1: { r: 0.5, g: 0.5, b: 0.5, a: 1 },
			},
		};

		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([
			mockColorCollection,
		]);

		mockFigma.variables.getVariableByIdAsync
			.mockResolvedValueOnce(mockVariable1)
			.mockResolvedValueOnce(mockVariable2)
			.mockResolvedValueOnce(mockVariable3);

		const result = await getColorPresets();

		expect(result).toHaveLength(3);
		expect(result[0].name).toBe('Alpha');
		expect(result[1].name).toBe('Beta');
		expect(result[2].name).toBe('Zebra');
	});

	it('should exclude primitives collection but include other collections', async () => {
		const mockCollections = [
			{
				name: 'Primitives',
				modes: [{ modeId: 'mode1', name: 'Default' }],
				variableIds: ['var1'],
			},
			{
				name: 'Brand',
				modes: [{ modeId: 'mode1', name: 'Default' }],
				variableIds: ['var2'],
			},
		];

		const mockVariable1 = {
			name: 'red/500',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode1: { r: 1, g: 0, b: 0, a: 1 },
			},
		};

		const mockVariable2 = {
			name: 'primary',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode1: { r: 0.2, g: 0.4, b: 0.8, a: 1 },
			},
		};

		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(
			mockCollections,
		);

		mockFigma.variables.getVariableByIdAsync.mockImplementation((id: string) => {
			if (id === 'var1') return Promise.resolve(mockVariable1);
			if (id === 'var2') return Promise.resolve(mockVariable2);
			return Promise.resolve(null);
		});

		// Ensure paint styles are mocked
		mockFigma.getLocalPaintStylesAsync.mockResolvedValue([]);

		const result = await getColorPresets();

		// Only the Brand collection variable should be included
		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({
			name: 'Primary',
			slug: 'primary',
			color: 'var(--wp--preset--color--primary)',
		});
	});

	it('should filter colors by selected IDs', async () => {
		const mockColorCollection = {
			name: 'Color',
			modes: [{ modeId: 'mode1', name: 'Default' }],
			variableIds: ['var1', 'var2', 'var3'],
		};

		const mockVariable1 = {
			name: 'primary',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode1: { r: 0.2, g: 0.4, b: 0.8, a: 1 },
			},
		};

		const mockVariable2 = {
			name: 'secondary',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode1: { r: 1, g: 0.5, b: 0, a: 1 },
			},
		};

		const mockVariable3 = {
			name: 'tertiary',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode1: { r: 0.5, g: 0.2, b: 0.8, a: 1 },
			},
		};

		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([
			mockColorCollection,
		]);

		mockFigma.variables.getVariableByIdAsync.mockImplementation((id: string) => {
			if (id === 'var1') return Promise.resolve(mockVariable1);
			if (id === 'var2') return Promise.resolve(mockVariable2);
			if (id === 'var3') return Promise.resolve(mockVariable3);
			return Promise.resolve(null);
		});

		// Ensure paint styles are mocked
		mockFigma.getLocalPaintStylesAsync.mockResolvedValue([]);

		const result = await getColorPresets(['var1', 'var3']);

		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({
			name: 'Primary',
			slug: 'primary',
			color: 'var(--wp--preset--color--primary)',
		});
		expect(result[1]).toEqual({
			name: 'Tertiary',
			slug: 'tertiary',
			color: 'var(--wp--preset--color--tertiary)',
		});
	});

	it('should get color presets with paint style labels', async () => {
		const mockCollections = [
			{
				id: 'collection1',
				name: 'Brand Colors',
				modes: [{ modeId: 'mode1', name: 'Default' }],
				variableIds: ['var1']
			}
		];

		const mockVariables = [
			{
				id: 'var1',
				name: 'brand/primary',
				resolvedType: 'COLOR',
				valuesByMode: {
					'mode1': { r: 1, g: 0, b: 0 }
				}
			}
		];

		const mockPaintStyles = [
			{
				id: 'paint1',
				name: 'Midnight',
				paints: [
					{
						type: 'VARIABLE',
						boundVariables: {
							paints: [{ id: 'var1' }]
						}
					}
				]
			}
		];

		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(mockCollections);
		mockFigma.variables.getVariableByIdAsync.mockResolvedValue(mockVariables[0]);
		mockFigma.getLocalPaintStylesAsync.mockResolvedValue(mockPaintStyles);

		const result = await getColorPresets();

		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({
			name: 'Midnight',
			slug: 'brand-primary',
			color: 'var(--wp--preset--color--brand-primary)'
		});
	});

	it('should filter by selected color IDs', async () => {
		const mockCollections = [
			{
				id: 'collection1',
				name: 'Brand Colors',
				modes: [{ modeId: 'mode1', name: 'Default' }],
				variableIds: ['var1', 'var2']
			}
		];

		const mockVariables = [
			{
				id: 'var1',
				name: 'brand/primary',
				resolvedType: 'COLOR',
				valuesByMode: {
					'mode1': { r: 1, g: 0, b: 0 }
				}
			},
			{
				id: 'var2',
				name: 'brand/secondary',
				resolvedType: 'COLOR',
				valuesByMode: {
					'mode1': { r: 0, g: 1, b: 0 }
				}
			}
		];

		const mockPaintStyles = [
			{
				id: 'paint1',
				name: 'Midnight',
				paints: [
					{
						type: 'VARIABLE',
						boundVariables: {
							paints: [{ id: 'var1' }]
						}
					}
				]
			}
		];

		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(mockCollections);
		mockFigma.variables.getVariableByIdAsync
			.mockResolvedValueOnce(mockVariables[0])
			.mockResolvedValueOnce(mockVariables[1]);
		mockFigma.getLocalPaintStylesAsync.mockResolvedValue(mockPaintStyles);

		const result = await getColorPresets(['var1']);

		expect(result).toHaveLength(1);
		expect(result[0].name).toBe('Midnight');
	});
});

describe('getAllColorPresets', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockFigma.variables.getLocalVariableCollectionsAsync.mockReset();
		mockFigma.variables.getVariableByIdAsync.mockReset();
	});

	it('should return empty array when no color variables exist', async () => {
		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([
			{
				name: 'Typography',
				modes: [{ modeId: 'mode1', name: 'Default' }],
				variableIds: ['var1'],
			},
		]);

		mockFigma.variables.getVariableByIdAsync.mockResolvedValue({
			name: 'font-size',
			resolvedType: 'FLOAT',
			valuesByMode: {
				mode1: 16,
			},
		});

		const result = await getAllColorPresets();
		expect(result).toEqual([]);
	});

	it('should get all color presets with resolved colors', async () => {
		const mockCollections = [
			{
				name: 'Colors',
				modes: [{ modeId: 'mode1', name: 'Default' }],
				variableIds: ['var1', 'var2'],
			},
		];

		const mockVariables = [
			{
				id: 'var1',
				name: 'primary',
				resolvedType: 'COLOR',
				valuesByMode: {
					mode1: { r: 1, g: 0, b: 0 },
				},
			},
			{
				id: 'var2',
				name: 'secondary',
				resolvedType: 'COLOR',
				valuesByMode: {
					mode1: { type: 'VARIABLE_ALIAS', id: 'var1' },
				},
			},
		];

		const mockPaintStyles = [
			{
				id: 'paint1',
				name: 'Midnight',
				paints: [
					{
						type: 'VARIABLE',
						boundVariables: {
							paints: [{ id: 'var1' }]
						}
					}
				]
			},
		];

		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(mockCollections);
		mockFigma.variables.getVariableByIdAsync
			.mockResolvedValueOnce(mockVariables[0])
			.mockResolvedValueOnce(mockVariables[1])
			.mockResolvedValueOnce(mockVariables[0]); // For alias resolution
		mockFigma.getLocalPaintStylesAsync.mockResolvedValue(mockPaintStyles);

		const result = await getAllColorPresets();

		expect(result).toEqual([
			{
				id: 'var1',
				name: 'Midnight', // Paint Style name
				slug: 'primary',
				color: 'var(--wp--preset--color--primary)',
				collectionName: 'Colors',
				resolvedColor: '#ff0000',
				paintStyleId: 'paint1',
			},
			{
				id: 'var2',
				name: 'Secondary',
				slug: 'secondary',
				color: 'var(--wp--preset--color--secondary)',
				collectionName: 'Colors',
				resolvedColor: '#ff0000',
				paintStyleId: undefined,
			},
		]);
	});

	it('should skip collections with no modes in getAllColorPresets', async () => {
		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([
			{
				name: 'Colors',
				modes: [], // No modes
				variableIds: ['var1']
			},
			{
				name: 'Valid Colors',
				modes: [{ modeId: 'mode1', name: 'Default' }],
				variableIds: ['var2']
			}
		]);

		mockFigma.variables.getVariableByIdAsync
			.mockResolvedValueOnce({
				name: 'valid',
				resolvedType: 'COLOR',
				valuesByMode: {
					mode1: { r: 0, g: 1, b: 0 }
				}
			});

		const result = await getAllColorPresets();

		expect(result).toEqual([
			{
				id: 'var2',
				name: 'Valid',
				slug: 'valid',
				color: 'var(--wp--preset--color--valid)',
				collectionName: 'Valid Colors',
				resolvedColor: '#00ff00'
			}
		]);
	});

	it('should return color presets with collection info and resolved colors', async () => {
		const mockCollections = [
			{
				name: 'Color',
				modes: [{ modeId: 'mode1', name: 'Default' }],
				variableIds: ['var1', 'var2'],
			},
		];

		const mockVariables = [
			{
				id: 'var1',
				name: 'primary',
				resolvedType: 'COLOR',
				valuesByMode: {
					mode1: { r: 1, g: 0, b: 0 },
				},
			},
			{
				id: 'var2',
				name: 'secondary-accent',
				resolvedType: 'COLOR',
				valuesByMode: {
					mode1: { r: 0, g: 1, b: 0 },
				},
			},
		];

		const mockPaintStyles = [
			{
				id: 'paint1',
				name: 'Midnight',
				paints: [
					{
						type: 'VARIABLE',
						boundVariables: {
							paints: [{ id: 'var1' }]
						}
					}
				]
			},
		];

		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(mockCollections);
		mockFigma.variables.getVariableByIdAsync
			.mockResolvedValueOnce(mockVariables[0])
			.mockResolvedValueOnce(mockVariables[1]);
		mockFigma.getLocalPaintStylesAsync.mockResolvedValue(mockPaintStyles);

		const result = await getAllColorPresets();

		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({
			id: 'var1',
			name: 'Midnight',
			slug: 'primary',
			color: 'var(--wp--preset--color--primary)',
			collectionName: 'Color',
			resolvedColor: '#ff0000',
			paintStyleId: 'paint1',
		});
		expect(result[1]).toEqual({
			id: 'var2',
			name: 'Secondary Accent',
			slug: 'secondary-accent',
			color: 'var(--wp--preset--color--secondary-accent)',
			collectionName: 'Color',
			resolvedColor: '#00ff00',
			paintStyleId: undefined,
		});
	});

	it('should handle variable aliases and resolve their colors', async () => {
		const mockCollections = [
			{
				name: 'Color',
				modes: [{ modeId: 'mode1', name: 'Default' }],
				variableIds: ['var1'],
			},
		];

		const mockVariables = [
			{
				id: 'var1',
				name: 'alias-color',
				resolvedType: 'COLOR',
				valuesByMode: {
					mode1: { type: 'VARIABLE_ALIAS', id: 'var2' },
				},
			},
			{
				id: 'var2',
				name: 'primitives/blue/500',
				resolvedType: 'COLOR',
				valuesByMode: {
					mode1: { r: 0, g: 0, b: 1 },
				},
			},
		];

		const mockPaintStyles = [
			{
				id: 'paint1',
				name: 'Midnight',
				paints: [
					{
						type: 'VARIABLE',
						boundVariables: {
							paints: [{ id: 'var1' }]
						}
					}
				]
			},
		];

		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(mockCollections);
		mockFigma.variables.getVariableByIdAsync
			.mockResolvedValueOnce(mockVariables[0])
			.mockResolvedValueOnce(mockVariables[1]);
		mockFigma.getLocalPaintStylesAsync.mockResolvedValue(mockPaintStyles);

		const result = await getAllColorPresets();

		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({
			id: 'var1',
			name: 'Midnight',
			slug: 'alias-color',
			color: 'var(--wp--preset--color--alias-color)',
			collectionName: 'Color',
			resolvedColor: '#0000ff',
			paintStyleId: 'paint1',
		});
	});

	it('should sort by collection name then by color name', async () => {
		const mockCollections = [
			{
				name: 'Brand',
				modes: [{ modeId: 'mode1', name: 'Default' }],
				variableIds: ['var1'],
			},
			{
				name: 'Color',
				modes: [{ modeId: 'mode1', name: 'Default' }],
				variableIds: ['var2', 'var3'],
			},
		];

		const mockVariables = [
			{
				id: 'var1',
				name: 'zebra',
				resolvedType: 'COLOR',
				valuesByMode: {
					mode1: { r: 0, g: 0, b: 0 },
				},
			},
			{
				id: 'var2',
				name: 'alpha',
				resolvedType: 'COLOR',
				valuesByMode: {
					mode1: { r: 1, g: 1, b: 1 },
				},
			},
			{
				id: 'var3',
				name: 'beta',
				resolvedType: 'COLOR',
				valuesByMode: {
					mode1: { r: 0.5, g: 0.5, b: 0.5 },
				},
			},
		];

		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(mockCollections);
		mockFigma.variables.getVariableByIdAsync
			.mockResolvedValueOnce(mockVariables[0])
			.mockResolvedValueOnce(mockVariables[1])
			.mockResolvedValueOnce(mockVariables[2]);
		mockFigma.getLocalPaintStylesAsync.mockResolvedValue([]);

		const result = await getAllColorPresets();

		// Should be sorted by collection name first (Brand comes before Color), then by name
		expect(result[0].collectionName).toBe('Brand');
		expect(result[0].name).toBe('Zebra');
		expect(result[1].collectionName).toBe('Color');
		expect(result[1].name).toBe('Alpha');
		expect(result[2].name).toBe('Beta');
	});

	it('should get color presets from variables with paint style labels', async () => {
		const mockCollections = [
			{
				id: 'collection1',
				name: 'Brand Colors',
				modes: [{ modeId: 'mode1', name: 'Default' }],
				variableIds: ['var1', 'var2']
			}
		];

		const mockVariables = [
			{
				id: 'var1',
				name: 'brand/primary',
				resolvedType: 'COLOR',
				valuesByMode: {
					'mode1': { r: 1, g: 0, b: 0 }
				}
			},
			{
				id: 'var2',
				name: 'brand/secondary',
				resolvedType: 'COLOR',
				valuesByMode: {
					'mode1': { r: 0, g: 1, b: 0 }
				}
			}
		];

		const mockPaintStyles = [
			{
				id: 'paint1',
				name: 'Midnight',
				paints: [
					{
						type: 'VARIABLE',
						boundVariables: {
							paints: [{ id: 'var1' }]
						}
					}
				]
			},
			{
				id: 'paint2',
				name: 'Forest Green',
				paints: [
					{
						type: 'VARIABLE',
						boundVariables: {
							paints: [{ id: 'var2' }]
						}
					}
				]
			}
		];

		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(mockCollections);
		mockFigma.variables.getVariableByIdAsync
			.mockResolvedValueOnce(mockVariables[0])
			.mockResolvedValueOnce(mockVariables[1]);
		mockFigma.getLocalPaintStylesAsync.mockResolvedValue(mockPaintStyles);

		const result = await getAllColorPresets();

		expect(result).toHaveLength(2);
		expect(result).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					id: 'var1',
					name: 'Midnight',
					color: 'var(--wp--preset--color--brand-primary)',
					collectionName: 'Brand Colors',
					paintStyleId: 'paint1',
					resolvedColor: '#ff0000',
					slug: 'brand-primary',
				}),
				expect.objectContaining({
					id: 'var2',
					name: 'Forest Green',
					color: 'var(--wp--preset--color--brand-secondary)',
					collectionName: 'Brand Colors',
					paintStyleId: 'paint2',
					resolvedColor: '#00ff00',
					slug: 'brand-secondary',
				}),
			])
		);
	});

	it('should fall back to variable names when no paint style is bound', async () => {
		const mockCollections = [
			{
				id: 'collection1',
				name: 'Brand Colors',
				modes: [{ modeId: 'mode1', name: 'Default' }],
				variableIds: ['var1']
			}
		];

		const mockVariables = [
			{
				id: 'var1',
				name: 'brand/primary',
				resolvedType: 'COLOR',
				valuesByMode: {
					'mode1': { r: 1, g: 0, b: 0 }
				}
			}
		];

		const mockPaintStyles = [
			{
				id: 'paint1',
				name: 'Unrelated Style',
				paints: [
					{
						type: 'SOLID',
						color: { r: 0, g: 0, b: 1 }
					}
				]
			}
		];

		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(mockCollections);
		mockFigma.variables.getVariableByIdAsync.mockResolvedValue(mockVariables[0]);
		mockFigma.getLocalPaintStylesAsync.mockResolvedValue(mockPaintStyles);

		const result = await getAllColorPresets();

		expect(result).toHaveLength(2); // Variable + standalone paint style
		expect(result[0]).toMatchObject({
			id: 'var1',
			name: 'Brand Primary',
			slug: 'brand-primary',
			color: 'var(--wp--preset--color--brand-primary)',
			collectionName: 'Brand Colors',
			resolvedColor: '#ff0000'
		});
	});
});

describe('Color Functions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('getAllColorPresets', () => {
		it('should get color presets from variables with paint style labels', async () => {
			const mockCollections = [
				{
					id: 'collection1',
					name: 'Brand Colors',
					modes: [{ modeId: 'mode1', name: 'Default' }],
					variableIds: ['var1', 'var2']
				}
			];

			const mockVariables = [
				{
					id: 'var1',
					name: 'brand/primary',
					resolvedType: 'COLOR',
					valuesByMode: {
						'mode1': { r: 1, g: 0, b: 0 }
					}
				},
				{
					id: 'var2',
					name: 'brand/secondary',
					resolvedType: 'COLOR',
					valuesByMode: {
						'mode1': { r: 0, g: 1, b: 0 }
					}
				}
			];

			const mockPaintStyles = [
				{
					id: 'paint1',
					name: 'Midnight',
					paints: [
						{
							type: 'VARIABLE',
							boundVariables: {
								paints: [{ id: 'var1' }]
							}
						}
					]
				},
				{
					id: 'paint2',
					name: 'Forest Green',
					paints: [
						{
							type: 'VARIABLE',
							boundVariables: {
								paints: [{ id: 'var2' }]
							}
						}
					]
				}
			];

			mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(mockCollections);
			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValueOnce(mockVariables[0])
				.mockResolvedValueOnce(mockVariables[1]);
			mockFigma.getLocalPaintStylesAsync.mockResolvedValue(mockPaintStyles);

			const result = await getAllColorPresets();

			expect(result).toHaveLength(2);
			expect(result).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						id: 'var1',
						name: 'Midnight',
						color: 'var(--wp--preset--color--brand-primary)',
						collectionName: 'Brand Colors',
						paintStyleId: 'paint1',
						resolvedColor: '#ff0000',
						slug: 'brand-primary',
					}),
					expect.objectContaining({
						id: 'var2',
						name: 'Forest Green',
						color: 'var(--wp--preset--color--brand-secondary)',
						collectionName: 'Brand Colors',
						paintStyleId: 'paint2',
						resolvedColor: '#00ff00',
						slug: 'brand-secondary',
					}),
				])
			);
		});

		it('should fall back to variable names when no paint style is bound', async () => {
			const mockCollections = [
				{
					id: 'collection1',
					name: 'Brand Colors',
					modes: [{ modeId: 'mode1', name: 'Default' }],
					variableIds: ['var1']
				}
			];

			const mockVariables = [
				{
					id: 'var1',
					name: 'brand/primary',
					resolvedType: 'COLOR',
					valuesByMode: {
						'mode1': { r: 1, g: 0, b: 0 }
					}
				}
			];

			const mockPaintStyles = [
				{
					id: 'paint1',
					name: 'Unrelated Style',
					paints: [
						{
							type: 'SOLID',
							color: { r: 0, g: 0, b: 1 }
						}
					]
				}
			];

			mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(mockCollections);
			mockFigma.variables.getVariableByIdAsync.mockResolvedValue(mockVariables[0]);
			mockFigma.getLocalPaintStylesAsync.mockResolvedValue(mockPaintStyles);

			const result = await getAllColorPresets();

			expect(result).toHaveLength(2); // Variable + standalone paint style
			expect(result[0]).toMatchObject({
				id: 'var1',
				name: 'Brand Primary',
				slug: 'brand-primary',
				color: 'var(--wp--preset--color--brand-primary)',
				collectionName: 'Brand Colors',
				resolvedColor: '#ff0000'
			});
		});

		it('should include standalone paint styles without bound variables', async () => {
			const mockCollections = [
				{
					id: 'collection1',
					name: 'Brand Colors',
					modes: [{ modeId: 'mode1', name: 'Default' }],
					variableIds: ['var1']
				}
			];

			const mockVariables = [
				{
					id: 'var1',
					name: 'brand/primary',
					resolvedType: 'COLOR',
					valuesByMode: {
						'mode1': { r: 1, g: 0, b: 0 }
					}
				}
			];

			const mockPaintStyles = [
				{
					id: 'paint1',
					name: 'Standalone Blue',
					paints: [
						{
							type: 'SOLID',
							color: { r: 0, g: 0, b: 1 }
						}
					]
				}
			];

			mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(mockCollections);
			mockFigma.variables.getVariableByIdAsync.mockResolvedValue(mockVariables[0]);
			mockFigma.getLocalPaintStylesAsync.mockResolvedValue(mockPaintStyles);

			const result = await getAllColorPresets();

			expect(result).toHaveLength(2);
			expect(result[1]).toMatchObject({
				id: 'paint1',
				name: 'Standalone Blue',
				slug: 'standalone-blue',
				color: '#0000ff',
				collectionName: 'Paint Styles',
				resolvedColor: '#0000ff',
				paintStyleId: 'paint1'
			});
		});

		it('should skip paint styles without fills', async () => {
			const mockCollections = [
				{
					id: 'collection1',
					name: 'Brand Colors',
					modes: [{ modeId: 'mode1', name: 'Default' }],
					variableIds: ['var1']
				}
			];

			const mockVariables = [
				{
					id: 'var1',
					name: 'brand/primary',
					resolvedType: 'COLOR',
					valuesByMode: {
						'mode1': { r: 1, g: 0, b: 0 }
					}
				}
			];

			const mockPaintStyles = [
				{
					id: 'paint1',
					name: 'Empty Style',
					paints: []
				},
				{
					id: 'paint2',
					name: 'Valid Style',
					paints: [
						{
							type: 'SOLID',
							color: { r: 0, g: 0, b: 1 }
						}
					]
				}
			];

			mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(mockCollections);
			mockFigma.variables.getVariableByIdAsync.mockResolvedValue(mockVariables[0]);
			mockFigma.getLocalPaintStylesAsync.mockResolvedValue(mockPaintStyles);

			const result = await getAllColorPresets();

			expect(result).toHaveLength(2); // Variable + valid paint style
			expect(result[1].name).toBe('Valid Style');
		});

		it('should handle variable aliases correctly', async () => {
			const mockCollections = [
				{
					id: 'collection1',
					name: 'Brand Colors',
					modes: [{ modeId: 'mode1', name: 'Default' }],
					variableIds: ['var1']
				}
			];

			const mockVariables = [
				{
					id: 'var1',
					name: 'brand/primary',
					resolvedType: 'COLOR',
					valuesByMode: {
						'mode1': { type: 'VARIABLE_ALIAS', id: 'var2' }
					}
				},
				{
					id: 'var2',
					name: 'primitives/red',
					resolvedType: 'COLOR',
					valuesByMode: {
						'mode1': { r: 1, g: 0, b: 0 }
					}
				}
			];

			const mockPaintStyles = [
				{
					id: 'paint1',
					name: 'Primary Red',
					paints: [
						{
							type: 'VARIABLE',
							boundVariables: {
								paints: [{ id: 'var1' }]
							}
						}
					]
				}
			];

			mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(mockCollections);
			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValueOnce(mockVariables[0])
				.mockResolvedValueOnce(mockVariables[1]);
			mockFigma.getLocalPaintStylesAsync.mockResolvedValue(mockPaintStyles);

			const result = await getAllColorPresets();

			expect(result).toHaveLength(1);
			expect(result[0]).toMatchObject({
				id: 'var1',
				name: 'Primary Red',
				color: 'var(--wp--preset--color--brand-primary)',
				resolvedColor: '#ff0000'
			});
		});
	});

	describe('getColorPresets', () => {
		it('should get color presets with paint style labels', async () => {
			const mockCollections = [
				{
					id: 'collection1',
					name: 'Brand Colors',
					modes: [{ modeId: 'mode1', name: 'Default' }],
					variableIds: ['var1']
				}
			];

			const mockVariables = [
				{
					id: 'var1',
					name: 'brand/primary',
					resolvedType: 'COLOR',
					valuesByMode: {
						'mode1': { r: 1, g: 0, b: 0 }
					}
				}
			];

			const mockPaintStyles = [
				{
					id: 'paint1',
					name: 'Midnight',
					paints: [
						{
							type: 'VARIABLE',
							boundVariables: {
								paints: [{ id: 'var1' }]
							}
						}
					]
				}
			];

			mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(mockCollections);
			mockFigma.variables.getVariableByIdAsync.mockResolvedValue(mockVariables[0]);
			mockFigma.getLocalPaintStylesAsync.mockResolvedValue(mockPaintStyles);

			const result = await getColorPresets();

			expect(result).toHaveLength(1);
			expect(result[0]).toMatchObject({
				name: 'Midnight',
				slug: 'brand-primary',
				color: 'var(--wp--preset--color--brand-primary)'
			});
		});

		it('should filter by selected color IDs', async () => {
			const mockCollections = [
				{
					id: 'collection1',
					name: 'Brand Colors',
					modes: [{ modeId: 'mode1', name: 'Default' }],
					variableIds: ['var1', 'var2']
				}
			];

			const mockVariables = [
				{
					id: 'var1',
					name: 'brand/primary',
					resolvedType: 'COLOR',
					valuesByMode: {
						'mode1': { r: 1, g: 0, b: 0 }
					}
				},
				{
					id: 'var2',
					name: 'brand/secondary',
					resolvedType: 'COLOR',
					valuesByMode: {
						'mode1': { r: 0, g: 1, b: 0 }
					}
				}
			];

			const mockPaintStyles = [
				{
					id: 'paint1',
					name: 'Midnight',
					paints: [
						{
							type: 'VARIABLE',
							boundVariables: {
								paints: [{ id: 'var1' }]
							}
						}
					]
				}
			];

			mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(mockCollections);
			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValueOnce(mockVariables[0])
				.mockResolvedValueOnce(mockVariables[1]);
			mockFigma.getLocalPaintStylesAsync.mockResolvedValue(mockPaintStyles);

			const result = await getColorPresets(['var1']);

			expect(result).toHaveLength(1);
			expect(result[0].name).toBe('Midnight');
		});

		it('should include standalone paint styles when selected', async () => {
			const mockCollections = [
				{
					id: 'collection1',
					name: 'Brand Colors',
					modes: [{ modeId: 'mode1', name: 'Default' }],
					variableIds: ['var1']
				}
			];

			const mockVariables = [
				{
					id: 'var1',
					name: 'brand/primary',
					resolvedType: 'COLOR',
					valuesByMode: {
						'mode1': { r: 1, g: 0, b: 0 }
					}
				}
			];

			const mockPaintStyles = [
				{
					id: 'paint1',
					name: 'Standalone Blue',
					paints: [
						{
							type: 'SOLID',
							color: { r: 0, g: 0, b: 1 }
						}
					]
				}
			];

			mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(mockCollections);
			mockFigma.variables.getVariableByIdAsync.mockResolvedValue(mockVariables[0]);
			mockFigma.getLocalPaintStylesAsync.mockResolvedValue(mockPaintStyles);

			const result = await getColorPresets(['paint1']);

			expect(result).toHaveLength(1);
			expect(result[0]).toMatchObject({
				name: 'Standalone Blue',
				slug: 'standalone-blue',
				color: '#0000ff'
			});
		});
	});
}); 