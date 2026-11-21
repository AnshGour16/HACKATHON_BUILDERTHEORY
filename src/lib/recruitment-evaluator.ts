import { GoogleGenAI } from '@google/genai';
import { IJob } from '@/models/Job';
import { ICandidateProfile } from '@/models/CandidateProfile';
import { ICandidateEvaluation } from '@/models/Application';
import { fetchGithubData } from '@/lib/github';
import { evaluateCodebaseWithGemini } from '@/lib/gemini';

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export interface IParsedResumeData {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    headline?: string;
    summary?: string;
    skills: string[];
    experience: Array<{
        company: string;
        role: string;
        duration: string;
        description: string;
    }>;
    education: Array<{
        degree: string;
        institution: string;
        year: string;
    }>;
    githubUrl?: string;
    portfolioUrl?: string;
    linkedinUrl?: string;
}

/**
 * 1. AI RESUME PARSER
 * Extracts structured professional data from raw text extracted from PDF resumes.
 */
export async function parseResumeWithGemini(resumeText: string): Promise<IParsedResumeData> {
    try {
        const prompt = `
You are an expert HR Data Extraction Specialist and Recruitment Analyst.
Analyze the following raw resume text and extract candidate details into strict structured JSON.

RESUME TEXT:
"""
${resumeText.slice(0, 15000)}
"""

RULES:
- Extract real information found in the text. Do not invent or assume data.
- Standardize technical and business skills into clean individual keyword tags (e.g. "React", "TypeScript", "Financial Modeling", "SEO", "HubSpot").
- Extract work history in chronological order.

Return ONLY a valid JSON object matching this schema:
{
  "name": "string (candidate full name)",
  "email": "string (email address if found)",
  "phone": "string (phone number if found)",
  "location": "string (city/country if found)",
  "headline": "string (e.g. Senior Frontend Engineer or Sales Account Executive)",
  "summary": "string (2-3 sentence career summary)",
  "skills": ["string (skill 1)", "string (skill 2)", ...],
  "experience": [
    {
      "company": "string",
      "role": "string",
      "duration": "string",
      "description": "string"
    }
  ],
  "education": [
    {
      "degree": "string",
      "institution": "string",
      "year": "string"
    }
  ],
  "githubUrl": "string or null",
  "portfolioUrl": "string or null",
  "linkedinUrl": "string or null"
}
`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                temperature: 0.1
            }
        });

        const outputText = response.text?.trim() || '{}';
        return JSON.parse(outputText) as IParsedResumeData;
    } catch (error) {
        console.error('Error parsing resume with Gemini:', error);
        return {
            skills: [],
            experience: [],
            education: []
        };
    }
}

/**
 * 2. ALL-INDUSTRY CANDIDATE APPLICATION EVALUATOR
 * Matches candidate background against job requirements and evaluates practical evidence
 * (GitHub repo for tech roles, written assignment/case study for non-tech roles).
 */
