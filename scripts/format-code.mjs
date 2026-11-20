import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const tools = path.join(root, '.local/code-cleanup-tools/node_modules');
const prettier = path.join(tools, 'prettier/bin/prettier.cjs');
const javaPlugin = path.join(tools, 'prettier-plugin-java/dist/index.mjs');

if (!existsSync(prettier) || !existsSync(javaPlugin)) {
    console.error('Install the optional formatting tools first:');
    console.error(
        'npm install --prefix .local/code-cleanup-tools --no-audit --no-fund prettier@3.10.1 prettier-plugin-java@2.12.0',
    );
    process.exit(1);
}

const mode = process.argv.includes('--write') ? '--write' : '--check';
const result = spawnSync(
    process.execPath,
    [
        prettier,
        `--plugin=${javaPlugin}`,
        mode,
        'frontend/src/**/*.{ts,tsx,css}',
        'backend/src/main/java/**/*.java',
    ],
    { cwd: root, stdio: 'inherit' },
);
process.exit(result.status ?? 1);
