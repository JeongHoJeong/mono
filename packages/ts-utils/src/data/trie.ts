interface TrieNode {
  word?: string
  children: Map<string, TrieNode>
}

export function makeTrie(mappings: Array<[string, string]>): TrieNode {
  // Create root node
  const root: TrieNode = {
    children: new Map(),
  }

  // Add each mapping to the Trie
  for (const [key, value] of mappings) {
    let currentNode = root

    for (let i = 0; i < key.length; i++) {
      const char = key[i]

      if (char === undefined) {
        break
      }

      // Create child node if it doesn't exist for current character
      if (!currentNode.children.has(char)) {
        currentNode.children.set(char, {
          children: new Map(),
        })
      }

      // Move to next node
      const nextNode = currentNode.children.get(char)
      if (nextNode === undefined) {
        break
      }
      currentNode = nextNode

      // Mark word completion and store mapping if last character
      if (i === key.length - 1) {
        currentNode.word = value
      }
    }
  }

  return root
}

export function convert(input: string, trie: TrieNode): string {
  const outputs = []
  let i = 0

  let lastMatchedNode: TrieNode | null = null
  let lastMatchedPos = -1

  const flushLastMatched = () => {
    if (lastMatchedNode !== null) {
      // Add matched string to result
      outputs.push(lastMatchedNode.word)
      lastMatchedNode = null
    }
  }

  while (i < input.length) {
    // Find longest possible match from current position
    let j = i
    let currentNode = trie

    while (j < input.length) {
      const char = input[j]
      j++

      if (char === undefined) {
        break
      }

      const next = currentNode.children.get(char)
      if (next === undefined) {
        break
      }

      currentNode = next

      // Save if there's a complete match
      if (currentNode.word !== undefined) {
        lastMatchedNode = currentNode
        lastMatchedPos = j
      }
    }

    if (lastMatchedNode !== null) {
      flushLastMatched()
      i = lastMatchedPos
    } else {
      // Add unmatched character as is
      outputs.push(input[i])
      i++
    }
  }

  flushLastMatched()
  return outputs.join('')
}
