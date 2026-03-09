import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request) {
  try {
    const { childName, age, sensory, energy, duration, goals } = await request.json()

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1200,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a paediatric Occupational Therapist specialising in autism.
Generate 3 age-appropriate, sensory-aware activities.
Return ONLY valid JSON in this exact format:
{
  "activities": [
    {
      "title": "Activity name",
      "description": "1-2 sentence description",
      "materials": ["item1", "item2"],
      "steps": ["Step 1", "Step 2", "Step 3"],
      "duration": "X minutes",
      "energy": "Low|Medium|High",
      "sensory_focus": "Tactile|Visual|Auditory|Proprioceptive|Vestibular",
      "tip": "One quick parent tip"
    }
  ]
}`
        },
        {
          role: 'user',
          content: `Child: ${childName}, Age: ${age} years old.
Sensory preference: ${sensory}.
Current energy level: ${energy}.
Available time: ${duration}.
Support goals: ${goals?.join(', ') || 'general development'}.
Generate 3 engaging activities now.`
        }
      ]
    })

    const data = JSON.parse(completion.choices[0].message.content)
    return Response.json({ activities: data.activities })

  } catch (err) {
    console.error('Activity generation error:', err)
    return Response.json({ error: 'Failed to generate activities. Please try again.' }, { status: 500 })
  }
}
