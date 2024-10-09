import { $ } from 'bun'

await $`mkdir -p dist`
await $`rm -rf dist/** || true`
await $`bun tsc --skipLibCheck`
