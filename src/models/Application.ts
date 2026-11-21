import mongoose, { Schema, Document } from 'mongoose';

export type ApplicationStage =
    | 'APPLIED'
    | 'SCREENING'
    | 'ASSESSMENT'
    | 'SHORTLISTED'
    | 'INTERVIEW'
    | 'OFFER'
    | 'HIRED'
    | 'REJECTED';

export interface ICandidateEvaluationCriterion {
    criterion: string;
    score: number;
    weightage: number;
    reasoning: string;
}

export interface ICandidateEvaluation {
    overallMatchScore: number; // 0-100
    resumeScore: number; // 0-100
    practicalScore?: number; // 0-100 (GitHub or assignment)
    criteriaScores: ICandidateEvaluationCriterion[];
    summary: string;
    strengths: string[];
    weaknesses: string[];
    missingSkills: string[];
    recommendations: string[];
    interviewQuestions?: string[];
    githubAudit?: {
        repoUrl?: string;
        technicalScore?: number;
        codeQualityScore?: number;
        architectureScore?: number;
        testingScore?: number;
        summary?: string;
    };
    assignmentAudit?: {
        score?: number;
        feedback?: string;
    };
    evaluatedAt: Date;
}

export interface IApplication extends Document {
    job: mongoose.Types.ObjectId;
    candidate: mongoose.Types.ObjectId;
    candidateProfile?: mongoose.Types.ObjectId;
    status: ApplicationStage;
    stageOrder: number; // For pipeline sorting
    resumeUrl?: string;
    resumeFileName?: string;
    githubUrl?: string;
    assignmentSubmission?: string;
    matchScore: number; // 0-100
    aiEvaluation?: ICandidateEvaluation;
    recruiterNotes?: string;
    interviewScheduledDate?: Date;
    rating?: number; // 1-5 recruiter manual rating
    appliedAt: Date;
    updatedAt: Date;
}

const ApplicationSchema: Schema = new Schema({
    job: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    candidate: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    candidateProfile: { type: Schema.Types.ObjectId, ref: 'CandidateProfile' },
    status: {
        type: String,
        enum: ['APPLIED', 'SCREENING', 'ASSESSMENT', 'SHORTLISTED', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'],
        default: 'APPLIED'
    },
    stageOrder: { type: Number, default: 0 },
    resumeUrl: { type: String },
    resumeFileName: { type: String },
    githubUrl: { type: String },
    assignmentSubmission: { type: String },
    matchScore: { type: Number, default: 0 },
    aiEvaluation: {
        overallMatchScore: { type: Number },
        resumeScore: { type: Number },
        practicalScore: { type: Number },
        criteriaScores: [{
            criterion: { type: String },
            score: { type: Number },
            weightage: { type: Number },
            reasoning: { type: String }
        }],
        summary: { type: String },
        strengths: [{ type: String }],
        weaknesses: [{ type: String }],
        missingSkills: [{ type: String }],
        recommendations: [{ type: String }],
        interviewQuestions: [{ type: String }],
        githubAudit: {
            repoUrl: { type: String },
            technicalScore: { type: Number },
            codeQualityScore: { type: Number },
            architectureScore: { type: Number },
            testingScore: { type: Number },
            summary: { type: String }
        },
        assignmentAudit: {
            score: { type: Number },
            feedback: { type: String }
        },
        evaluatedAt: { type: Date }
    },
    recruiterNotes: { type: String },
    interviewScheduledDate: { type: Date },
    rating: { type: Number, min: 1, max: 5 },
    appliedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Ensure unique application per candidate per job
ApplicationSchema.index({ job: 1, candidate: 1 }, { unique: true });

export default mongoose.models.Application || mongoose.model<IApplication>('Application', ApplicationSchema);
