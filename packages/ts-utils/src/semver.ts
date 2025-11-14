export function compareSemver(version1: string, version2: string) {
  const v1 = version1.split('.')
  const v2 = version2.split('.')

  for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
    const diff = parseInt(v1[i] ?? '0') - parseInt(v2[i] ?? '0')
    if (diff !== 0) {
      return diff
    }
  }

  return 0
}

export function isSemverGreaterThan(version1: string, version2: string) {
  return compareSemver(version1, version2) > 0
}

export function isSemverLessThan(version1: string, version2: string) {
  return compareSemver(version1, version2) < 0
}

export function isSemverEqual(version1: string, version2: string) {
  return compareSemver(version1, version2) === 0
}
