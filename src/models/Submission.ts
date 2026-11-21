import mongoose, { Schema, Document } from 'mongoose';

export interface ICriterionScore {
    criterion: string;
    score: number;
    reasoning: string;
}

export interface IGitHubCriteriaBreakdown {
    codeQualityMaintainability?: number; // 0-25
    technicalImplementation: number; // 0-25
    architectureProjectStructure?: number; // 0-20
    testingErrorHandling?: number; // 0-15
    documentationDevPractices?: number; // 0-15
    // Legacy / backward-compatibility aliases
    codeQuality?: number; // 0-25
    architecture?: number; // 0-20
    developmentActivity?: number; // 0-15
    documentationAndTesting?: number; // 0-15
}

export interface IGitHubCriteriaFeedback {
    codeQualityMaintainability?: string;
    technicalImplementation: string;
    architectureProjectStructure?: string;
    testingErrorHandling?: string;
    documentationDevPractices?: string;
    // Legacy / backward-compatibility aliases
    codeQuality?: string;
    architecture?: string;
    developmentActivity?: string;
    documentationAndTesting?: string;
}

export interface IGitHubEvaluation {
    repoUrl?: string;
    repoOwner?: string;
    repoName?: string;
    defaultBranch?: string;
    primaryLanguage?: string;
    stars?: number;
    forks?: number;
    openIssues?: number;
    submittedAt?: Date;
    analyzedAt?: Date;
    status: 'NOT_SUBMITTED' | 'ANALYZING' | 'EVALUATED' | 'FAILED';
    technicalScore?: number; // 0-100
    overallScore?: number; // 0-100 alias
    breakdown?: IGitHubCriteriaBreakdown;
    criteriaFeedback?: IGitHubCriteriaFeedback;
    technicalSummary?: string;
    summary?: string;
    architectureAssessment?: string;
    codeQualityAssessment?: string;
    documentationAssessment?: string;
    testingAssessment?: string;
    codeQualityObservations?: string;
    architectureObservations?: string;
    testingObservations?: string;
    securityObservations?: string;
    strengths?: string[];
    weaknesses?: string[];
    missingImplementationEvidence?: string[];
    missingComponents?: string[];
    improvementRecommendations?: string[];
    filesInspected?: string[];
    analysisLimitations?: string[];
    error?: string;
}

export interface IAIEvaluation {
    totalScore: number;
    summaryForJudges: string;
    criteriaScores: ICriterionScore[];
    missingSections: string[];
    strengths: string[];
    weaknesses: string[];
    plagiarismFlag: boolean;
    plagiarismWarning?: string;
    githubAnalysis?: {
        technicalComplexity: number;
        codeQuality: string;
        commitActivity: string;
    }
}

export interface IFinalScoreBreakdown {
    pitchScore: number;
    pitchWeight: number;
    githubScore: number;
    githubWeight: number;
    pitchContribution?: number;
    githubContribution?: number;
}

export interface ISubmission extends Document {
    team: mongoose.Types.ObjectId;
    hackathon?: mongoose.Types.ObjectId;
    fileUrl: string;
    fileName?: string;
    fileFormat?: 'pdf' | 'pptx' | 'ppt' | string;
    slideCount?: number;
    extractedTextLength?: number;
    extractionStatus?: 'SUCCESS' | 'FAILED' | 'EMPTY';
    hasVisualAssets?: boolean;
    extractionError?: string;
    status: 'PENDING' | 'AI_PROCESSING' | 'EVALUATED' | 'FAILED';
    aiEvaluation?: IAIEvaluation;
    githubEvaluation?: IGitHubEvaluation;
    finalScore?: number;
    finalScoreBreakdown?: IFinalScoreBreakdown;
    finalRank?: number;
    isWinner?: boolean;
    winnerPosition?: number;
    judgeFinalScore?: number;
    createdAt: Date;
    updatedAt: Date;
}

