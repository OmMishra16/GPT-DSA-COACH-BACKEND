const leetcodeService = require('./leetcodeService');

const tools = [
  {
    type: 'function',
    function: {
      name: 'search_leetcode_problem',
      description: 'Search for a LeetCode problem by name or keywords',
      parameters: {
        type: 'object',
        properties: {
          searchTerm: {
            type: 'string',
            description: 'Problem name or keywords to search for'
          }
        },
        required: ['searchTerm']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_problem_details',
      description: 'Get detailed information about a specific LeetCode problem',
      parameters: {
        type: 'object',
        properties: {
          titleSlug: {
            type: 'string',
            description: 'The URL slug of the LeetCode problem'
          }
        },
        required: ['titleSlug']
      }
    }
  }
];

const executeFunction = async (name, args) => {
  switch (name) {
    case 'search_leetcode_problem':
      return await leetcodeService.searchProblem(args.searchTerm);
    case 'get_problem_details':
      return await leetcodeService.getProblemDetails(args.titleSlug);
    default:
      throw new Error(`Unknown function: ${name}`);
  }
};

module.exports = { tools, executeFunction }; 