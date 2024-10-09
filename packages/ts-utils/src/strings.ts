/** Splits given string into size limited strings.
 * Caution: This function counts line break as a character.
 */
export function splitWithSizeLimit(
  string: string,
  maxLengthPerSegment: number
) {
  // Check if maxLengthPerSegment is integer.
  if (!Number.isInteger(maxLengthPerSegment)) {
    throw new Error('maxLengthPerSegment must be an integer.')
  }

  if (maxLengthPerSegment < 2) {
    throw new Error('maxLengthPerSegment must be at least 2.')
  }

  // First divide by line breaks, then group them into size limited strings.
  // We need to divide each line if it's too long.
  // Consider line break itself is also a character, so we need to count it.
  const lines = string.split('\n').flatMap((line) => {
    const actualLength = line.length + 1
    const maxLineLength = maxLengthPerSegment - 1

    if (actualLength <= maxLineLength) {
      return [line]
    }

    const result = []
    for (let i = 0; i < line.length; i += maxLineLength) {
      result.push(line.slice(i, i + maxLineLength))
    }

    return result
  })

  let divideIndicies: number[] = []
  let lengthSum = 0

  // Divide by segments
  lines.forEach((line, idx) => {
    const actualLength = line.length + 1
    if (lengthSum + actualLength > maxLengthPerSegment) {
      divideIndicies.push(idx)
      lengthSum = 0
    }

    lengthSum += actualLength
  })

  // Slice by divideIndicies, then join them into segments.
  const segments = divideIndicies.map((divideIndex, idx) => {
    return (
      lines
        .slice(idx === 0 ? 0 : divideIndicies[idx - 1], divideIndex)
        // Caveat: If we only use join, then last line doesn't have line break. So to be precise, we need to add it.
        .join('\n') + '\n'
    )
  })

  // We need to consider last segment.
  const lastDivideIndex = divideIndicies[divideIndicies.length - 1] ?? 0
  const lastSegment = lines.slice(lastDivideIndex).join('\n')

  return [...segments, lastSegment]
}
