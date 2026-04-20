const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },
});

const sendSupportReplyEmail = async ({ toEmail, firstName, lastName, originalIssue, aiResponse }) => {
  const mailOptions = {
    from: `"UniNEST Support Team" <${process.env.BREVO_SMTP_USER}>`,
    to: toEmail,
    subject: `✅ UniNEST Support — We've received your request`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6f9; padding: 20px; }
          .wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
          .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 40px; text-align: center; }
          .logo-badge { display: inline-block; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); border-radius: 10px; padding: 8px 20px; margin-bottom: 18px; color: white; font-weight: 800; font-size: 20px; letter-spacing: 2px; }
          .header h1 { color: white; font-size: 22px; font-weight: 700; margin-bottom: 8px; }
          .header p { color: rgba(255,255,255,0.75); font-size: 14px; }
          .body { padding: 40px; }
          .ai-badge { display: inline-flex; align-items: center; gap: 6px; background: #dbeafe; color: #1e40af; border-radius: 999px; padding: 5px 14px; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 24px; }
          .ticket-box { background: #f8faff; border: 1px solid #dbeafe; border-radius: 12px; padding: 18px 22px; margin-bottom: 24px; }
          .ticket-label { font-size: 10px; font-weight: 800; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; }
          .ticket-box p { font-size: 14px; color: #475569; line-height: 1.7; }
          .divider { height: 1px; background: #e2e8f0; margin: 24px 0; }
          .response-label { font-size: 10px; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px; }
          .ai-response { background: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 0 12px 12px 0; padding: 22px 26px; margin-bottom: 28px; }
          .ai-response p { font-size: 14px; color: #1e293b; line-height: 1.85; }
          .help-box { background: #f8faff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 22px; margin-bottom: 24px; }
          .help-box p { font-size: 13px; color: #64748b; line-height: 1.7; margin-bottom: 8px; }
          .contact-row { display: flex; gap: 20px; flex-wrap: wrap; margin-top: 4px; }
          .contact-item { font-size: 13px; color: #334155; font-weight: 600; }
          .footer { background: #f8faff; border-top: 1px solid #e2e8f0; padding: 28px 40px; text-align: center; }
          .footer p { font-size: 12px; color: #94a3b8; line-height: 1.8; }
          .footer a { color: #3b82f6; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="header">
            <div class="logo-badge">UniNEST</div>
            <h1>Your Support Request Has Been Received</h1>
            <p>We've reviewed your issue and prepared a personalised response</p>
          </div>
          <div class="body">
            <div class="ai-badge">🤖 AI-Powered Instant Response</div>
            <div class="ticket-box">
              <div class="ticket-label">📋 Your Original Request</div>
              <p>${originalIssue.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
            </div>
            <div class="divider"></div>
            <div class="response-label">💬 Our Response</div>
            <div class="ai-response">
              <p>${aiResponse.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>')}</p>
            </div>
            <div class="help-box">
              <p>If this response didn't fully resolve your issue, our human support team is here to help further. Simply reply to this email or reach us directly:</p>
              <div class="contact-row">
                <span class="contact-item">📞 +94 11 234 5678</span>
                <span class="contact-item">📧 support@uninest.lk</span>
                <span class="contact-item">🕐 Mon–Fri, 9am–6pm</span>
              </div>
            </div>
          </div>
          <div class="footer">
            <p>© 2026 UniNEST. All rights reserved.<br/>
            Colombo 03, Sri Lanka &nbsp;·&nbsp;
            <a href="mailto:support@uninest.lk">support@uninest.lk</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendSupportReplyEmail };