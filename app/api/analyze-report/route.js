import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request) {
  try {
    const { reportText, childName, age } = await request.json()

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 2000,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a specialist in autism assessments. 
Translate clinical assessment language into clear, warm, actionable insights for parents.
Never use clinical jargon without explaining it.
Return ONLY valid JSON:
{
  "summary": "2-3 sentence plain-English summary of the overall report",
  "strengths": [
    { "title": "Strength name", "description": "Plain English explanation" }
  ],
  "sensory_triggers": [
    { "trigger": "Trigger name", "explanation": "What this means day-to-day", "tip": "Practical home tip" }
  ],
  "recommended_focus": [
    { "area": "Focus area", "why": "Why this matters", "home_activity": "One specific activity to try" }
  ],
  "questions_for_therapist": ["Question 1", "Question 2", "Question 3"]
}`
        },
        {
          role: 'user',
          content: `Child's name: ${childName}, Age: ${age}.
Assessment report content:
${reportText}`
        }
      ]
    })

    const data = JSON.parse(completion.choices[0].message.content)
    return Response.json(data)

  } catch (err) {
    console.error('Report analysis error:', err)
    return Response.json({ error: 'Analysis failed. Please try again.' }, { status: 500 })
  }
}
