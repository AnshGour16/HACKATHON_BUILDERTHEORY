import { GoogleGenAI } from '@google/genai';
import { ITrack } from '@/models/Hackathon';

// Initialize the Gemini SDK. 
// Note: You must ensure GEMINI_API_KEY is set in your .env.local file.
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export interface IEvaluationOptions {
    trackSettings?: ITrack | null;
    hackathonName?: string;
    hackathonTheme?: string;
    hackathonDescription?: string;
    customAiPrompt?: string;
}

/**
 * Helper function to evaluate the parsed presentation text.
 * Expects a structured JSON response matching the IAIEvaluation interface.
 */
export async function evaluatePresentationWithGemini(
    presentationText: string,
    options: IEvaluationOptions | ITrack | null = null
) {
    let trackSettings: ITrack | null = null;
    let hackathonName = '';
    let hackathonTheme = '';
    let hackathonDescription = '';
    let customAiPrompt = '';

    if (options) {
        if ('rubrics' in options || ('name' in options && !('trackSettings' in options))) {
            trackSettings = options as ITrack;
        } else {
            const opts = options as IEvaluationOptions;
            trackSettings = opts.trackSettings || null;
            hackathonName = opts.hackathonName || '';
            hackathonTheme = opts.hackathonTheme || '';
            hackathonDescription = opts.hackathonDescription || '';
            customAiPrompt = opts.customAiPrompt || '';
        }
    }

    // Base Default Criteria
    let criteriaString = `
    { "criterion": "Innovation", "score": number (0-10), "reasoning": "string" },
    { "criterion": "Technical Feasibility", "score": number (0-10), "reasoning": "string" },
    { "criterion": "Completeness", "score": number (0-10), "reasoning": "string" }
  `;
    let maxPossibleScore = 30;
    let requiredSlidesString = `'Tech Stack', 'Business Model', etc.`;
    let additionalInstructions = '';

    // Apply Track Overrides
    if (trackSettings) {
        if (trackSettings.rubrics && trackSettings.rubrics.length > 0) {
            maxPossibleScore = trackSettings.rubrics.reduce((sum, r) => sum + (Number(r.weightage) || 10), 0) || 10;
            criteriaString = trackSettings.rubrics.map((r: { criterion: string; weightage: number; description?: string }) =>
                `    { "criterion": "${r.criterion}", "score": number (0-${r.weightage}), "reasoning": "string (Consider: ${r.description || ''})" }`
            ).join(',\n');
        }
        if (trackSettings.requiredSlides && trackSettings.requiredSlides.length > 0) {
            requiredSlidesString = trackSettings.requiredSlides.map((s: string) => `'${s}'`).join(', ');
            additionalInstructions += `\nCRITICAL: You MUST explicitly check if these specific slides/sections exist: [${requiredSlidesString}]. If ANY are missing, log them exactly in 'missingSections'.`;
        }
    }

    let hackathonContext = '';
    if (hackathonName) {
        hackathonContext += `\nHACKATHON CONTEXT:
- Name: "${hackathonName}"
${hackathonTheme ? `- Core Theme: "${hackathonTheme}"` : ''}
${hackathonDescription ? `- Description / Problem Space: "${hackathonDescription}"` : ''}
`;
    }

    if (customAiPrompt && customAiPrompt.trim()) {
        hackathonContext += `\nSPECIFIC ORGANIZER INSTRUCTIONS & CUSTOM AI PROMPT:
"""
${customAiPrompt.trim()}
"""
`;
        additionalInstructions += `\nCRITICAL EVALUATION MANDATE: The hackathon organizers have specified the custom instructions above. You MUST strictly weigh and evaluate the idea against these organizer guidelines and the stated theme.`;
    }

    const prompt = `
You are an expert Hackathon Judge and Senior Software Engineer evaluating a project submission. 
Based on the text extracted from the team's presentation below, evaluate the project.
${hackathonContext}
${additionalInstructions}

Furthermore, check for IDEA PLAGIARISM or CLICHE: Utilize your worldly knowledge to determine if this idea is a highly common unoriginal hackathon cliche (e.g. "blockchain medical records") or directly copied from famous past winners or standard open source tutorials. Base this strictly on originality.

Provide a strict JSON response containing the following structure:
{
  "totalScore": number (Normalized overall score from 0 to 100 based on the criteria scores out of ${maxPossibleScore}),
  "summaryForJudges": string (A concise 1-paragraph summary of the project),
  "criteriaScores": [
${criteriaString}
  ],
  "missingSections": [ "string" (List exactly which items from the required list are completely missing, or empty array) ],
  "strengths": [ "string" ],
  "weaknesses": [ "string" ],
  "plagiarismFlag": boolean (true if highly derivative/cliche/plagiarized, false if reasonably original),
  "plagiarismWarning": string or null (If plagiarismFlag is true, briefly explain why. e.g. "This is a generic cliche project that has been built many times before (Blockchain Medical Records)")
}

Presentation Text:
"""
${presentationText}
"""
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    if (response.text) {
      const cleaned = response.text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      const parsed = JSON.parse(cleaned);
      // Normalize totalScore consistently onto a 0-100 scale from criteriaScores when available
      if (Array.isArray(parsed.criteriaScores) && parsed.criteriaScores.length > 0 && maxPossibleScore > 0) {
        const sum = parsed.criteriaScores.reduce((acc: number, c: { score?: number }) => acc + (Number(c.score) || 0), 0);
        parsed.totalScore = Math.max(0, Math.min(100, Math.round((sum / maxPossibleScore) * 100)));
      } else if (typeof parsed.totalScore === 'number') {
        parsed.totalScore = Math.max(0, Math.min(100, Math.round(parsed.totalScore)));
      }
      return parsed;
    }
    throw new Error('No text returned from Gemini API');
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
}

export interface ICodebaseEvaluationResult {
    technicalScore: number;
    breakdown: {
        codeQuality: number; // 0-25
        technicalImplementation: number; // 0-25
        architecture: number; // 0-20
        developmentActivity: number; // 0-15
        documentationAndTesting: number; // 0-15
    };
    criteriaFeedback: {
        codeQuality: string;
        technicalImplementation: string;
        architecture: string;
        developmentActivity: string;
        documentationAndTesting: string;
    };
    architectureAssessment: string;
    codeQualityAssessment: string;
    documentationAssessment: string;
    testingAssessment: string;
    strengths: string[];
    weaknesses: string[];
    missingComponents: string[];
    summary: string;
    githubAnalysis?: {
        technicalComplexity: number;
        codeQuality: string;
        commitActivity: string;
    };
}

/**
 * Helper function to evaluate the team's GitHub codebase using Gemini.
 * Follows a strict 5-part rubric totaling 100 points:
 * - Code Quality (25%)
 * - Technical Implementation (25%)
 * - Architecture & Design (20%)
 * - Development Activity (15%)
 * - Documentation & Testing (15%)
 */
export async function evaluateCodebaseWithGemini(
    githubContext: string,
    hackathonInfo: { name?: string; theme?: string; customAiPrompt?: string; description?: string } | null = null
): Promise<ICodebaseEvaluationResult> {
    let extraContext = '';
    if (hackathonInfo?.name || hackathonInfo?.theme) {
        extraContext += `\nHACKATHON DOMAIN CONTEXT:
- Event Name: "${hackathonInfo.name || 'Hackathon'}"
${hackathonInfo.theme ? `- Theme/Track: "${hackathonInfo.theme}"` : ''}
${hackathonInfo.description ? `- Description: "${hackathonInfo.description}"` : ''}
`;
    }
    if (hackathonInfo?.customAiPrompt && hackathonInfo.customAiPrompt.trim()) {
        extraContext += `\nORGANIZER TECHNICAL CRITERIA & CUSTOM INSTRUCTIONS:
"""
${hackathonInfo.customAiPrompt.trim()}
"""
`;
    }

    const prompt = `
You are a Principal Software Architect and Senior Technical Hackathon Judge evaluating a project's codebase.
Based strictly on the data gathered from the team's GitHub repository below, perform a rigorous technical audit.

${extraContext}

SCORING RUBRIC (Strictly out of 100 points):
1. Code Quality (0 to 25 points):
   - Readability, code hygiene, logical structure, error handling, clean interfaces, separation of concerns.
2. Technical Implementation (0 to 25 points):
   - Engineering depth, non-trivial functionality, proper integration of frameworks/APIs, real logic vs boilerplate templates.
3. Architecture & Design (0 to 20 points):
   - Modularity, scalability, directory organization, state management, decoupling of frontend/backend/services.
4. Development Activity (0 to 15 points):
   - Genuine development effort, iterative progress, meaningful commit messages, authentic cadence during the hackathon.
5. Documentation & Testing (0 to 15 points):
   - README setup instructions, prerequisites, architecture clarity, presence of automated tests (unit/integration) or CI/CD pipelines.

CRITICAL EVALUATION GUIDELINES:
- Base your scoring strictly on observed evidence from the provided repository audit.
- Do NOT reward complexity simply because a project has many auto-generated files or vendor packages.
- Do NOT assume a high commit count automatically proves genuine development (check for meaningful commit messages).
- Do NOT claim code originality or plagiarism detection without verifiable evidence.
- Distinguish clearly between observed evidence (e.g. "package.json contains jest", "no test directory detected") and inferences.
- If automated tests or documentation are absent or inaccessible, explicitly explain that fact in the respective assessment.

Provide a strict, valid JSON response with the following schema:
{
  "technicalScore": number (0-100, exact sum of the 5 breakdown scores),
  "breakdown": {
    "codeQuality": number (0-25),
    "technicalImplementation": number (0-25),
    "architecture": number (0-20),
    "developmentActivity": number (0-15),
    "documentationAndTesting": number (0-15)
  },
  "criteriaFeedback": {
    "codeQuality": "string (Specific feedback explaining the code quality score)",
    "technicalImplementation": "string (Specific feedback on implementation depth)",
    "architecture": "string (Specific feedback on structural architecture)",
    "developmentActivity": "string (Specific feedback on commit cadence & progress)",
    "documentationAndTesting": "string (Specific feedback on README & testing evidence)"
  },
  "architectureAssessment": "string (1-2 paragraphs detailing the system architecture)",
  "codeQualityAssessment": "string (Detailed assessment of coding practices and hygiene)",
  "documentationAssessment": "string (Assessment of setup instructions and API docs)",
  "testingAssessment": "string (Assessment of tests or noted absence of test suites)",
  "strengths": [ "string" (List 2 to 4 technical strengths) ],
  "weaknesses": [ "string" (List 2 to 4 technical weaknesses or tech debt) ],
  "missingComponents": [ "string" (List missing architecture pieces, e.g. tests, env examples, validation) ],
  "summary": "string (A concise 1-2 paragraph technical executive summary for judges)"
}

GitHub Repository Data Context:
"""
${githubContext}
"""
`;

  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      if (response.text) {
        const cleaned = response.text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
        const parsed = JSON.parse(cleaned);

        // Validate and enforce score constraints
        const bd = parsed.breakdown || {};
        const cq = Math.max(0, Math.min(25, Number(bd.codeQuality) || 0));
        const ti = Math.max(0, Math.min(25, Number(bd.technicalImplementation) || 0));
        const ar = Math.max(0, Math.min(20, Number(bd.architecture) || 0));
        const da = Math.max(0, Math.min(15, Number(bd.developmentActivity) || 0));
        const dt = Math.max(0, Math.min(15, Number(bd.documentationAndTesting) || 0));

        const computedScore = cq + ti + ar + da + dt;
        parsed.technicalScore = typeof parsed.technicalScore === 'number'
          ? Math.max(0, Math.min(100, Math.round(parsed.technicalScore)))
          : computedScore;

        parsed.breakdown = {
          codeQuality: cq,
          technicalImplementation: ti,
          architecture: ar,
          developmentActivity: da,
          documentationAndTesting: dt
        };

        // Populate legacy githubAnalysis object for backward compatibility
        parsed.githubAnalysis = {
          technicalComplexity: parsed.technicalScore,
          codeQuality: parsed.codeQualityAssessment || parsed.criteriaFeedback?.codeQuality || 'Code quality evaluated',
          commitActivity: parsed.criteriaFeedback?.developmentActivity || 'Commit activity evaluated'
        };

        return parsed;
      }
    } catch (err: unknown) {
      lastError = err;
      console.warn(`[Gemini Codebase Evaluation] Attempt ${attempt} failed:`, err instanceof Error ? err.message : err);
      if (attempt < 3) {
        await new Promise(r => setTimeout(r, attempt * 1500));
      }
    }
  }

  throw lastError || new Error('No text returned from Gemini API after retries');
}
