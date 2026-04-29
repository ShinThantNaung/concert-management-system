import { defineConfig } from "vitest/config";

export default defineConfig({
    esbuild: {
        target: "esnext",
        tsconfigRaw: {
            compilerOptions: {
                experimentalDecorators: true,
                emitDecoratorMetadata: true
            }
        }
    },
    test: {
        environment: "node",
        setupFiles: ["tests/setup.ts"],
        hookTimeout: 20000,
        testTimeout: 20000
    }
});
