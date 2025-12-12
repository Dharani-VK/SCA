export type SummarySection = {
  id: string
  title: string
  content: string
}

export type SummaryPayload = {
  topic?: string
  sources?: string[]
}

export type SummaryResponse = {
  sections: SummarySection[]
  highlights: string[]
  raw: string
}
