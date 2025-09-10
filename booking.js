const twilio = require("twilio");

function normalizeToWhatsApp(phone) {
  if (!phone) return null;
  let cleaned = phone.trim().replace(/[\s()-]/g, "");
  if (cleaned.startsWith("+")) return "whatsapp:" + cleaned;
  if (cleaned.startsWith("0")) return "whatsapp:+233" + cleaned.slice(1);
  if (/^\d{9,15}$/.test(cleaned)) return "whatsapp:+" + cleaned;
  return null;
}

exports.handler = async (event) => {
  try {
    const data = JSON.parse(event.body || "{}");
    const { name, email, phone, session, time_slot } = data;

    const instructorNumber = process.env.TWILIO_WHATSAPP_TO;
    const twilioFrom = process.env.TWILIO_WHATSAPP_FROM;
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken || !twilioFrom || !instructorNumber) {
      console.error("Missing Twilio environment variables");
      return { statusCode: 500, body: JSON.stringify({ error: "Missing server configuration" }) };
    }

    const client = twilio(accountSid, authToken);

    const instructorMessage = `📌 New Skating Lesson Booking!
Name: ${name || "—"}
Email: ${email || "—"}
Phone: ${phone || "—"}
Session: ${session || "—"}
Time: ${time_slot || "—"}`;

    await client.messages.create({
      from: twilioFrom,
      to: instructorNumber,
      body: instructorMessage,
    });

    const customerWhats = normalizeToWhatsApp(phone);
    if (customerWhats) {
      const customerMessage = `Hi ${name || ""}! 🎉
Thanks for booking with The Skating Girl.
Session: ${session || "—"}
Time: ${time_slot || "—"}

We’ll be in touch to confirm. See you soon! 🛼`;
      await client.messages.create({
        from: twilioFrom,
        to: customerWhats,
        body: customerMessage,
      });
    } else {
      console.warn("Customer phone could not be normalized to WhatsApp format:", phone);
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error("Booking function error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Server error" }) };
  }
};
