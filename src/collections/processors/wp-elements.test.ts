import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../../test-setup';

vi.mock('../../collection/index', () => ({
	processCollectionData: vi.fn(),
}));

vi.mock('../../button/index', () => ({
	processButtonStyles: vi.fn(),
}));

import { processCollectionData } from '../../collection/index';
import { processButtonStyles } from '../../button/index';
import { wpElementsProcessor, getElementProcessingWarnings } from './wp-elements';
import type { ExportContext } from '../types';

const mockedProcess = processCollectionData as ReturnType<typeof vi.fn>;
const mockedProcessButton = processButtonStyles as ReturnType<typeof vi.fn>;

describe('wpElementsProcessor', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getElementProcessingWarnings(); // Clear leftover warnings
	});

	describe('matches', () => {
		it('matches wp.elements', () => {
			expect(wpElementsProcessor.matches('wp.elements')).toBe(true);
		});

		it('matches wp.elements.button', () => {
			expect(wpElementsProcessor.matches('wp.elements.button')).toBe(true);
		});

		it('matches wp.elements.link', () => {
			expect(wpElementsProcessor.matches('wp.elements.link')).toBe(true);
		});

		it('matches wp.elements.heading', () => {
			expect(wpElementsProcessor.matches('wp.elements.heading')).toBe(true);
		});

		it('does not match wp.settings', () => {
			expect(wpElementsProcessor.matches('wp.settings')).toBe(false);
		});

		it('does not match wp.blocks', () => {
			expect(wpElementsProcessor.matches('wp.blocks')).toBe(false);
		});
	});

	describe('process - specific element', () => {
		it('merges into styles.elements for button', async () => {
			mockedProcess.mockResolvedValue({ color: { background: '#000', text: '#fff' } });
			const ctx: ExportContext = { theme: { settings: {} }, files: [] };
			const collection = { name: 'wp.elements.button', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			await wpElementsProcessor.process(collection as any, ctx, {});

			expect(ctx.theme.styles.elements.button).toBeDefined();
			expect(ctx.theme.styles.elements.button.color.background).toBe('#000');
		});

		it('normalizes "buttons" to "button"', async () => {
			mockedProcess.mockResolvedValue({ color: { text: '#fff' } });
			const ctx: ExportContext = { theme: { settings: {} }, files: [] };
			const collection = { name: 'wp.elements.buttons', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			await wpElementsProcessor.process(collection as any, ctx, {});

			expect(ctx.theme.styles.elements.button).toBeDefined();
		});

		it('warns about invalid element names', async () => {
			mockedProcess.mockResolvedValue({ color: { text: '#fff' } });
			const ctx: ExportContext = { theme: { settings: {} }, files: [] };
			const collection = { name: 'wp.elements.invalid-element', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			await wpElementsProcessor.process(collection as any, ctx, {});

			const warnings = getElementProcessingWarnings();
			expect(warnings).toContainEqual(expect.stringContaining('Unknown element'));
		});

		it('deep merges with existing element data', async () => {
			mockedProcess.mockResolvedValue({ typography: { fontSize: '16px' } });
			const ctx: ExportContext = {
				theme: {
					settings: {},
					styles: { elements: { button: { color: { text: '#fff' } } } },
				},
				files: [],
			};
			const collection = { name: 'wp.elements.button', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			await wpElementsProcessor.process(collection as any, ctx, {});

			expect(ctx.theme.styles.elements.button.color.text).toBe('#fff');
			expect(ctx.theme.styles.elements.button.typography.fontSize).toBe('16px');
		});

		it('processes button styles for button element with button key', async () => {
			const buttonData = { background: '#000' };
			mockedProcess.mockResolvedValue({ button: buttonData, color: { text: '#fff' } });
			const ctx: ExportContext = { theme: { settings: {} }, files: [] };
			const collection = { name: 'wp.elements.button', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			await wpElementsProcessor.process(collection as any, ctx, {});

			expect(mockedProcessButton).toHaveBeenCalledWith(buttonData, ctx.files);
		});
	});

	describe('process - root wp.elements', () => {
		it('merges all elements into styles.elements', async () => {
			mockedProcess.mockResolvedValue({
				button: { color: { text: '#fff' } },
				link: { color: { text: '#00f' } },
			});
			const ctx: ExportContext = { theme: { settings: {} }, files: [] };
			const collection = { name: 'wp.elements', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			await wpElementsProcessor.process(collection as any, ctx, {});

			expect(ctx.theme.styles.elements.button).toBeDefined();
			expect(ctx.theme.styles.elements.link).toBeDefined();
		});

		it('validates element names for root collection', async () => {
			mockedProcess.mockResolvedValue({
				invalidElement: { color: { text: '#fff' } },
			});
			const ctx: ExportContext = { theme: { settings: {} }, files: [] };
			const collection = { name: 'wp.elements', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			await wpElementsProcessor.process(collection as any, ctx, {});

			const warnings = getElementProcessingWarnings();
			expect(warnings.some(w => w.includes('Unknown element'))).toBe(true);
		});

		it('processes button styles from root collection', async () => {
			const buttonData = { background: '#000' };
			mockedProcess.mockResolvedValue({ button: buttonData });
			const ctx: ExportContext = { theme: { settings: {} }, files: [] };
			const collection = { name: 'wp.elements', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			await wpElementsProcessor.process(collection as any, ctx, {});

			expect(mockedProcessButton).toHaveBeenCalledWith(buttonData, ctx.files);
		});
	});

	describe('getElementProcessingWarnings', () => {
		it('returns and clears warnings', async () => {
			mockedProcess.mockResolvedValue({ color: { text: '#fff' } });
			const ctx: ExportContext = { theme: { settings: {} }, files: [] };
			const collection = { name: 'wp.elements.invalid-name', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			await wpElementsProcessor.process(collection as any, ctx, {});

			const warnings1 = getElementProcessingWarnings();
			expect(warnings1.length).toBeGreaterThan(0);

			// Second call should return empty (cleared)
			const warnings2 = getElementProcessingWarnings();
			expect(warnings2).toHaveLength(0);
		});
	});
});
