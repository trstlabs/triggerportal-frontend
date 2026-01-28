import { Handler } from '@netlify/functions'
// @ts-ignore
import nodemailer from 'nodemailer'
import { resolveDenom } from '../../util/conversion/conversion'

// Gmail transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})
const formatUtc = (ts?: string) =>
  ts ? new Date(ts).toISOString().replace('T', ' ').replace('Z', ' UTC') : '-'

function buildEmailHtml({
  flow,
  owner,
  eventType,
  flowID,
  flowUrl,
  unsubUrls,
  lastExecution,
  totalExecutions,
  feeAmount,
  feeDenom,
}: any) {
  const label = flow?.label || flowID || 'Flow'

  const status = lastExecution
    ? lastExecution?.executed
      ? '✅ Executed'
      : lastExecution?.timed_out
        ? '⏱️ Timed Out'
        : (Date.now() - new Date(lastExecution.actual_exec_time).getTime() < 2 * 60 * 1000 &&
          (lastExecution.errors?.length ?? 0) === 0)
          ? '⏳ Pending Execution'
          : '❌ Failed'
    : 'No execution history yet.'


  const summary = lastExecution
    ? `Last execution at <strong>${formatUtc(
      lastExecution.actual_exec_time
    )}</strong> – ${status}`
    : 'No execution history yet.'

  const historyHtml = lastExecution
    ? `
      <h3 style="margin-top:24px;">Execution Details</h3>
      <table style="border-collapse:collapse;width:100%;font-size:14px;">
        <tr><td style="padding:4px 8px;"><strong>Scheduled</strong></td><td>${formatUtc(
      lastExecution.scheduled_exec_time
    )}</td></tr>
        <tr><td style="padding:4px 8px;"><strong>Actual</strong></td><td>${formatUtc(
      lastExecution.actual_exec_time
    )}</td></tr>
        ${lastExecution.executed
      ? `<tr><td style="padding:4px 8px;"><strong>Executed</strong></td><td>✅ Yes</td></tr>`
      : ''
    }
        ${lastExecution.timed_out
      ? `<tr><td style="padding:4px 8px;"><strong>Timed Out</strong></td><td>⏱️ Yes</td></tr>`
      : ''
    }
        ${feeAmount > 0
      ? `<tr><td style="padding:4px 8px;"><strong>Exec Fee</strong></td><td>${feeAmount} ${feeDenom}</td></tr>`
      : ''
    }
        ${lastExecution.packet_sequences?.length
      ? `<tr><td style="padding:4px 8px;"><strong>Packet Sequences</strong></td><td>${lastExecution.packet_sequences.join(
        ', '
      )}</td></tr>`
      : ''
    }
        ${Array.isArray(lastExecution?.msg_responses) &&
      lastExecution.msg_responses.length
      ? `<tr><td style="padding:4px 8px;"><strong>Responses</strong></td><td>${lastExecution.msg_responses
        .map((m) => m['@type'])
        .join(', ')}</td></tr>`
      : ''
    }
        ${Array.isArray(lastExecution?.errors) && lastExecution.errors.length
      ? `<tr><td style="padding:4px 8px;color:#b00020;"><strong>Errors</strong></td><td>${lastExecution.errors.join(
        ', '
      )}</td></tr>`
      : ''
    }
      </table>
    `
    : ''

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;line-height:1.5;color:#222;">
      <h2 style="color:#0055ff;margin-bottom:8px;">🔔 Flow Update: ${label}</h2>
      <p style="margin:0 0 16px;"><em>Flow ID: ${flowID}</em></p>
      <p style="margin:0 0 12px;">${summary}</p>
      <p style="margin:0 0 16px;">
         <strong>Owner:</strong> ${owner}<br/>
         <strong>Event:</strong> ${eventType}<br/>
         ${totalExecutions
      ? `<strong>Total Executions:</strong> ${totalExecutions}<br/>`
      : ''
    }
      </p>
      <p style="margin:24px 0;">
        <a href="${flowUrl}" style="padding:10px 18px;background:#0055ff;color:white;border-radius:6px;text-decoration:none;display:inline-block;">🔎 View Flow</a>
      </p>
      ${historyHtml}
      <hr style="margin:32px 0;border:none;border-top:1px solid #ddd;" />
      <p style="font-size:12px;color:#555;">
        <a href="${unsubUrls.flow}">Unsubscribe from this flow</a> |
        <a href="${unsubUrls.owner
    }">Unsubscribe from all flows by this owner</a>
      </p>
    </div>
  `
}

export const handler: Handler = async (event, _context) => {
  try {
    let rawData
    try {
      const bodyParsed = JSON.parse(event.body)
      rawData =
        bodyParsed?.messages?.[0]?.data || bodyParsed?.data || event.body
    } catch (e) {
      console.warn('Invalid JSON:', event.body)
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid JSON' }),
      }
    }

    let parsedData
    try {
      parsedData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData
    } catch {
      console.warn('Invalid message data:', rawData)
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid message data' }),
      }
    }

    const flowID = parsedData?.flowID
    const emails = parsedData?.emails
    const owner = parsedData?.owner || 'Unknown'
    const eventType = parsedData?.type || 'unknown'

    if (!flowID || !emails?.length) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing flow ID or emails' }),
      }
    }

    const apiBase = process.env.NEXT_PUBLIC_INTO_API

    const [flowDetails, flowHistory] = await Promise.all([
      fetch(`${apiBase}/intento/intent/v1/flow/${flowID}`)
        .then((res) => res.json())
        .catch(() => null),
      fetch(`${apiBase}/intento/intent/v1/flow-history/${flowID}`)
        .then((res) => res.json())
        .catch(() => null),
    ])

    const totalExecutions = flowHistory?.history?.length || 0
    const lastExecution =
      flowHistory?.history?.[flowHistory.history.length - 1] || null

    const feeAmount = lastExecution?.exec_fee?.amount
      ? parseFloat(lastExecution.exec_fee.amount) / 1_000_000
      : 0
    const feeDenom = await resolveDenom(
      lastExecution?.exec_fee?.denom || 'unknown'
    )

    const flowUrl = `${process.env.BASE_URL}/flows/${flowID}`

    // Send all notifications (ignore failures for some recipients)
    const results = await Promise.allSettled(
      emails.map((email: string) => {
        const unsubUrls = {
          flow: `${process.env.BASE_URL
            }/.netlify/functions/flow-alert?flowID=${encodeURIComponent(
              flowID
            )}&unsubscribe=true&email=${encodeURIComponent(email)}`,
          owner: `${process.env.BASE_URL
            }/.netlify/functions/flow-alert?unsubscribe=true&owner=${encodeURIComponent(
              owner
            )}&email=${encodeURIComponent(email)}`,
        }

        const emailHtml = buildEmailHtml({
          flow: flowDetails?.flow,
          owner,
          eventType,
          flowID,
          flowUrl,
          unsubUrls,
          lastExecution,
          totalExecutions,
          feeAmount,
          feeDenom,
        })
        const label = flowDetails?.flow?.label || flowID
        return transporter.sendMail({
          from: `"Intento" <${process.env.GMAIL_USER}>`,
          to: email,
          subject: `🔔 Flow ${eventType}: ${label}`,
          html: emailHtml,
        })
      })
    )

    const failed = results.filter((r) => r.status === 'rejected')
    if (failed.length) {
      console.error('Failed emails:', failed)
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Emails sent. Success: ${results.length - failed.length
          }, Failed: ${failed.length}`,
      }),
    }
  } catch (err) {
    console.error('Handler error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    }
  }
}
