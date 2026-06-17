export async function sendOtpEmail(email: string, otp: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn('RESEND_API_KEY not set — OTP email not sent');
    return;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Kashmir360 <noreply@formaspacestudio.com>',
      to: email,
      subject: 'Your Kashmir360 OTP Code',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Your OTP Code</h2>
          <p style="font-size: 32px; letter-spacing: 8px; font-weight: bold; text-align: center; padding: 20px; background: #f3f4f6; border-radius: 8px;">
            ${otp}
          </p>
          <p style="color: #6b7280; font-size: 14px;">This code expires in 5 minutes.</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Resend API error:', err);
  }
}
