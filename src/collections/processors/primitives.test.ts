import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../../test-setup';

vi.mock('../../collection/index', () => ({
	processCollectionData: vi.fn(),
}));

import { processCollectionData } from '../../collection/index';
import { primitivesProcessor } from './primitives';
import type { ExportContext } from '../types';

const mockedProcess = processCollectionData as ReturnType<typeof vi.fn>;

describe('primitivesProcessor', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('matches', () => {
		it('matches "Primitives" exactly', () => {
			expect(primitivesProcessor.matches('Primitives')).toBe(true);
		});

		it('matches case-insensitively', () => {
			expect(primitivesProcessor.matches('primitives')).toBe(true);
			expect(primitivesProcessor.matches('PRIMITIVES')).toBe(true);
		});

		it('matches with surrounding whitespace', () => {
			expect(primitivesProcessor.matches('  Primitives  ')).toBe(true);
		});

		it('does not match other names', () => {
			expect(primitivesProcessor.matches('wp.settings')).toBe(false);
			expect(primitivesProcessor.matches('Other')).toBe(false);
			expect(primitivesProcessor.matches('')).toBe(false);
		});
	});

	describe('process', () => {
		it('merges processed data into settings.custom', async () => {
			mockedProcess.mockResolvedValue({ color: { primary: '#ff0000' } });
			const ctx: ExportContext = { theme: { settings: { custom: {} } }, files: [] };
			const collection = { name: 'Primitives', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			await primitivesProcessor.process(collection as any, ctx, {});

			expect(ctx.theme.settings.custom.color).toBeDefined();
			expect(ctx.theme.settings.custom.color.primary).toBe('#ff0000');
		});

		it('converts keys to camelCase', async () => {
			mockedProcess.mockResolvedValue({ 'font-size': { 'line-height': '1.5' } });
			const ctx: ExportContext = { theme: { settings: { custom: {} } }, files: [] };
			const collection = { name: 'Primitives', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			await primitivesProcessor.process(collection as any, ctx, {});

			expect(ctx.theme.settings.custom.fontSize).toBeDefined();
			expect(ctx.theme.settings.custom.fontSize.lineHeight).toBe('1.5');
		});

		it('deep merges with existing custom data', async () => {
			mockedProcess.mockResolvedValue({ color: { secondary: '#00ff00' } });
			const ctx: ExportContext = {
				theme: { settings: { custom: { color: { primary: '#ff0000' } } } },
				files: [],
			};
			const collection = { name: 'Primitives', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			await primitivesProcessor.process(collection as any, ctx, {});

			expect(ctx.theme.settings.custom.color.primary).toBe('#ff0000');
			expect(ctx.theme.settings.custom.color.secondary).toBe('#00ff00');
		});

		it('passes collection and options to processCollectionData', async () => {
			mockedProcess.mockResolvedValue({});
			const ctx: ExportContext = { theme: { settings: { custom: {} } }, files: [] };
			const collection = { name: 'Primitives', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: ['v1'] };
			const options = { useRem: true };

			await primitivesProcessor.process(collection as any, ctx, options);

			expect(mockedProcess).toHaveBeenCalledWith(collection, options);
		});
	});
});
