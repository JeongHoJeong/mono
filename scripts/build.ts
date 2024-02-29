import { $ } from 'bun'

await $`rm -r dist/**`
await $`bun tsc --skipLibCheck`
