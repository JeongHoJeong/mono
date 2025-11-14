import { $ } from 'bun'

$.throws(true)

await $`bun tsc --noEmit --skipLibCheck`
