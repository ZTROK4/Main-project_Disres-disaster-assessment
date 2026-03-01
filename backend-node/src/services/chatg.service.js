const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_ONE_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

exports.generateChat = async ({ payload, history, userMessage }) => {

const systemInstruction = `
You are an AI Emergency Response Assistant.

Behavior Rules:
1. Respond directly to the USER QUESTION.
2. Use SYSTEM DATA (contacts, event summary, inputs) to support your answer.
3. Do NOT fabricate phone numbers or locations.
4. If a contact exists in SYSTEM DATA, include it.
5. If contact information is missing, say "Information not available".
6. Do NOT add headings like "Confirmed Disaster" unless explicitly present in SYSTEM DATA.
7. Focus on immediate safety guidance.
8. Keep response concise and operational.
9. consider the history before response
`;

  const systemData = `
SYSTEM DATA:
${JSON.stringify(payload, null, 2)}
`;

  const chat = model.startChat({ history });

  const result = await chat.sendMessage([
    systemInstruction,
    systemData,
    `User Question: ${userMessage}`
  ]);

  return result.response.text();
};