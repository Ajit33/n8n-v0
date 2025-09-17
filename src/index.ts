import { GoogleGenAI, type FunctionDeclaration } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai/web";
import dotenv from "dotenv";

dotenv.config();
// @ts-ignore
// Local implementation of sum
function calculateSum(a:number, b:number) {
    return `Sum is ${a + b}`;
}

const ai = new GoogleGenAI({
  apiKey: process.env.API_KEY as string,
});

// Function declaration (schema)
const sumFunctionCall: FunctionDeclaration = {
   name: 'sum',
    description: 'This tool is used to find the sum of 2 numbers',
    parametersJsonSchema: {
      type: 'object',
      properties:{
        a: {
          type:'number',
        },
        b: {
          type:'number',
        },
      },
      required: ['a', 'b'],
    },
};

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: "What is the sum of 2 and 3?",
    config: {
      tools: [{ functionDeclarations: [sumFunctionCall] }],
    },
  });

  if (!response) {
    process.exit(1);
  }

  processResponse(response)

  async function processResponse(response:GenerateContentResponse){
    const functionCalls=response.functionCalls;
    if (functionCalls && functionCalls.length > 0) {
	console.log(`Processing ${functionCalls.length} function calls:`);
	
	const functionResponses = [];
	
	for (const call of functionCalls) {
	    console.log(`Executing: ${call.name} with args:`, call.args);
	    
	    let functionResult;
	    switch (call.name) {
	         case 'sum':
              functionResult = calculateSum(call?.args?.a as number, call?.args?.b as number);
              break;
          default:
              functionResult = 'Unknown function';
	    }
	
	    functionResponses.push({
				functionResponse: {
					name: call.name,
					response: { result: functionResult }
				}
	    });
	}

	const finalResult = await ai.models.generateContent({
		model: 'gemini-2.0-flash',
    contents: [
      { text: 'Whats the sum of 2 and 3' },
      { text: response.candidates?.[0]?.content?.toString() ?? '' },
      ...functionResponses.map(fr => ({ text: JSON.stringify(fr) }))
    ],
	});
	console.log(finalResult.text)
} else {
	console.log('Direct response:', response.text);
}
  }