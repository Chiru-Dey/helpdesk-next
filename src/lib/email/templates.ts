export function ticketAssignedEmail(data: {
  ticketNumber: string;
  subject: string;
  customerName: string;
  url: string;
}): { subject: string; html: string } {
  return {
    subject: `[${data.ticketNumber}] New ticket assigned: ${data.subject}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e293b;">New Ticket Assigned</h2>
        <p>You've been assigned to help <strong>${data.customerName}</strong> with:</p>
        <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0 0 8px 0;"><strong>${data.ticketNumber}</strong></p>
          <p style="margin: 0; font-size: 18px; color: #1e293b;">${data.subject}</p>
        </div>
        <a href="${data.url}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
          View Ticket
        </a>
        <p style="margin-top: 24px; font-size: 14px; color: #64748b;">
          This email was sent by HelpDesk. If you believe this was sent in error, please contact your administrator.
        </p>
      </div>
    `,
  };
}

export function ticketStatusChangedEmail(data: {
  ticketNumber: string;
  subject: string;
  oldStatus: string;
  newStatus: string;
  url: string;
}): { subject: string; html: string } {
  return {
    subject: `[${data.ticketNumber}] Status changed: ${data.subject}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e293b;">Ticket Status Updated</h2>
        <p>Your ticket <strong>${data.ticketNumber}</strong> has been updated:</p>
        <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0 0 8px 0;"><strong>${data.ticketNumber}</strong></p>
          <p style="margin: 0; font-size: 18px; color: #1e293b;">${data.subject}</p>
          <p style="margin: 12px 0 0 0; font-size: 14px; color: #64748b;">
            Status: <span style="text-decoration: line-through; color: #94a3b8;">${data.oldStatus}</span> → <strong style="color: #10b981;">${data.newStatus}</strong>
          </p>
        </div>
        <a href="${data.url}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
          View Ticket
        </a>
        <p style="margin-top: 24px; font-size: 14px; color: #64748b;">
          This email was sent by HelpDesk. If you believe this was sent in error, please contact your administrator.
        </p>
      </div>
    `,
  };
}

export function dailyDigestEmail(data: {
  recipientName: string;
  openCount: number;
  unassignedCount: number;
  urgentCount: number;
  url: string;
}): { subject: string; html: string } {
  return {
    subject: `Daily Digest: ${data.openCount} open tickets`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e293b;">Good morning, ${data.recipientName}</h2>
        <p>Here's your daily ticket summary:</p>
        <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0;"><strong>Open tickets:</strong></td>
              <td style="padding: 8px 0; text-align: right; font-size: 18px; color: #3b82f6;">${data.openCount}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Unassigned:</strong></td>
              <td style="padding: 8px 0; text-align: right; font-size: 18px; color: #f59e0b;">${data.unassignedCount}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Urgent:</strong></td>
              <td style="padding: 8px 0; text-align: right; font-size: 18px; color: #ef4444;">${data.urgentCount}</td>
            </tr>
          </table>
        </div>
        <a href="${data.url}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
          View Dashboard
        </a>
        <p style="margin-top: 24px; font-size: 14px; color: #64748b;">
          This daily digest is sent automatically by HelpDesk. To unsubscribe, contact your administrator.
        </p>
      </div>
    `,
  };
}