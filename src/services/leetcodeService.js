const axios = require('axios');

const validateUrl = (url) => {
  try {
    const leetcodeUrlPattern = /^https:\/\/leetcode\.com\/problems\/[a-zA-Z0-9-]+(?:\/.*)?$/;
    return leetcodeUrlPattern.test(url);
  } catch (error) {
    return false;
  }
};

const extractProblemName = (url) => {
  try {
    const match = url.match(/problems\/([a-zA-Z0-9-]+)/);
    return match ? match[1] : null;
  } catch (error) {
    return null;
  }
};

const searchProblem = async (searchTerm) => {
  try {
    const response = await axios.post('https://leetcode.com/graphql', {
      query: `
        query searchProblems($searchTerm: String!) {
          problemsetQuestionList(searchKeyword: $searchTerm) {
            questions {
              titleSlug
              title
              difficulty
            }
          }
        }
      `,
      variables: { searchTerm }
    });
    return response.data.data.problemsetQuestionList.questions;
  } catch (error) {
    return null;
  }
};

const getProblemDetails = async (titleSlug) => {
  try {
    // Clean the slug by removing any query parameters
    const cleanSlug = titleSlug.split('?')[0].split('#')[0];
    
    console.log(`Making API request for problem: ${cleanSlug}`);
    
    // LeetCode GraphQL API endpoint
    const url = 'https://leetcode.com/graphql';
    
    // GraphQL query to get problem details
    const query = `
      query getQuestionDetail($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          questionId
          title
          content
          difficulty
          topicTags {
            name
          }
          codeSnippets {
            lang
            langSlug
            code
          }
          stats
          hints
        }
      }
    `;
    
    const response = await axios.post(url, {
      query,
      variables: { titleSlug: cleanSlug }
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.errors) {
      console.error('LeetCode API error:', response.data.errors);
      return null;
    }
    
    const questionData = response.data.data.question;
    if (!questionData) {
      console.log(`Problem not found: ${cleanSlug}`);
      return null;
    }
    
    return {
      id: questionData.questionId,
      title: questionData.title,
      content: questionData.content,
      difficulty: questionData.difficulty,
      topics: questionData.topicTags.map(tag => tag.name),
      codeSnippets: questionData.codeSnippets,
      stats: questionData.stats,
      hints: questionData.hints || []
    };
  } catch (error) {
    console.error(`Error fetching problem details for ${titleSlug}:`, error);
    return null;
  }
};

const checkProblemExists = async (titleSlug) => {
  try {
    const details = await getProblemDetails(titleSlug);
    return !!details;
  } catch (error) {
    console.error(`Error checking if problem exists: ${titleSlug}`, error);
    return false;
  }
};

module.exports = {
  validateUrl,
  extractProblemName,
  getProblemDetails,
  searchProblem,
  checkProblemExists
};