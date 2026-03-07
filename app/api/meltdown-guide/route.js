import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request) {
  try {
    const { situation, childName, sensoryProfile } = await request.json()

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 800,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a calm, experienced crisis support specialist for parents of autistic children.
Provide immediate, practical de-escalation guidance.
Keep every instruction SHORT — parents are stressed and need clarity.
Return ONLY valid JSON:
{
  "immediate_steps": [
    { "action": "Short action title", "detail": "One clear sentence of instruction" }
  ],
  "breathing_cue": "One calming phrase for the parent",
  "avoid": "One thing NOT to do right now",
  "when_calmer": "One follow-up action for after the meltdown"
}`
        },
        {
          role: 'user',
          content: `Child's name: ${childName || 'my child'}.
Known sensory sensitivities: ${sensoryProfile?.join(', ') || 'not specified'}.
Current situation: ${situation || 'Child is having a meltdown right now.'}`
        }
      ]
    })

    const data = JSON.parse(completion.choices[0].message.content)
    return Response.json(data)

  } catch (err) {
    console.error('Meltdown guide error:', err)
    return Response.json({ error: 'Could not load guide. Please try again.' }, { status: 500 })
  }
}
