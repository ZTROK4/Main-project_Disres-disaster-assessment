const {
  sendVoiceCall,
  sendSMS,
  sendEmail,
} = require("./delivery.service");



exports.triggerAlertToAuthority = async (report, authority,voiceMessage) => {
  try {
    const mapLink = `https://www.google.com/maps?q=${report.latitude},${report.longitude}`;
    
    
    
    const smsMessage = `
🚨 Emergency Alert
Type: ${report.disasterType}
Severity: ${report.severityLevel}
Location: ${mapLink}
`;

    let voiceStatus = "SKIPPED";
    let smsStatus = "SKIPPED";
    let emailStatus = "SKIPPED";

    if (authority.phone) {
      voiceStatus = await sendVoiceCall(authority.phone, voiceMessage);
      smsStatus = await sendSMS(authority.phone, smsMessage);
    }

    if (authority.email) {
  const htmlContent = `
    <h2>🚨 Emergency Alert Notification</h2>
    <p><strong>Disaster Type:</strong> ${report.disasterType}</p>
    <p><strong>Severity Level:</strong> ${report.severityLevel}</p>
    <p>
      <strong>Location:</strong>
      <a href="https://www.google.com/maps?q=${report.latitude},${report.longitude}">
        View on Google Maps
      </a>
    </p>
    <p><strong>Reported Image:</strong></p>
    <img src="cid:disasterImage" width="400"/>
    <br/>
    <p>Please respond immediately if required.</p>
  `;

  emailStatus = await sendEmail(
    authority.email,
    "🚨 Emergency Alert Notification",
    htmlContent,
    [
      {
        filename: "disaster.jpg",
        path: report.s3Url,  // must be public or signed URL
        cid: "disasterImage"
      }
    ]
  );
}

    return { voiceStatus, smsStatus, emailStatus };

  } catch (error) {
    console.error(
      `Error sending alert to ${authority.name}:`,
      error.message
    );

    return {
      voiceStatus: "FAILED",
      smsStatus: "FAILED",
      emailStatus: "FAILED"
    };
  }
};