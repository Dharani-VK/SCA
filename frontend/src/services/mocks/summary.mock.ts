import type { SummaryPayload, SummaryResponse } from '../../types/summary'

export async function mockGenerateSummary(_: SummaryPayload): Promise<SummaryResponse> {
  await new Promise((resolve) => setTimeout(resolve, 600))
  return {
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        content:
          'The smart campus initiative is accelerating adoption of AI-aided workflows across departments, prioritizing accessibility and provenance.',
      },
      {
        id: 'curriculum',
        title: 'Curriculum Enhancements',
        content: 'Faculty seek co-pilot tooling for generating lesson plans, quizzes, and knowledge checks tied to institutional material.',
      },
    ],
    highlights: [
      'Knowledge base expanded by 14 documents this week',
      'Top sources: AI Ethics Workshop, Campus Strategy 2025',
      'Action: Align new datasets with FERPA compliance guardrails',
    ],
  }
}
