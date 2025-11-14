// Memo: we don't have much option to use custom commands in turbo.json.
// So we keep `scripts` field same across all packages by manually checking here.
// (Ref: https://github.com/vercel/turbo/issues/1495)

import { $ } from 'bun'
import { expect } from 'bun:test'
import fs from 'node:fs'

const packageJsonFiles = (await $`ls packages/*/package.json`)
  .text()
  .trim()
  .split('\n')

console.log(`Files to check: ${packageJsonFiles.join(', ')}`)

await Promise.all(
  packageJsonFiles.map(async (file) => {
    console.log(`Checking ${file}...`)
    const content = await fs.promises.readFile(file, 'utf-8')
    const parsed = JSON.parse(content)

    expect(parsed.scripts).toEqual({
      build: 'bun ../../scripts/build.ts',
      publish: 'bun ../../scripts/publish.ts',
      typecheck: 'bun ../../scripts/typecheck.ts',
      test: 'bun ../../scripts/test.ts',
    })

    console.log(`✅ ${file} is OK`)
  }),
)
