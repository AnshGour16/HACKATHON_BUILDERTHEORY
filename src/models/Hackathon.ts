import mongoose, { Schema, Document } from 'mongoose';

export interface IRubric {
    criterion: string;
    weightage: number;
    description: string;
}

export interface ITrack {
    name: string;
    requiredSlides: string[];
    rubrics: IRubric[];
}

export interface IRankingHistoryEntry {
    version: number;
    calculatedAt: Date;
    calculatedBy?: string;
    pitchWeight: number;
    githubWeight: number;
    rankedTeamCount: number;
    incompleteTeamCount: number;
    topTeamName?: string;
    topTeamScore?: number;
    reason?: string;
}

export interface IPublicationAuditEntry {
    action: 'PUBLISH' | 'UNPUBLISH' | 'INVALIDATED' | 'INVALIDATED_SCORE_CHANGE' | 'INVALIDATED_WEIGHT_CHANGE';
    timestamp: Date;
    performedBy: string;
    winnerCount?: number;
    reason?: string;
}

export interface IHackathon extends Document {
    name: string;
    slug: string;
    description: string;
    theme: string;
    customAiPrompt: string;
    isCodeSubmissionOpen: boolean;
    codeSubmissionDeadline?: Date;
    blindJudgingEnabled: boolean;
    tracks: ITrack[];
    isActive: boolean;
    shortlistLimit?: number;
    shortlistingMode?: 'OVERALL' | 'THEME_WISE';
    themeShortlistLimits?: { theme: string; limit: number }[];
    shortlistingStatus?: 'NOT_SHORTLISTED' | 'SHORTLISTED';
    shortlistedAt?: Date;
    shortlistCount?: number;
    pitchWeight?: number;
    githubWeight?: number;
    lastCalculatedPitchWeight?: number;
    lastCalculatedGithubWeight?: number;
    isRankingDirty?: boolean;
    rankingVersion?: number;
    isFinalResultsPublished?: boolean;
    finalResultsPublishedAt?: Date;
    finalResultsPublishedBy?: string;
    finalResultsInvalidatedAt?: Date;
    finalResultsInvalidationReason?: string;
    winnerCount?: number;
    finalRankingRecalculatedAt?: Date;
    rankingHistory?: IRankingHistoryEntry[];
    publicationHistory?: IPublicationAuditEntry[];
    createdAt: Date;
    updatedAt: Date;
}

const HackathonSchema: Schema = new Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    theme: { type: String, default: '' },
    customAiPrompt: { type: String, default: '' },
    isCodeSubmissionOpen: { type: Boolean, default: false },
    codeSubmissionDeadline: { type: Date },
    blindJudgingEnabled: { type: Boolean, default: false },
    tracks: [{
        name: { type: String, required: true },
        requiredSlides: [{ type: String }],
        rubrics: [{
            criterion: { type: String, required: true },
            weightage: { type: Number, required: true },
            description: { type: String }
        }]
    }],
    isActive: { type: Boolean, default: true },
    shortlistLimit: { type: Number, default: 25 },
    shortlistingMode: { type: String, enum: ['OVERALL', 'THEME_WISE'], default: 'OVERALL' },
    themeShortlistLimits: [{
        theme: { type: String },
        limit: { type: Number }
    }],
    shortlistingStatus: { type: String, enum: ['NOT_SHORTLISTED', 'SHORTLISTED'], default: 'NOT_SHORTLISTED' },
    shortlistedAt: { type: Date },
    shortlistCount: { type: Number, default: 0 },
    pitchWeight: { type: Number, default: 40 },
    githubWeight: { type: Number, default: 60 },
    lastCalculatedPitchWeight: { type: Number },
    lastCalculatedGithubWeight: { type: Number },
    isRankingDirty: { type: Boolean, default: false },
    rankingVersion: { type: Number, default: 0 },
    isFinalResultsPublished: { type: Boolean, default: false },
    finalResultsPublishedAt: { type: Date },
    finalResultsPublishedBy: { type: String },
    finalResultsInvalidatedAt: { type: Date },
    finalResultsInvalidationReason: { type: String },
    winnerCount: { type: Number, default: 3 },
    finalRankingRecalculatedAt: { type: Date },
    rankingHistory: [{
        version: { type: Number, required: true },
        calculatedAt: { type: Date, default: Date.now },
        calculatedBy: { type: String },
        pitchWeight: { type: Number, required: true },
        githubWeight: { type: Number, required: true },
        rankedTeamCount: { type: Number, required: true },
        incompleteTeamCount: { type: Number, default: 0 },
        topTeamName: { type: String },
        topTeamScore: { type: Number },
        reason: { type: String }
    }],
    publicationHistory: [{
        action: {
            type: String,
            enum: ['PUBLISH', 'UNPUBLISH', 'INVALIDATED', 'INVALIDATED_SCORE_CHANGE', 'INVALIDATED_WEIGHT_CHANGE'],
            required: true
        },
        timestamp: { type: Date, default: Date.now },
        performedBy: { type: String, required: true },
        winnerCount: { type: Number },
        reason: { type: String }
    }]
}, { timestamps: true });

export default mongoose.models.Hackathon || mongoose.model<IHackathon>('Hackathon', HackathonSchema);
