/**
 * Smoke test: sends a real verification-style email via Resend.
 * Intentionally bypasses ResendAdapter (which is fail-silent) so a broken
 * API key, unverified domain, or network error fails the process (exit 1).
 *
 * Usage:
 *   pnpm smoke:email                        # defaults to SMOKE_EMAIL_TO env
 *   pnpm smoke:email -- --to you@mail.com
 *
 * Requires:
 *   RESEND_API_KEY
 *   RESEND_FROM_EMAIL (must match a verified Resend domain)
 */

import { Resend } from 'resend'

function parseTo(): string {
  const flagIdx = process.argv.indexOf('--to')
  if (flagIdx !== -1 && process.argv[flagIdx + 1]) {
    return process.argv[flagIdx + 1] as string
  }
  const envTo = process.env['SMOKE_EMAIL_TO']
  if (envTo) return envTo
  console.error('✗ No recipient. Pass --to <email> or set SMOKE_EMAIL_TO.')
  process.exit(2)
}

async function main(): Promise<void> {
  const apiKey = process.env['RESEND_API_KEY']
  const from = process.env['RESEND_FROM_EMAIL']
  if (!apiKey) {
    console.error('✗ RESEND_API_KEY is not set.')
    process.exit(2)
  }
  if (!from) {
    console.error('✗ RESEND_FROM_EMAIL is not set.')
    process.exit(2)
  }

  const to = parseTo()
  const resend = new Resend(apiKey)
  const tag = new Date().toISOString()

  console.log(`→ Sending smoke email`)
  console.log(`  from:  ${from}`)
  console.log(`  to:    ${to}`)
  console.log(`  tag:   ${tag}`)

  const result = await resend.emails.send({
    from,
    to,
    subject: `[smoke-test] Pakulab — ${tag}`,
    html: `<p>Smoke test dispatched at <strong>${tag}</strong>.</p><p>If you see this, Resend is wired up correctly.</p>`,
    text: `Smoke test dispatched at ${tag}. If you see this, Resend is wired up correctly.`,
  })

  if (result.error) {
    console.error('✗ Resend returned an error:')
    console.error(result.error)
    process.exit(1)
  }

  const id = result.data?.id
  if (!id) {
    console.error('✗ Resend did not return an id — treating as failure.')
    console.error(result)
    process.exit(1)
  }

  console.log(`✓ Queued by Resend. message_id=${id}`)

  // Best-effort follow-up: Resend may expose the email's delivery status a few
  // seconds later. We don't fail the smoke test if this fails — the send was
  // already accepted — but we log it so you can see spam/bounce outcomes.
  await new Promise((r) => setTimeout(r, 3000))
  try {
    const follow = (await resend.emails.get(id)) as {
      data?: { last_event?: string; to?: string[] }
      error?: { message?: string }
    }
    if (follow.error) {
      console.warn(`⚠ Could not fetch delivery status: ${follow.error.message}`)
    } else {
      console.log(`  last_event: ${follow.data?.last_event ?? 'unknown'}`)
    }
  } catch (err) {
    console.warn(`⚠ Could not fetch delivery status:`, err)
  }

  process.exit(0)
}

main().catch((err) => {
  console.error('✗ Smoke test crashed:', err)
  process.exit(1)
})
