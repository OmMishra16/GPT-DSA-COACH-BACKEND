const leetcodeService = require('../services/leetcodeService');

const getProblemDetails = async (req, res, next) => {
  try {
    const { titleSlug } = req.params;
    
    // Clean the slug by removing any query parameters
    const cleanSlug = titleSlug.split('?')[0].split('#')[0];
    
    console.log(`Fetching problem details for: ${cleanSlug}`);
    
    const problemDetails = await leetcodeService.getProblemDetails(cleanSlug);
    
    if (!problemDetails) {
      console.log(`Problem not found: ${cleanSlug}`);
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }
    
    res.json({
      success: true,
      problemDetails
    });
  } catch (error) {
    console.error('Error fetching problem details:', error);
    next(error);
  }
};

const validateProblem = async (req, res, next) => {
  try {
    const { titleSlug } = req.params;
    const cleanSlug = titleSlug.split('?')[0].split('#')[0];
    
    console.log(`Validating problem: ${cleanSlug}`);
    
    const problemDetails = await leetcodeService.getProblemDetails(cleanSlug);
    
    res.json({
      success: true,
      isValid: !!problemDetails
    });
  } catch (error) {
    console.error('Error validating problem:', error);
    next(error);
  }
};

module.exports = {
  getProblemDetails,
  validateProblem
}; 