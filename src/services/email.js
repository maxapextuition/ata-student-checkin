import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendMagicLinkEmail(toEmail, magicLink) {
  await resend.emails.send({
    from: 'Apex Tuition Australia <noreply@apextuitionaustralia.com>',
    to: toEmail,
    subject: 'Your login link — ATA Student Check-in',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Log in to ATA Student Check-in</h2>
        <p>Click the button below to log in. This link expires in <strong>15 minutes</strong>.</p>
        <a href="${magicLink}" style="
          display: inline-block;
          padding: 12px 24px;
          background-color: #2563eb;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
          margin: 16px 0;
        ">Log in to Portal</a>
        <p style="color: #666; font-size: 13px;">If the button doesn't work, copy and paste this link:<br>${magicLink}</p>
        <p style="color: #999; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}
