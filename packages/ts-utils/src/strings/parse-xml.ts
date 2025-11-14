import { assertExhaustive } from '../base/assert-exhaustive'

interface Text {
  text: string
}

interface Tag {
  name?: string
  parent?: Tag
  children: Node[]
}

type Node = Text | Tag

/** This function parses simple XML-style text in O(n). */
export function parseXML(xml: string): Node[] {
  const root: Tag = {
    children: [],
  }

  let currentTag: Tag = root
  let mode: Mode = Mode.text
  let marker = 0

  while (true) {
    const [outputMode, nextMode, emission, nextMarker] = proceed(
      xml,
      mode,
      marker,
    )

    if (outputMode === Mode.end) {
      break
    }

    if (outputMode === Mode.text) {
      const trimmed = emission.trim()
      if (trimmed.length > 0) {
        currentTag.children.push({
          text: emission.trim(),
        })
      }
    } else if (outputMode === Mode.tagOpener) {
      const newTag: Tag = {
        name: emission,
        parent: currentTag,
        children: [],
      }

      currentTag.children.push(newTag)
      currentTag = newTag
    } else if (outputMode === Mode.tagCloser) {
      if (currentTag.parent && currentTag.name === emission) {
        const parent = currentTag.parent
        delete currentTag.parent
        currentTag = parent
      } else {
        throw new Error(`Unexpected closing tag </${emission}>`)
      }
    } else {
      assertExhaustive(outputMode)
    }

    mode = nextMode
    marker = nextMarker
  }

  // TODO: remove `parent` keys
  return root.children
}

enum Mode {
  text = 0,
  tagOpener = 1,
  tagCloser = 2,
  end = 3,
}

function proceed(
  xml: string,
  mode: Mode,
  _currentPos: number,
): [outputMode: Mode, nextMode: Mode, emission: string, newMarker: number] {
  const marker = _currentPos
  let currentPos = _currentPos
  while (true) {
    if (currentPos >= xml.length) {
      return [mode, Mode.end, '', currentPos + 1]
    }

    const currentChar = xml[currentPos]
    if (mode === Mode.text) {
      if (currentChar === '<') {
        const nextChar = xml[currentPos + 1]
        if (nextChar === '/') {
          return [
            mode,
            Mode.tagCloser,
            xml.slice(marker, currentPos),
            currentPos + 2,
          ]
        }
        return [
          mode,
          Mode.tagOpener,
          xml.slice(marker, currentPos),
          currentPos + 1,
        ]
      }
    }

    if (mode === Mode.tagOpener || mode === Mode.tagCloser) {
      if (currentChar === '>') {
        return [mode, Mode.text, xml.slice(marker, currentPos), currentPos + 1]
      }
    }

    currentPos++
  }
}
