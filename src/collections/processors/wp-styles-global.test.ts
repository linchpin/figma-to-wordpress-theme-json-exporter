import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../../test-setup';

vi.mock('../../collection/index', () => ({
	processCollectionData: vi.fn(),
}));

import { processCollectionData } from '../../collection/index';
import { wpStylesGlobalProcessor } from './wp-styles-global';
import type { ExportContext } from '../types';

const mockedProcess = processCollectionData as ReturnType<typeof vi.fn>;

describe('wpStylesGlobalProcessor', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('matches', () => {
		it('matches wp.styles', () => {
			expect(wpStylesGlobalProcessor.matches('wp.styles')).toBe(true);
		});

		it('matches wp.styles.color', () => {
			expect(wpStylesGlobalProcessor.matches('wp.styles.color')).toBe(true);
		});

		it('matches wp.styles.typography', () => {
			expect(wpStylesGlobalProcessor.matches('wp.styles.typography')).toBe(true);
		});

		it('does not match wp.settings', () => {
			expect(wpStylesGlobalProcessor.matches('wp.settings')).toBe(false);
		});

		it('does not match wp.elements', () => {
			expect(wpStylesGlobalProcessor.matches('wp.elements')).toBe(false);
		});

		it('does not match wp.blocks', () => {
			expect(wpStylesGlobalProcessor.matches('wp.blocks')).toBe(false);
		});
	});

	describe('process', () => {
		it('merges data into styles root', async () => {
			mockedProcess.mockResolvedValue({ color: { background: '#fff', text: '#000' } });
			const ctx: ExportContext = { theme: { settings: {} }, files: [] };
			const collection = { name: 'wp.styles', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			await wpStylesGlobalProcessor.process(collection as any, ctx, {});

			expect(ctx.theme.styles).toBeDefined();
			expect(ctx.theme.styles.color.background).toBe('#fff');
			expect(ctx.theme.styles.color.text).toBe('#000');
		});

		it('deep merges with existing styles', async () => {
			mockedProcess.mockResolvedValue({ typography: { fontSize: '16px' } });
			const ctx: ExportContext = {
				theme: { settings: {}, styles: { color: { text: '#000' } } },
				files: [],
			};
			const collection = { name: 'wp.styles', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			await wpStylesGlobalProcessor.process(collection as any, ctx, {});

			expect(ctx.theme.styles.color.text).toBe('#000');
			expect(ctx.theme.styles.typography.fontSize).toBe('16px');
		});

		it('creates styles object if not present', async () => {
			mockedProcess.mockResolvedValue({ color: { background: '#fff' } });
			const ctx: ExportContext = { theme: { settings: {} }, files: [] };
			const collection = { name: 'wp.styles', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			await wpStylesGlobalProcessor.process(collection as any, ctx, {});

			expect(ctx.theme.styles).toBeDefined();
		});

		it('converts keys to camelCase', async () => {
			mockedProcess.mockResolvedValue({ 'font-family': 'Inter' });
			const ctx: ExportContext = { theme: { settings: {} }, files: [] };
			const collection = { name: 'wp.styles', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			await wpStylesGlobalProcessor.process(collection as any, ctx, {});

			expect(ctx.theme.styles.fontFamily).toBe('Inter');
		});

		it('handles nested spacing properties', async () => {
			mockedProcess.mockResolvedValue({
				spacing: { padding: { top: '20px', bottom: '20px' }, margin: { top: '0' } },
			});
			const ctx: ExportContext = { theme: { settings: {} }, files: [] };
			const collection = { name: 'wp.styles', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			await wpStylesGlobalProcessor.process(collection as any, ctx, {});

			expect(ctx.theme.styles.spacing.padding.top).toBe('20px');
			expect(ctx.theme.styles.spacing.margin.top).toBe('0');
		});
	});
});
