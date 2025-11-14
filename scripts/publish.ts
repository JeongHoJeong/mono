import { $ } from 'bun'
import fs from 'node:fs'
import { isSemverGreaterThan } from '../packages/ts-utils/src/semver'
import {
  checkRemoteChecksum,
  getLatestPublishedVersion,
  getLocalChecksum,
} from './npm-utils'

$.throws(true)

function removeWorkspaceDeps(dependencies: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(dependencies).map(([name, version]) => {
      if (version.startsWith('workspace:')) {
        return [name, '*']
      }
      return [name, version]
    }),
  )
}

async function publish() {
  await $`rm -rf publishing`

  await $`mkdir -p publishing`

  const packageJson: {
    name: string
    version: string
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
  } = JSON.parse(fs.readFileSync('package.json', 'utf-8'))

  const localVersion = packageJson.version
  const latestPublishedVersion = await getLatestPublishedVersion(
    packageJson.name,
  )

  if (
    latestPublishedVersion !== undefined &&
    !isSemverGreaterThan(localVersion, latestPublishedVersion)
  ) {
    console.log(
      `${packageJson.name}: Local version is not greater than latest published version. (${localVersion} <= ${latestPublishedVersion}) Skipping publish.`,
    )
    return
  }

  const remoteChecksum = await (async () =>
    localVersion === latestPublishedVersion
      ? await checkRemoteChecksum(
          `${packageJson.name}@${latestPublishedVersion}`,
        )
      : undefined)()

  const newPackageJson = {
    name: packageJson.name,
    version: packageJson.version,
    main: 'dist',
    files: ['dist'],
    scripts: {},
    dependencies: removeWorkspaceDeps(packageJson.dependencies ?? {}),
    devDependencies: removeWorkspaceDeps(packageJson.devDependencies ?? {}),
  }

  if (fs.existsSync('README.md')) {
    await $`cp README.md publishing`
  }

  await $`mv dist publishing`

  fs.writeFileSync(
    'publishing/package.json',
    JSON.stringify(newPackageJson, null, 2),
  )

  $.cwd('./publishing')
  await $`npm pack`

  const tarball = `${packageJson.name
    .replaceAll('@', '')
    .replaceAll('/', '-')}-${packageJson.version}.tgz`

  const localChecksum = await getLocalChecksum(tarball)

  if (remoteChecksum) {
    if (localChecksum === remoteChecksum) {
      console.log(`Checksums are same. (${localChecksum}) Skipping publish.`)
      return
    } else {
      console.log(
        `Checksums are different. (Local: ${localChecksum} !== Remote: ${remoteChecksum})`,
      )
    }
  }

  await $`npm publish ${tarball} --access public`
}

await publish()
