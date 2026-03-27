export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { clientEmail, clientName, realtorName, inviteLink } = req.body;

  if (!clientEmail || !inviteLink) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "HomeStart <onboarding@resend.dev>",
        to: clientEmail,
        subject: `${realtorName} invited you to start your mortgage pre-approval`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          </head>
          <body style="margin:0;padding:0;background:#f8f5f0;font-family:'Helvetica Neue',Arial,sans-serif;">
            <div style="max-width:560px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(44,32,18,0.08);">

              <!-- Header -->
              <div style="background:linear-gradient(135deg,#c2714f,#a85c3a);padding:32px;text-align:center;">
                <div style="font-size:24px;font-weight:800;color:white;letter-spacing:-0.5px;">HomeStart</div>
                <div style="font-size:13px;color:rgba(255,255,255,0.7);margin-top:4px;">Mortgage Platform</div>
              </div>

              <!-- Body -->
              <div style="padding:40px 36px;">
                <p style="font-size:15px;color:#8a7968;margin:0 0 8px;">You've been invited</p>
                <h1 style="font-size:26px;font-weight:700;color:#2d2418;margin:0 0 16px;line-height:1.2;">
                  ${realtorName} wants to help you get pre-approved
                </h1>
                <p style="font-size:15px;color:#6a5a4a;line-height:1.7;margin:0 0 28px;">
                  Hi ${clientName || "there"},<br/><br/>
                  Your real estate agent <strong>${realtorName}</strong> has invited you to start your mortgage pre-approval on HomeStart. It only takes a few minutes and puts you in the best position to make a competitive offer.
                </p>

                <!-- What to expect -->
                <div style="background:#f8f5f0;border-radius:12px;padding:24px;margin-bottom:28px;">
                  <p style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#8a7968;margin:0 0 16px;">What to expect</p>
                  ${[
                    ["👤", "Create your free account", "Takes about 60 seconds"],
                    ["📋", "Complete your pre-approval profile", "Income, employment & financials"],
                    ["✅", "Receive your pre-approval letter", "Reviewed by a licensed loan officer"],
                    ["🏠", "Start shopping with confidence", "Share your letter with any seller"],
                  ].map(([icon, title, desc]) => `
                    <div style="display:flex;gap:12px;margin-bottom:12px;align-items:flex-start;">
                      <span style="font-size:18px;line-height:1;">${icon}</span>
                      <div>
                        <div style="font-size:14px;font-weight:600;color:#2d2418;">${title}</div>
                        <div style="font-size:13px;color:#8a7968;">${desc}</div>
                      </div>
                    </div>
                  `).join("")}
                </div>

                <!-- CTA Button -->
                <div style="text-align:center;margin-bottom:28px;">
                  <a href="${inviteLink}" style="display:inline-block;background:linear-gradient(135deg,#c2714f,#a85c3a);color:white;text-decoration:none;font-size:16px;font-weight:700;padding:16px 40px;border-radius:10px;letter-spacing:-0.2px;">
                    Accept Invitation →
                  </a>
                </div>

                <!-- Link fallback -->
                <p style="font-size:12px;color:#a0907e;text-align:center;margin:0 0 8px;">Or copy this link into your browser:</p>
                <p style="font-size:11px;color:#c2714f;text-align:center;word-break:break-all;margin:0;">${inviteLink}</p>
              </div>

              <!-- Footer -->
              <div style="padding:20px 36px;border-top:1px solid #f0ebe3;text-align:center;">
                <p style="font-size:12px;color:#b0a090;margin:0;">
                  This invite was sent by ${realtorName} via HomeStart.<br/>
                  If you weren't expecting this, you can safely ignore this email.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || "Failed to send email" });
    }

    return res.status(200).json({ success: true, id: data.id });
  } catch (err) {
    console.error("Send invite error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
