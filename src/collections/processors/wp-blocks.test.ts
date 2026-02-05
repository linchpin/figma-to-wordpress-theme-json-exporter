import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockFigma, createMockVariable, resetMockIdCounter } from '../../test-setup';

vi.mock('../../collection/index', () => ({
	processCollectionData: vi.fn(),
}));

import { processCollectionData } from '../../collection/index';
import { wpBlocksProcessor, getBlockProcessingWarnings, getDetectedBlocks } from './wp-blocks';
import type { ExportContext } from '../types';

const mockedProcess = processCollectionData as ReturnType<typeof vi.fn>;

describe('wpBlocksProcessor', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		resetMockIdCounter();
		getBlockProcessingWarnings(); // Clear leftover warnings
	});

	describe('matches', () => {
		it('matches wp.blocks (group-based)', () => {
			expect(wpBlocksProcessor.matches('wp.blocks')).toBe(true);
		});

		it('matches wp.blocks.core/button (legacy)', () => {
			expect(wpBlocksProcessor.matches('wp.blocks.core/button')).toBe(true);
		});

		it('matches wp.blocks.core/paragraph', () => {
			expect(wpBlocksProcessor.matches('wp.blocks.core/paragraph')).toBe(true);
		});

		it('matches wp.blocks.acf/hero', () => {
			expect(wpBlocksProcessor.matches('wp.blocks.acf/hero')).toBe(true);
		});

		it('does not match wp.elements', () => {
			expect(wpBlocksProcessor.matches('wp.elements')).toBe(false);
		});

		it('does not match wp.settings', () => {
			expect(wpBlocksProcessor.matches('wp.settings')).toBe(false);
		});

		it('does not match Primitives', () => {
			expect(wpBlocksProcessor.matches('Primitives')).toBe(false);
		});
	});

	describe('process - legacy (wp.blocks.namespace/block)', () => {
		it('merges block styles into styles.blocks[blockName]', async () => {
			mockedProcess.mockResolvedValue({ color: { background: '#000', text: '#fff' } });
			const ctx: ExportContext = { theme: { settings: {} }, files: [] };
			const collection = { name: 'wp.blocks.core/button', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			await wpBlocksProcessor.process(collection as any, ctx, {});

			expect(ctx.theme.styles.blocks['core/button']).toBeDefined();
			expect(ctx.theme.styles.blocks['core/button'].color.background).toBe('#000');
		});

		it('deep merges with existing block data', async () => {
			mockedProcess.mockResolvedValue({ typography: { fontSize: '16px' } });
			const ctx: ExportContext = {
				theme: { settings: {}, styles: { blocks: { 'core/button': { color: { text: '#fff' } } } } },
				files: [],
			};
			const collection = { name: 'wp.blocks.core/button', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			await wpBlocksProcessor.process(collection as any, ctx, {});

			expect(ctx.theme.styles.blocks['core/button'].color.text).toBe('#fff');
			expect(ctx.theme.styles.blocks['core/button'].typography.fontSize).toBe('16px');
		});

		it('creates styles.blocks if not present', async () => {
			mockedProcess.mockResolvedValue({ color: { text: '#fff' } });
			const ctx: ExportContext = { theme: { settings: {} }, files: [] };
			const collection = { name: 'wp.blocks.core/paragraph', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			await wpBlocksProcessor.process(collection as any, ctx, {});

			expect(ctx.theme.styles).toBeDefined();
			expect(ctx.theme.styles.blocks).toBeDefined();
			expect(ctx.theme.styles.blocks['core/paragraph']).toBeDefined();
		});
	});

	describe('process - group-based (wp.blocks)', () => {
		it('processes variables grouped by block name', async () => {
			const var1 = createMockVariable({
				name: 'core/cover/color/background',
				resolvedType: 'COLOR',
				valuesByMode: { 'm1': { r: 0, g: 0, b: 0, a: 1 } },
			});
			const var2 = createMockVariable({
				name: 'core/heading/typography/font-size',
				resolvedType: 'FLOAT',
				valuesByMode: { 'm1': 24 },
			});

			mockFigma.variables.getVariableByIdAsync
				.mockResolvedValueOnce(var1)
				.mockResolvedValueOnce(var2);

			const ctx: ExportContext = { theme: { settings: {} }, files: [] };
			const collection = {
				name: 'wp.blocks',
				modes: [{ modeId: 'm1', name: 'Default' }],
				variableIds: [var1.id, var2.id],
			};

			await wpBlocksProcessor.process(collection as any, ctx, {});

			expect(ctx.theme.styles.blocks['core/cover']).toBeDefined();
			expect(ctx.theme.styles.blocks['core/heading']).toBeDefined();
		});

		it('skips variables with fewer than 3 path segments', async () => {
			const v = createMockVariable({
				name: 'core/cover',
				resolvedType: 'FLOAT',
				valuesByMode: { 'm1': 10 },
			});
			mockFigma.variables.getVariableByIdAsync.mockResolvedValue(v);

			const ctx: ExportContext = { theme: { settings: {} }, files: [] };
			const collection = {
				name: 'wp.blocks',
				modes: [{ modeId: 'm1', name: 'Default' }],
				variableIds: [v.id],
			};

			await wpBlocksProcessor.process(collection as any, ctx, {});

			expect(ctx.theme.styles?.blocks || {}).toEqual({});
		});

		it('skips null variables', async () => {
			mockFigma.variables.getVariableByIdAsync.mockResolvedValue(null);

			const ctx: ExportContext = { theme: { settings: {} }, files: [] };
			const collection = {
				name: 'wp.blocks',
				modes: [{ modeId: 'm1', name: 'Default' }],
				variableIds: ['nonexistent'],
			};

			await wpBlocksProcessor.process(collection as any, ctx, {});

			expect(ctx.theme.styles?.blocks || {}).toEqual({});
		});

		it('skips when no modes are present', async () => {
			const ctx: ExportContext = { theme: { settings: {} }, files: [] };
			const collection = {
				name: 'wp.blocks',
				modes: [],
				variableIds: ['v1'],
			};

			await wpBlocksProcessor.process(collection as any, ctx, {});

			expect(ctx.theme.styles?.blocks).toBeUndefined();
		});
	});

	describe('getBlockProcessingWarnings', () => {
		it('returns and clears warnings', () => {
			// Manually verify the function returns an array and clears
			const warnings1 = getBlockProcessingWarnings();
			expect(Array.isArray(warnings1)).toBe(true);

			const warnings2 = getBlockProcessingWarnings();
			expect(warnings2).toHaveLength(0);
		});
	});
});

describe('getDetectedBlocks', () => {
	it('detects legacy block collections', () => {
		const collections = [
			{ name: 'wp.blocks.core/button' },
			{ name: 'wp.blocks.core/paragraph' },
		];
		const result = getDetectedBlocks(collections);

		expect(result).toHaveLength(2);
		expect(result[0].blockName).toBe('core/button');
		expect(result[0].isCore).toBe(true);
	});

	it('detects group-based blocks from variable names', () => {
		const collections = [{ name: 'wp.blocks' }];
		const variableNames = [
			'core/cover/color/background',
			'core/cover/color/text',
			'core/heading/typography/fontSize',
		];
		const result = getDetectedBlocks(collections, variableNames);

		expect(result).toHaveLength(2);
		expect(result.find(b => b.blockName === 'core/cover')).toBeDefined();
		expect(result.find(b => b.blockName === 'core/heading')).toBeDefined();
	});

	it('sorts core blocks before custom blocks', () => {
		const collections = [
			{ name: 'wp.blocks.acf/hero' },
			{ name: 'wp.blocks.core/button' },
		];
		const result = getDetectedBlocks(collections);

		expect(result[0].isCore).toBe(true);
		expect(result[1].isCore).toBe(false);
	});

	it('deduplicates block names', () => {
		const collections = [
			{ name: 'wp.blocks.core/button' },
			{ name: 'wp.blocks.core/button' },
		];
		const result = getDetectedBlocks(collections);

		expect(result).toHaveLength(1);
	});

	it('returns correct badge info for core blocks', () => {
		const collections = [{ name: 'wp.blocks.core/button' }];
		const result = getDetectedBlocks(collections);

		expect(result[0].badge.label).toBe('Core');
		expect(result[0].badge.cssClass).toBe('badge-core');
	});

	it('returns correct badge info for custom blocks', () => {
		const collections = [{ name: 'wp.blocks.acf/hero' }];
		const result = getDetectedBlocks(collections);

		expect(result[0].badge.label).toBe('Custom');
		expect(result[0].badge.cssClass).toBe('badge-custom');
	});

	it('returns empty array for non-block collections', () => {
		const collections = [
			{ name: 'wp.settings.colors' },
			{ name: 'Primitives' },
		];
		const result = getDetectedBlocks(collections);

		expect(result).toHaveLength(0);
	});

	it('alphabetically sorts blocks within core/custom groups', () => {
		const collections = [
			{ name: 'wp.blocks.core/paragraph' },
			{ name: 'wp.blocks.core/button' },
			{ name: 'wp.blocks.core/heading' },
		];
		const result = getDetectedBlocks(collections);

		expect(result[0].blockName).toBe('core/button');
		expect(result[1].blockName).toBe('core/heading');
		expect(result[2].blockName).toBe('core/paragraph');
	});
});
