import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../../test-setup';

vi.mock('../../collection/index', () => ({
	processCollectionData: vi.fn(),
}));

import { processCollectionData } from '../../collection/index';
import { fallbackSelectedProcessor } from './fallback-selected';
import type { ExportContext } from '../types';

const mockedProcess = processCollectionData as ReturnType<typeof vi.fn>;

describe('fallbackSelectedProcessor', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('matches', () => {
		it('matches any name (catch-all)', () => {
			expect(fallbackSelectedProcessor.matches('anything')).toBe(true);
			expect(fallbackSelectedProcessor.matches('')).toBe(true);
			expect(fallbackSelectedProcessor.matches('wp.settings')).toBe(true);
			expect(fallbackSelectedProcessor.matches('Primitives')).toBe(true);
			expect(fallbackSelectedProcessor.matches('Random Collection')).toBe(true);
		});
	});

	describe('process', () => {
		it('merges data into settings.custom with sanitized name', async () => {
			mockedProcess.mockResolvedValue({ spacing: { base: '16px' } });
			const ctx: ExportContext = { theme: { settings: { custom: {} } }, files: [] };
			const collection = { name: 'My Collection', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			await fallbackSelectedProcessor.process(collection as any, ctx, {});

			expect(ctx.theme.settings.custom['my-collection']).toBeDefined();
			expect(ctx.theme.settings.custom['my-collection'].spacing.base).toBe('16px');
		});

		it('strips color key from data', async () => {
			mockedProcess.mockResolvedValue({ color: { primary: '#f00' }, spacing: { base: '16px' } });
			const ctx: ExportContext = { theme: { settings: { custom: {} } }, files: [] };
			const collection = { name: 'Test', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			await fallbackSelectedProcessor.process(collection as any, ctx, {});

			const merged = ctx.theme.settings.custom['test'];
			expect(merged.color).toBeUndefined();
			expect(merged.spacing).toBeDefined();
		});

		it('strips colors key from data', async () => {
			mockedProcess.mockResolvedValue({ colors: { secondary: '#0f0' }, spacing: { base: '16px' } });
			const ctx: ExportContext = { theme: { settings: { custom: {} } }, files: [] };
			const collection = { name: 'Test', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			await fallbackSelectedProcessor.process(collection as any, ctx, {});

			const merged = ctx.theme.settings.custom['test'];
			expect(merged.colors).toBeUndefined();
			expect(merged.spacing).toBeDefined();
		});

		it('skips merge when cleaned data is empty', async () => {
			mockedProcess.mockResolvedValue({ color: { primary: '#f00' } });
			const ctx: ExportContext = { theme: { settings: { custom: {} } }, files: [] };
			const collection = { name: 'My Collection', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			await fallbackSelectedProcessor.process(collection as any, ctx, {});

			expect(ctx.theme.settings.custom['my-collection']).toBeUndefined();
		});

		it('sanitizes collection name with special characters', async () => {
			mockedProcess.mockResolvedValue({ value: '1px' });
			const ctx: ExportContext = { theme: { settings: { custom: {} } }, files: [] };
			const collection = { name: 'My Special! Collection #1', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			await fallbackSelectedProcessor.process(collection as any, ctx, {});

			// sanitizeCollectionName converts non-alphanumeric to hyphens
			expect(ctx.theme.settings.custom['my-special-collection-1']).toBeDefined();
		});

		it('converts keys to camelCase', async () => {
			mockedProcess.mockResolvedValue({ 'font-size': { 'line-height': '1.5' } });
			const ctx: ExportContext = { theme: { settings: { custom: {} } }, files: [] };
			const collection = { name: 'test', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			await fallbackSelectedProcessor.process(collection as any, ctx, {});

			expect(ctx.theme.settings.custom['test'].fontSize).toBeDefined();
		});

		it('handles null/empty data', async () => {
			mockedProcess.mockResolvedValue(null);
			const ctx: ExportContext = { theme: { settings: { custom: {} } }, files: [] };
			const collection = { name: 'test', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			// Should not throw
			await fallbackSelectedProcessor.process(collection as any, ctx, {});
		});
	});
});
