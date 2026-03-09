export async function POST(request) {
  try {
    const { plan, userId, userEmail, childName } = await request.json()

    const isYearly = plan === 'yearly'
    const amount = isYearly ? 799 : 199
    const description = isYearly
      ? `Autism Copilot Pro — Yearly Plan (Save 67%)`
      : `Autism Copilot Pro — Monthly Plan`

    const externalId = `autism-copilot-${plan}-${userId}-${Date.now()}`
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://autism-copilot.vercel.app'

    const payload = {
      external_id: externalId,
      payer_email: userEmail,
      description,
      amount,
      currency: 'PHP',
      invoice_duration: 86400, // 24 hours to pay
      success_redirect_url: `${appUrl}/payment/success?plan=${plan}&userId=${userId}`,
      failure_redirect_url: `${appUrl}/subscription`,
      items: [
        {
          name: `Autism Copilot Pro — ${isYearly ? 'Yearly' : 'Monthly'}`,
          quantity: 1,
          price: amount,
          category: 'Subscription'
        }
      ],
      customer: {
        email: userEmail,
        given_names: childName ? `Parent of ${childName}` : 'Parent'
      },
      customer_notification_preference: {
        invoice_created: ['email'],
        invoice_paid: ['email']
      }
    }

    const response = await fetch('https://api.xendit.co/v2/invoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(process.env.XENDIT_SECRET_KEY + ':').toString('base64')}`
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Xendit error:', data)
      return Response.json({ error: data.message || 'Payment creation failed' }, { status: 400 })
    }

    return Response.json({ invoice_url: data.invoice_url, invoice_id: data.id })

  } catch (err) {
    console.error('Invoice creation error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
