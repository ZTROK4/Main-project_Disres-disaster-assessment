const twilio = require("twilio");
const nodemailer = require("nodemailer");

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// 📞 Voice Call
exports.sendVoiceCall = async (phone, message) => {
  try {
    const enhancedMessage = `
      <Response>
        <Say voice="Polly.Joanna-Neural" language="en-US">
          <prosody rate="medium">
            This is an automated emergency alert.
          </prosody>
        </Say>

        <Pause length="1"/>

        <Say voice="Polly.Joanna-Neural" language="en-US">
          ${message}
        </Say>

        <Pause length="1"/>

        <Say voice="Polly.Joanna-Neural" language="en-US">
          Please check the text message sent to this number for exact location details.
          Immediate attention is advised.
        </Say>
      </Response>
    `;

    const call = await twilioClient.calls.create({
      twiml: enhancedMessage,
      to: phone,
      from: process.env.TWILIO_PHONE_NUMBER,
    });

    return call.status;
  } catch (error) {
    console.error("Voice call error:", error.message);
    return "FAILED";
  }
};

// 📩 SMS
exports.sendSMS = async (phone, message) => {
  try {
    const sms = await twilioClient.messages.create({
      body: message,
      to: phone,
      from: process.env.TWILIO_PHONE_NUMBER,
    });

    return sms.status;
  } catch (error) {
    console.error("SMS error:", error.message);
    return "FAILED";
  }
};

// 📧 Email
exports.sendEmail = async (to, subject, html, attachments = []) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"Disaster Alert System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,          // ✅ HTML body
      attachments    // ✅ Image attachment
    });

    return info.response ? "SENT" : "FAILED";
  } catch (error) {
    console.error("Email error:", error.message);
    return "FAILED";
  }
};