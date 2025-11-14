import { $ } from 'bun'

async function checkIfPackageExists(packageName: string) {
  try {
    await $`npm view ${packageName}`
    return true
  } catch (error) {
    return false
  }
}

export async function checkRemoteChecksum(packageName: string) {
  const exists = await checkIfPackageExists(packageName)

  if (!exists) {
    return undefined
  }

  await $`mkdir -p .temp`

  const packs: {
    id: string
    name: string
    filename: string
    shasum: string
  }[] = (
    await $`npm pack --pack-destination .temp --json ${packageName}`
  ).json()

  const pack = packs[0]
  await $`rm .temp/${pack.filename}`
  await $`rmdir .temp`

  if (!pack) {
    throw new Error(`No pack found for ${packageName}`)
  }

  return pack.shasum
}

export async function getLocalChecksum(filename: string) {
  return (await $`shasum ${filename} | awk '{ print $1 }'`).text().trim()
}

export async function getLatestPublishedVersion(packageName: string) {
  try {
    return (await $`npm view ${packageName} version`).text().trim()
  } catch (error) {
    return undefined
  }
}
