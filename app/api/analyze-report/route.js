import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request) {
  try {
    const { pdfBase64, fileName, childName, age } = await request.json()

    if (!pdfBase64) {
      return Response.json({ error: 'No PDF data received.' }, { status: 400 })
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 2000,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a specialist in autism and developmental assessments.
Translate clinical assessment reports into clear, warm, actionable language parents can understand.
Never use clinical jargon without a plain-English explanation.
Return ONLY valid JSON:
{
  "summary": "2-3 sentence plain-English overview of the report",
  "strengths": [
    { "title": "Strength name", "description": "What this means for daily life" }
  ],
  "sensory_triggers": [
    { "trigger": "Trigger name", "explanation": "What this means day-to-day", "tip": "One practical home tip" }
  ],
  "recommended_focus": [
    { "area": "Focus area", "why": "Why this matters for this child", "home_activity": "One activity to try today" }
  ],
  "questions_for_therapist": ["Question 1", "Question 2", "Question 3"]
}`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyse this developmental/autism assessment report for ${childName}, aged ${age}. File: ${fileName}. Extract key findings, translate clinical language into parent-friendly insights, identify strengths, sensory triggers, and recommended focus areas.`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:application/pdf;base64,${pdfBase64}`,
                detail: 'high'
              }
            }
          ]
        }
      ]
    })

    const text = completion.choices[0].message.content
    const clean = text.replace(/```json|```/g, '').trim()
    const data = JSON.parse(clean)
    return Response.json(data)

  } catch (err) {
    console.error('Report analysis error:', err)
    if (err.message?.includes('image') || err.message?.includes('vision')) {
      return Response.json({ error: 'PDF could not be read. Please ensure it contains selectable text (not a scanned image).' }, { status: 422 })
    }
    return Response.json({ error: `Analysis failed: ${err.message || 'Please try again.'}` }, { status: 500 })
  }
}
