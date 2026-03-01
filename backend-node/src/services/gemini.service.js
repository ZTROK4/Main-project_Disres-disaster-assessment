const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


const { fileTypeFromBuffer } = require("file-type");

exports.analyzeDisasterImage = async (imageBuffer, mimeType) => {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash"
  });

  // 🔥 Fix MIME type properly
  if (!mimeType || mimeType === "application/octet-stream") {
    const detected = await fileTypeFromBuffer(imageBuffer);

    if (!detected || !detected.mime.startsWith("image/")) {
      throw new Error("Invalid or unsupported image file");
    }

    mimeType = detected.mime;
  }

  const prompt = `
You are an AI disaster assessment system.

1. Identify disaster type (fire, flood, landslide, accident, collapse, medical emergency, none).
2. Estimate severity: LOW, MEDIUM, HIGH, CRITICAL.
3. Provide confidence (0–1).
4. Generate short professional title (max 8 words).

Return STRICT JSON:
{
  "disaster_type": "",
  "severity": "",
  "confidence": 0.0,
  "title": "",
  "reasoning": ""
}
`;

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: imageBuffer.toString("base64"),
              mimeType: mimeType,
            },
          },
        ],
      },
    ],
  });

  const response = await result.response;
  const text = response.text();

  const jsonMatch = text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error("Invalid Gemini response format");
  }

  return JSON.parse(jsonMatch[0]);
};

exports.generateEmergencyVoiceScript = async (report,locationName) => {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash"
  });

  const prompt = `
You are generating a short automated emergency voice call script.

This call is being made to emergency authorities such as police, fire department, and hospital dispatch.

The purpose of the call is to INFORM them about a detected disaster so they can respond.

mention the place by analysing the  latitude and longitude given .
do not mention lat and long as them , process to find the place details.

Disaster Type: ${report.disasterType}
Severity Level: ${report.severityLevel}
location: ${locationName}
Latitude: ${report.latitude}
Longitude: ${report.longitude}

Rules:
- Maximum 40 words
- Professional and urgent tone
- Address emergency responders
- Clearly state disaster type and severity
- Mention the location name
- Do NOT give survival instructions
- Do NOT speak to victims
- Plain text only
- No special characters

Generate the script.
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;

  return response.text().trim();
};