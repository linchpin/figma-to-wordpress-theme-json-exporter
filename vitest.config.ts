import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./src/test-setup.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json-summary', 'json', 'html', 'lcov'],
			reportOnFailure: true,
			include: ['src/**/*.ts'],
			exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts', 'src/test-setup.ts', 'src/code.ts', 'src/types.ts'],
			all: true,
			thresholds: {
				global: {
					branches: 70,
					functions: 80,
					lines: 80,
					statements: 80
				}
			}
		},
		include: ['src/**/*.{test,spec}.ts'],
		exclude: ['node_modules', 'dist']
	},
	resolve: {
		alias: {
			'@': './src'
		}
	}
}); 