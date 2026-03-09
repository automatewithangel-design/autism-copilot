import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request) {
  try {
    const { message, history, childName, age, sensoryProfile, goals, reportSummary } = await request.json()

    const reportContext = reportSummary
      ? `\n\nCHILD'S ASSESSMENT REPORT:\n${JSON.stringify(reportSummary, null, 2)}`
      : ''

    const systemPrompt = `You are a warm, knowledgeable autism support specialist helping a parent.
You are talking to the parent of ${childName || 'a child'}, aged ${age || 'unknown'}.
Known sensory profile: ${sensoryProfile?.join(', ') || 'not specified'}.
Goals: ${goals?.join(', ') || 'general support'}.${reportContext}

Guidelines:
- Be warm, empathetic and non-judgmental
- Give practical, actionable advice parents can use today
- Keep responses clear — no clinical jargon without explanation
- If asked about medical or diagnostic questions, recommend consulting a professional
- Always validate the parent's efforts
- Use the child's name (${childName || 'their child'}) when relevant
- Keep responses to 2-4 short paragraphs`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 600,
      messages: [
        { role: 'system', content: systemPrompt },
        ...(history || []),
        { role: 'user', content: message }
      ]
    })

    const reply = completion.choices[0].message.content
    return Response.json({ reply })

  } catch (err) {
    console.error('Expert chat error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
