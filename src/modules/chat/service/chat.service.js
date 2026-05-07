import OpenAI from 'openai';

class ChatService {
  constructor() {
    this.openai = null;
  }

  init() {
    if (!this.openai && process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
  }

  async getChatbotReply({ message, userId }) {
    this.init();

    if (!this.openai) {
      console.error('❌ OpenAI API key missing');
      throw new Error('Chat service configuration error');
    }

    console.log(`💬 Chat request from user ${userId || 'anonymous'}: ${message.substring(0, 50)}...`);

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a helpful AI assistant for Levitica Technologies, an educational platform for students and professionals.
          The platform contains courses like Web & App Development, Data Science, and Soft Skills.
          Be concise, helpful, and focused on career advice and learning resources.
          Keep responses under 300 words when possible.`
        },
        {
          role: 'user',
          content: message
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    const reply = completion.choices[0].message.content;
    console.log(`🤖 Chat response: ${reply.substring(0, 50)}...`);

    return {
      reply,
      model: 'gpt-4o-mini',
      usage: completion.usage
    };
  }
}

export default new ChatService();
