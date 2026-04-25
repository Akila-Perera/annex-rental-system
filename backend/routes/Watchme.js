// backend/routes/Watchme.js
const express = require("express");
const router = express.Router();
const twilio = require("twilio");

/**
 * Format phone to E.164 format for Twilio
 * 0771234567   → +94771234567
 * +94771234567 → +94771234567
 */
function formatPhone(raw) {
  let p = raw.replace(/[\s\-\(\)]/g, "");
  if (!p.startsWith("+")) {
    if (p.startsWith("0"))  p = "+94" + p.slice(1);
    else if (p.startsWith("94")) p = "+" + p;
    else p = "+94" + p;
  }
  return p;
}

// POST /api/watchme/alert
router.post("/alert", async (req, res) => {
  const { studentName, phone, locationUrl, lat, lng } = req.body;

  if (!phone) {
    return res.status(400).json({ error: "Phone number is required" });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.error("[WatchMe] Twilio credentials missing in .env");
    return res.status(500).json({ error: "SMS service not configured on server" });
  }

  const client  = twilio(accountSid, authToken);
  const toPhone = formatPhone(phone);

  const mapsLink =
    lat && lng
      ? `https://maps.google.com/?q=${lat},${lng}`
      : locationUrl || "Location unavailable";

  const message =
    `SAFETY ALERT - Watch Me Timer\n\n` +
    `Student: ${studentName}\n` +
    `Did NOT cancel their safety timer.\n\n` +
    `Last location:\n${mapsLink}\n\n` +
    `Time: ${new Date().toLocaleString("en-LK", { timeZone: "Asia/Colombo" })}\n\n` +
    `Please check on them immediately.`;

  try {
    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: toPhone,
    });

    console.log(`[WatchMe] SMS sent | SID: ${result.sid} | Status: ${result.status} | To: ${toPhone}`);
    return res.json({ success: true, sid: result.sid, status: result.status, sentTo: toPhone });

  } catch (err) {
    console.error("[WatchMe] Twilio error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;