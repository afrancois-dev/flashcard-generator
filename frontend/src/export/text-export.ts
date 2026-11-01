import type { CardCollection } from '../domain/cards'

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

function cardFields(collection: CardCollection): string[][] {
  return collection.cards.map((card) =>
    card.type === 'basic'
      ? [card.front, card.back, card.tags.join(' ')]
      : [card.text, '', card.tags.join(' ')],
  )
}

export function serializeCsv(collection: CardCollection): string {
  return [
    ['Front', 'Back', 'Tags'],
    ...cardFields(collection),
  ]
    .map((row) => row.map(csvCell).join(','))
    .join('\n')
}

export function serializeTxt(collection: CardCollection): string {
  return cardFields(collection).map((row) => row.join('\t')).join('\n')
}

export function downloadTextFile(
  content: string,
  filename: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType })
  const link = document.createElement('a')
  link.download = filename
  link.href = URL.createObjectURL(blob)
  link.click()
  URL.revokeObjectURL(link.href)
}
