import Groq from 'groq-sdk';
import { Department } from '@/types';

const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not defined in environment variables');
  }
  return new Groq({ apiKey });
};

export interface AIClassificationResult {
  department_id: number;
  confidence: number;
}

export async function classifyGrievance(
  title: string,
  description: string,
  departments: Department[]
): Promise<AIClassificationResult> {
  const groq = getGroqClient();

  if (departments.length === 0) {
    throw new Error('No departments available for classification');
  }

  const departmentsList = departments
    .map((d) => `ID: ${d.id} - Name: ${d.name} (${d.desc})`)
    .join('\n');

  const systemPrompt = `You are an AI grievance routing assistant.
Your task is to classify a citizen's grievance into one of the available departments based on the title and description.
Analyze the details carefully and return the ID of the department that best fits the grievance, along with a confidence rating from 0 to 100 representing how sure you are of the match.

Available Departments:
${departmentsList}

You MUST return a JSON object ONLY, with no extra text, thoughts, or markdown formatting. The output must conform exactly to this schema:
{
  "department_id": number,
  "confidence": number
}`;

  const userPrompt = `Grievance Title: ${title}
Grievance Description: ${description}`;

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from Groq API');
    }

    const result = JSON.parse(content) as AIClassificationResult;
    
    // Validate result format
    if (typeof result.department_id !== 'number' || typeof result.confidence !== 'number') {
      throw new Error('Invalid JSON format from Groq');
    }

    return result;
  } catch (error) {
    console.error('Error during AI classification:', error);
    // Fallback classification: assign to the first department with low confidence
    return {
      department_id: departments[0].id,
      confidence: 50,
    };
  }
}