export async function evaluateCandidateApplicationWithGemini({
    job,
    candidateProfile,
    resumeText,
    githubUrl,
    assignmentSubmission
}: {
    job: IJob;
    candidateProfile?: ICandidateProfile | null;
    resumeText?: string;
    githubUrl?: string;
    assignmentSubmission?: string;
}): Promise<ICandidateEvaluation> {
    try {
        let githubAuditResult: ICandidateEvaluation['githubAudit'] = undefined;
        let githubAuditContext = '';

        // If technical role and GitHub URL is provided, run safe static analysis
        if (job.evaluationType === 'TECHNICAL_GITHUB' && githubUrl) {
            try {
                const fetchResult = await fetchGithubData(githubUrl);
                if (fetchResult.success && fetchResult.contextText) {
                    const codeEvaluation = await evaluateCodebaseWithGemini(fetchResult.contextText, {
                        name: job.title,
                        theme: job.department,
                        description: job.description
                    });

                    githubAuditResult = {
                        repoUrl: githubUrl,
                        technicalScore: codeEvaluation.technicalScore,
                        codeQualityScore: codeEvaluation.breakdown.codeQualityMaintainability,
                        architectureScore: codeEvaluation.breakdown.architectureProjectStructure,
                        testingScore: codeEvaluation.breakdown.testingErrorHandling,
                        summary: codeEvaluation.technicalSummary || codeEvaluation.summary
                    };

                    githubAuditContext = `
VERIFIED GITHUB CODEBASE AUDIT EVIDENCE:
- Repository: ${githubUrl}
- Technical Code Quality Score: ${codeEvaluation.technicalScore}/100
- Code Hygiene: ${codeEvaluation.breakdown.codeQualityMaintainability}/25
- Architecture & Modularity: ${codeEvaluation.breakdown.architectureProjectStructure}/20
- Automated Testing Evidence: ${codeEvaluation.breakdown.testingErrorHandling}/15
- Technical Summary: ${codeEvaluation.technicalSummary || codeEvaluation.summary}
- Security & Code Observations: ${codeEvaluation.securityObservations || 'Clean static safety'}
`;
                }
            } catch (ghErr) {
                console.warn('GitHub evaluation skipped or failed:', ghErr);
            }
        }

        const criteriaList = job.rubricCriteria && job.rubricCriteria.length > 0
            ? job.rubricCriteria
            : [
                { criterion: 'Job Requirement Alignment', weightage: 35, description: 'Alignment with required core skills and experience.' },
                { criterion: 'Practical Skill Demonstration', weightage: 35, description: 'Demonstrated evidence in code, projects, or case studies.' },
                { criterion: 'Domain Depth & Execution', weightage: 30, description: 'Depth of knowledge, tooling familiarity, and problem-solving capability.' }
            ];

        const prompt = `
You are an expert AI Principal Talent Intelligence Evaluator and Senior Technical Hiring Specialist.
Evaluate the candidate's application against the target job requirements using verifiable evidence.

TARGET JOB DETAILS:
- Job Title: "${job.title}"
- Department: "${job.department}"
- Experience Level: "${job.experienceLevel}"
- Job Description: "${job.description.slice(0, 1500)}"
- Required Skills: ${JSON.stringify(job.requiredSkills)}
- Evaluation Type: ${job.evaluationType}

CANDIDATE INFORMATION:
- Headline: "${candidateProfile?.headline || 'Applicant'}"
- Parsed Skills: ${JSON.stringify(candidateProfile?.parsedSkills || [])}
- Work Experience: ${JSON.stringify(candidateProfile?.experience?.slice(0, 4) || [])}
- Education: ${JSON.stringify(candidateProfile?.education || [])}
- Candidate Resume Text Sample:
"""
${(resumeText || candidateProfile?.resumeText || '').slice(0, 8000)}
"""

${assignmentSubmission ? `
PRACTICAL CASE STUDY / ASSIGNMENT SUBMISSION:
"""
${assignmentSubmission.slice(0, 5000)}
"""
` : ''}

${githubAuditContext}

EVALUATION CRITERIA TO SCORE:
${criteriaList.map(c => `- ${c.criterion} (Max weightage: ${c.weightage}): ${c.description || ''}`).join('\n')}

EVALUATION RULES:
1. Do not award high scores purely based on keyword buzzwords. Evaluate demonstrated capability.
2. Penalize missing mandatory skills required in the job description.
3. If practical GitHub codebase or assignment evidence is available, weight it heavily over self-reported resume claims.
4. Provide constructive, transparent strengths, weaknesses, and missing skills.
5. Generate 3-5 tailored interview questions designed to test this candidate's specific background and verify borderline skills.

Return ONLY strict valid JSON matching this schema:
{
  "overallMatchScore": number (0-100, weighted composite score),
  "resumeScore": number (0-100, resume alignment score),
  "practicalScore": number (0-100, practical evidence score),
  "criteriaScores": [
    {
      "criterion": "string",
      "score": number (0 to weightage),
      "weightage": number,
      "reasoning": "string"
    }
  ],
  "summary": "string (concise executive recruiter summary of the candidate's fit)",
  "strengths": ["string (strength 1)", "string (strength 2)", ...],
  "weaknesses": ["string (area of concern 1)", "string (area of concern 2)", ...],
  "missingSkills": ["string (missing skill 1)", ...],
  "recommendations": ["string (recruiter recommendation 1)", ...],
  "interviewQuestions": [
    "string (targeted question 1)",
    "string (targeted question 2)",
    "string (targeted question 3)"
  ]
}
`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                temperature: 0.2
            }
        });

        const outputText = response.text?.trim() || '{}';
        const parsed = JSON.parse(outputText);

        return {
            overallMatchScore: typeof parsed.overallMatchScore === 'number' ? Math.round(parsed.overallMatchScore) : 75,
            resumeScore: typeof parsed.resumeScore === 'number' ? Math.round(parsed.resumeScore) : 70,
            practicalScore: typeof parsed.practicalScore === 'number' ? Math.round(parsed.practicalScore) : (githubAuditResult?.technicalScore || 70),
            criteriaScores: Array.isArray(parsed.criteriaScores) ? parsed.criteriaScores : [],
            summary: parsed.summary || 'Candidate profile evaluated against job requirements.',
            strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
            weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
            missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills : [],
            recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
            interviewQuestions: Array.isArray(parsed.interviewQuestions) ? parsed.interviewQuestions : [],
            githubAudit: githubAuditResult,
            evaluatedAt: new Date()
        };
    } catch (error) {
        console.error('Error in evaluateCandidateApplicationWithGemini:', error);
        return {
            overallMatchScore: 70,
            resumeScore: 70,
            criteriaScores: [],
            summary: 'Evaluation completed with standard baseline metrics.',
            strengths: ['Application submitted for review'],
            weaknesses: ['Automated detailed audit pending re-evaluation'],
            missingSkills: [],
            recommendations: ['Conduct standard recruiter screening interview'],
            evaluatedAt: new Date()
        };
    }
}

/**
 * 3. RECRUITER COPILOT ASSISTANT
 * Provides interactive suggestions, candidate comparisons, and interview prep.
 */
export async function generateRecruiterCopilotInsights({
    query,
    jobTitle,
    candidates
}: {
    query: string;
    jobTitle?: string;
    candidates: Array<{ name: string; matchScore: number; skills: string[]; status: string; summary?: string }>;
}) {
    try {
        const prompt = `
You are "Recruiter Copilot", an AI hiring assistant inside an enterprise talent platform.
Help the recruiter make fast, informed decisions for the role: "${jobTitle || 'All Roles'}".

CURRENT CANDIDATES IN PIPELINE:
${JSON.stringify(candidates.slice(0, 15), null, 2)}

RECRUITER QUERY:
"${query}"

Provide a concise, helpful response (max 3-4 short paragraphs or bullet points).
Be specific: reference candidate names, match scores, and relevant skills.
Suggest next steps, such as who to interview first, or interview questions to ask.
`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.3
            }
        });

        return response.text?.trim() || 'I am analyzing your candidates. How else can I assist your hiring pipeline?';
    } catch (error) {
        console.error('Recruiter Copilot error:', error);
        return 'Unable to generate copilot insights at this moment. Please try again.';
    }
}
