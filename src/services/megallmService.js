const OpenAI = require('openai');
const leetcodeService = require('./leetcodeService');

if (!process.env.MEGALLM_API_KEY) {
  console.warn('MEGALLM_API_KEY environment variable is not set');
}

const openai = process.env.MEGALLM_API_KEY
  ? new OpenAI({
      baseURL: 'https://ai.megallm.io/v1',
      apiKey: process.env.MEGALLM_API_KEY.trim()
    })
  : null;

const stripHtml = (html) => {
  return html.replace(/<[^>]*>?/gm, '');
};

const generateResponse = async (message, leetcodeUrl, chatHistory = [], problemDetails = null) => {
  try {
    if (!openai) {
      throw new Error('MEGALLM_API_KEY is not configured');
    }

    const isProblemNew = problemDetails &&
                         chatHistory.length > 0 &&
                         !chatHistory.some(msg =>
                           msg.content && msg.content.includes(`I've found the problem "${problemDetails.title}"`));

    if (isProblemNew) {
      const plainContent = stripHtml(problemDetails.content);

      return `I've found the problem "${problemDetails.title}" (${problemDetails.difficulty}).

Here's what it's asking:
${plainContent.substring(0, 300)}${plainContent.length > 300 ? '...' : ''}

Let me know if you'd like to work on this problem, or if you meant a different one.`;
    }

    if (!problemDetails && !leetcodeUrl) {
      const words = message.toLowerCase().split(/\s+/);
      const searchTerm = words.slice(0, 3).join(' ');

      const searchResult = await leetcodeService.searchProblem(searchTerm);
      if (searchResult && searchResult.length > 0) {
        problemDetails = await leetcodeService.getProblemDetails(searchResult[0].titleSlug);

        if (problemDetails) {
          const plainContent = stripHtml(problemDetails.content);

          return `I've found the problem "${problemDetails.title}" (${problemDetails.difficulty}).

Here's what it's asking:
${plainContent.substring(0, 300)}${plainContent.length > 300 ? '...' : ''}

Let me know if you'd like to work on this problem, or if you meant a different one.`;
        }
      }
    }

    const systemPrompt = `You are an expert DSA Coach who believes in the power of guided discovery.
${problemDetails ? `
Currently discussing: ${problemDetails.title}
Difficulty: ${problemDetails.difficulty}
Problem: ${stripHtml(problemDetails.content)}
Examples: ${JSON.stringify(problemDetails.examples)}
Constraints: ${problemDetails.constraints?.join('\n')}
` : ''}

Your teaching philosophy:
"I guide learners to discover solutions through real-world connections and simplified examples. I don't give answers, I help students discover them."

When coaching:
1. Start with understanding:
   - "What parts of the problem make sense to you?"
   - "How would you solve this in real life without code?"
   - "Can you explain the problem using a real-world example?"

2. Use Socratic Method through:
     - Probing questions that lead to insights
     - Relevant analogies for beginners
     - Progressive hints that build understanding
     - Ask questions to help the user discover the solution
     - Break down into a simpler version
     - Use everyday scenarios (like organizing books, counting coins)

3. Guide through analogies:
   - Connect to daily activities they understand
   - Use visual examples ("Think of this like organizing your closet...")
   - Scale from simple to complex gradually


4. Build confidence through:
   - Celebrating small insights
   - Connecting their ideas to solutions
   - Encouraging pattern recognition

5. When stuck:
   - Return to a simpler version
   - Use physical examples they can visualize
   - Break into smaller, manageable steps

6. For identity questions:
   - Respond only with: "I'm your DSA Coach, here to help you solve coding problems."
   - Immediately follow with a problem-related question
   - Do not discuss your underlying technology or models
   - If conversation goes off-topic, gently redirect back to the problem at hand
   - For off-topic chat, respond with: "Let's focus on solving this problem. What part would you like to understand better?"

Coaching Style:
- Be encouraging: "That's a great observation! Let's build on it..."
- Make it relatable: "Think about how you'd solve this in your daily life..."
- Guide discovery: "What patterns do you notice if we try with just 2 items?"
- Break barriers: "Before we code, let's solve it with real objects..."

Key Rules:
- Never give direct solutions
- Try to Keep responses under 3 sentences
- Start with real-world examples
- Use physical analogies
- Celebrate each step forward

Remember: Your goal is to build their problem-solving muscles, not to solve the problem for them.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...chatHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: "user", content: message }
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-5",
      messages,
      temperature: 0.7,
      max_tokens: 500
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('MegaLLM API Error:', error);
    throw new Error('Failed to generate response from MegaLLM');
  }
};

module.exports = {
  generateResponse
};
