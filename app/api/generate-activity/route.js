import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SAFETY_DISCLAIMER = `Always supervise your child during activities. Stop immediately if your child shows signs of distress. Every child is different — adapt activities to suit your child's needs. This is not a replacement for professional therapy advice.`

export async function POST(request) {
  try {
    const { childName, age, sensory, energy, duration, goals, isPro, reportSummary } = await request.json()

    const isProUser = isPro === true
    const hasReport = isProUser && reportSummary

    const systemPrompt = hasReport
      ? `You are a paediatric Occupational Therapist specialising in autism.
You have access to this child's actual clinical assessment report summary.
Generate activities that DIRECTLY address the findings, triggers, and goals in the report.
Activities must be evidence-based (ABA, sensory integration, DIR/Floortime principles).
Return ONLY valid JSON:
{
  "activities": [
    {
      "title": "Activity name",
      "description": "1-2 sentence description",
      "from_report": true,
      "report_reason": "One sentence explaining which report finding this addresses",
      "materials": ["item1", "item2"],
      "steps": ["Step 1", "Step 2", "Step 3"],
      "duration": "X minutes",
      "energy": "Low|Medium|High",
      "sensory_focus": "Tactile|Visual|Auditory|Proprioceptive|Vestibular",
      "tip": "One quick parent tip",
      "safety_note": "Specific safety consideration for this activity"
    }
  ],
  "disclaimer": "Always supervise your child. Stop if distress is shown. Not a replacement for professional therapy."
}`
      : `You are a paediatric Occupational Therapist specialising in autism.
Generate 3 age-appropriate, sensory-aware activities based on evidence-based practices including Applied Behaviour Analysis (ABA), Sensory Integration Therapy, and DIR/Floortime approaches.
Prioritise child safety in every activity.
Return ONLY valid JSON:
{
  "activities": [
    {
      "title": "Activity name",
      "description": "1-2 sentence description",
      "evidence_base": "Brief note on the therapeutic approach e.g. Sensory Integration Therapy",
      "materials": ["item1", "item2"],
      "steps": ["Step 1", "Step 2", "Step 3"],
      "duration": "X minutes",
      "energy": "Low|Medium|High",
      "sensory_focus": "Tactile|Visual|Auditory|Proprioceptive|Vestibular",
      "tip": "One quick parent tip",
      "safety_note": "Specific safety consideration for this activity"
    }
  ],
  "disclaimer": "Always supervise your child during activities. Stop immediately if your child shows signs of distress. Every child is different — adapt activities to suit your child needs. This is not a replacement for professional therapy advice."
}`

    const userMessage = hasReport
      ? `Child: ${childName}, Age: ${age} years old.
Sensory preference: ${sensory}. Energy level: ${energy}. Available time: ${duration}.
Goals: ${goals?.join(', ') || 'general development'}.
REPORT CONTEXT: ${reportSummary}
Generate 3 activities that directly address findings from this report.`
      : `Child: ${childName}, Age: ${age} years old.
Sensory preference: ${sensory}. Energy level: ${energy}. Available time: ${duration}.
Goals: ${goals?.join(', ') || 'general development'}.
Generate 3 engaging, safe, evidence-based activities.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1500,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ]
    })

    const data = JSON.parse(completion.choices[0].message.content)
    return Response.json({
      activities: data.activities,
      disclaimer: data.disclaimer || SAFETY_DISCLAIMER,
      fromReport: hasReport
    })

  } catch (err) {
    console.error('Activity generation error:', err)
    return Response.json({
      error: `Generation failed (${err.status || 500}). Please check your OpenAI API key in Vercel.`
    }, { status: 500 })
  }
}
