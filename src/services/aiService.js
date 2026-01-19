const geminiService = require('./geminiService');
const gptService = require('./gptService');
const megallmService = require('./megallmService');
const groqService = require('./groqService');

const PROVIDERS = {
  GEMINI: 'gemini',
  OPENAI: 'openai',
  MEGALLM: 'megallm',
  GROQ: 'groq'
};

const DEFAULT_PROVIDER = process.env.DEFAULT_AI_PROVIDER || PROVIDERS.GROQ;

const generateResponse = async (message, leetcodeUrl, chatHistory = [], problemDetails = null, provider = null) => {
  const selectedProvider = provider || DEFAULT_PROVIDER;

  console.log(`Using AI provider: ${selectedProvider}`);

  switch (selectedProvider.toLowerCase()) {
    case PROVIDERS.OPENAI:
      return gptService.generateResponse(message, leetcodeUrl, chatHistory, problemDetails);

    case PROVIDERS.GEMINI:
      return geminiService.generateResponse(message, leetcodeUrl, chatHistory, problemDetails);

    case PROVIDERS.MEGALLM:
      return megallmService.generateResponse(message, leetcodeUrl, chatHistory, problemDetails);

    case PROVIDERS.GROQ:
    default:
      return groqService.generateResponse(message, leetcodeUrl, chatHistory, problemDetails);
  }
};

module.exports = {
  generateResponse,
  PROVIDERS,
  DEFAULT_PROVIDER
};
