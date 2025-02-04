import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY);
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-pro",
    systemInstruction: `
    {
      name: "BUTO AI",
      developer: "Atharva Ralegankar",
      role: "Senior software developer assistant",
      
      displayFormat: {
        leftColumn: {
          type: "explanation",
          content: "Natural conversation and explanations about the implementation, architecture, and important considerations",
          format: "Markdown with syntax highlighting"
        },
        middleColumn: {
          type: "fileList",
          content: "List of generated files with their names",
          purpose: "Navigation between generated files"
        },
        rightColumn: {
          type: "fileContent",
          content: "Content of the currently selected file",
          format: "Code with syntax highlighting"
        }
      },

      responseStructure: {
        type: "object",
        format: {
          explanation: "Detailed explanation in markdown (displays in left column)",
          files: {
            type: "object",
            description: "Key-value pairs of filename:content (displays in middle/right columns)",
            example: {
              "index.js": "// Code content...",
              "styles.css": "/* CSS content... */"
            }
          },
          buildSteps: "Array of build instructions",
          runCommands: "Array of execution commands"
        }
      },

      rules: [
        "Always provide explanation in markdown format",
        "Always include complete, functional code in files",
        "Structure responses to fit the three-column layout",
        "Keep explanations and file content separate",
        "Generate proper file extensions for code",
        "Include all necessary imports and dependencies"
      ]
    }`,
});

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const removeAllTripleBackticks = (text) => {
  // Remove all instances of ```
  return text.replace(/```/g, '');
};

const extractJsonObject = (text) => {
  // Find the first '{'
  const start = text.indexOf('{');
  // Find the last '}'
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('No JSON object found in response');
  }
  // Extract substring and remove backticks
  const jsonString = text.slice(start, end + 1).replace(/`/g, '');
  return JSON.parse(jsonString);
};

const generateResultWithRetry = async (prompt, retries = 3, backoff = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      try {
        // Remove any markdown code block formatting if present
        const cleanedResponse = responseText
          .replace(/^```json\s*/, '')
          .replace(/```\s*$/, '')
          .trim();
        
        const finalResponse = extractJsonObject(cleanedResponse);

        return finalResponse;
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error('Invalid response format');
      }
    } catch (error) {
      if (error.status === 503) {
        console.log(`API overloaded, attempt ${i + 1} of ${retries}. Waiting ${backoff}ms...`);
        if (i < retries - 1) {
          await delay(backoff);
          backoff *= 2; // Exponential backoff
          continue;
        }
      }
      throw error;
    }
  }
  
  throw new Error('Maximum retries reached');
};

export const generateResult = async (prompt) => {
  try {
    const response = await generateResultWithRetry(prompt);
    return {
      explanation: response.explanation || "No explanation provided",
      files: response.files || {},
      buildSteps: response.buildSteps || [],
      runCommands: response.runCommands || []
    };
  } catch (error) {
    console.error('AI Service Error:', error);
    return {
      explanation: error.status === 503 
        ? "The AI service is currently overloaded. Please try again in a few moments."
        : "Error: Failed to process the AI response. Please try again.",
      files: {},
      buildSteps: [],
      runCommands: []
    };
  }
};