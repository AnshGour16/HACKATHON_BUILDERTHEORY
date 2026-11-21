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
    isFinalResultsPublished?: boolean;
    finalResultsPublishedAt?: Date;
    finalResultsPublishedBy?: string;
    winnerCount?: number;
    finalRankingRecalculatedAt?: Date;
    rankingHistory?: { calculatedAt: Date; pitchWeight: number; githubWeight: number; topTeamName?: string }[];
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
    isFinalResultsPublished: { type: Boolean, default: false },
    finalResultsPublishedAt: { type: Date },
    finalResultsPublishedBy: { type: String },
    winnerCount: { type: Number, default: 3 },
    finalRankingRecalculatedAt: { type: Date },
    rankingHistory: [{
        calculatedAt: { type: Date, default: Date.now },
        pitchWeight: { type: Number },
        githubWeight: { type: Number },
        topTeamName: { type: String }
    }]
}, { timestamps: true });

export default mongoose.models.Hackathon || mongoose.model<IHackathon>('Hackathon', HackathonSchema);
