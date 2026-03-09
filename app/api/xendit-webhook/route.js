import { createClient } from '@supabase/supabase-js'

// Use service role key for admin DB writes
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const body = await request.json()
    console.log('Xendit webhook received:', body.status, body.external_id)

    // Verify it's a paid invoice
    if (body.status !== 'PAID') {
      return Response.json({ received: true, action: 'ignored' })
    }

    // Extract userId from external_id format: autism-copilot-{plan}-{userId}-{timestamp}
    const parts = body.external_id?.split('-')
    // external_id example: autism-copilot-yearly-uuid-here-timestamp
    // We need to extract the userId (UUID) which is between plan and timestamp
    const planIndex = parts?.indexOf('yearly') !== -1
      ? parts.indexOf('yearly')
      : parts?.indexOf('monthly') !== -1
        ? parts.indexOf('monthly')
        : -1

    if (planIndex === -1) {
      console.error('Could not parse plan from external_id:', body.external_id)
      return Response.json({ error: 'Invalid external_id format' }, { status: 400 })
    }

    const plan = parts[planIndex]
    // UUID is 5 parts joined by '-'
    const uuidParts = parts.slice(planIndex + 1, planIndex + 6)
    const userId = uuidParts.join('-')

    // Calculate expiry date
    const now = new Date()
    const expiresAt = plan === 'yearly'
      ? new Date(now.setFullYear(now.getFullYear() + 1))
      : new Date(now.setMonth(now.getMonth() + 1))

    // Mark user as Pro in Supabase
    const { error } = await supabase
      .from('profiles')
      .update({
        is_pro: true,
        pro_plan: plan,
        pro_expires_at: expiresAt.toISOString(),
        xendit_invoice_id: body.id
      })
      .eq('id', userId)

    if (error) {
      console.error('Supabase update error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    console.log(`User ${userId} upgraded to Pro (${plan}) until ${expiresAt}`)
    return Response.json({ success: true, userId, plan })

  } catch (err) {
    console.error('Webhook error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