const SubmissionSchema: Schema = new Schema({
    team: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    hackathon: { type: Schema.Types.ObjectId, ref: 'Hackathon' },
    fileUrl: { type: String, required: true },
    fileName: { type: String },
    fileFormat: { type: String, enum: ['pdf', 'pptx', 'ppt', 'unknown'] },
    slideCount: { type: Number },
    extractedTextLength: { type: Number },
    extractionStatus: { type: String, enum: ['SUCCESS', 'FAILED', 'EMPTY'], default: 'SUCCESS' },
    hasVisualAssets: { type: Boolean, default: false },
    extractionError: { type: String },
    status: {
        type: String,
        enum: ['PENDING', 'AI_PROCESSING', 'EVALUATED', 'FAILED'],
        default: 'PENDING'
    },
    aiEvaluation: {
        totalScore: { type: Number },
        summaryForJudges: { type: String },
        criteriaScores: [{
            criterion: { type: String },
            score: { type: Number },
            reasoning: { type: String }
        }],
        missingSections: [{ type: String }],
        strengths: [{ type: String }],
        weaknesses: [{ type: String }],
        plagiarismFlag: { type: Boolean, default: false },
        plagiarismWarning: { type: String },
        githubAnalysis: {
            technicalComplexity: { type: Number },
            codeQuality: { type: String },
            commitActivity: { type: String }
        }
    },
    githubEvaluation: {
        repoUrl: { type: String },
        repoOwner: { type: String },
        repoName: { type: String },
        defaultBranch: { type: String },
        primaryLanguage: { type: String },
        stars: { type: Number },
        forks: { type: Number },
        openIssues: { type: Number },
        submittedAt: { type: Date },
        analyzedAt: { type: Date },
        status: {
            type: String,
            enum: ['NOT_SUBMITTED', 'ANALYZING', 'EVALUATED', 'FAILED'],
            default: 'NOT_SUBMITTED'
        },
        technicalScore: { type: Number },
        overallScore: { type: Number },
        breakdown: {
            codeQualityMaintainability: { type: Number },
            technicalImplementation: { type: Number },
            architectureProjectStructure: { type: Number },
            testingErrorHandling: { type: Number },
            documentationDevPractices: { type: Number },
            codeQuality: { type: Number },
            architecture: { type: Number },
            developmentActivity: { type: Number },
            documentationAndTesting: { type: Number }
        },
        criteriaFeedback: {
            codeQualityMaintainability: { type: String },
            technicalImplementation: { type: String },
            architectureProjectStructure: { type: String },
            testingErrorHandling: { type: String },
            documentationDevPractices: { type: String },
            codeQuality: { type: String },
            architecture: { type: String },
            developmentActivity: { type: String },
            documentationAndTesting: { type: String }
        },
        technicalSummary: { type: String },
        architectureAssessment: { type: String },
        codeQualityAssessment: { type: String },
        documentationAssessment: { type: String },
        testingAssessment: { type: String },
        codeQualityObservations: { type: String },
        architectureObservations: { type: String },
        testingObservations: { type: String },
        securityObservations: { type: String },
        strengths: [{ type: String }],
        weaknesses: [{ type: String }],
        missingImplementationEvidence: [{ type: String }],
        missingComponents: [{ type: String }],
        improvementRecommendations: [{ type: String }],
        filesInspected: [{ type: String }],
        analysisLimitations: [{ type: String }],
        summary: { type: String },
        error: { type: String }
    },
    finalScore: { type: Number },
    finalScoreBreakdown: {
        pitchScore: { type: Number },
        pitchWeight: { type: Number },
        githubScore: { type: Number },
        githubWeight: { type: Number },
        pitchContribution: { type: Number },
        githubContribution: { type: Number }
    },
    finalRank: { type: Number },
    isWinner: { type: Boolean, default: false },
    winnerPosition: { type: Number },
    judgeFinalScore: { type: Number }
}, { timestamps: true });

export default mongoose.models.Submission || mongoose.model<ISubmission>('Submission', SubmissionSchema);
