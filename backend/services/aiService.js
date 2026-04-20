const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const generateSupportResponse = async (userDetails) => {
  const { firstName, lastName, description, email } = userDetails;

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 1024,
    messages: [
      {
        role: 'system',
        content: `You are a friendly and professional student support agent for UniNEST, a student annex rental platform in Sri Lanka that connects university students with verified landlords and annex owners.`,
      },
      {
        role: 'user',
        content: `A user has submitted a support ticket. Generate a helpful, warm, and professional email response body.

User Details:
- Name: ${firstName} ${lastName}
- Email: ${email}
- Issue Description: ${description}

Instructions:
- Address the user by their first name
- Acknowledge their specific issue clearly and with empathy
- Provide helpful, actionable steps or solutions relevant to student annex rental
- Keep it professional but warm — avoid robotic language
- End with reassurance that the human support team is available if needed
- Do NOT include a subject line — just the email body
- Start with "Dear ${firstName},"
- Sign off as: "Warm regards,\nUniNEST Support Team\nsupport@uninest.lk | +94 11 234 5678"
- Keep the response between 150–250 words`,
      },
    ],
  });

  return response.choices[0].message.content;
};

module.exports = { generateSupportResponse };