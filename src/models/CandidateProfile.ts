import mongoose, { Schema, Document } from 'mongoose';

export interface IExperienceEntry {
    company: string;
    role: string;
    duration: string;
    description: string;
}

export interface IEducationEntry {
    degree: string;
    institution: string;
    year: string;
}

export interface ICandidateProfile extends Document {
    user: mongoose.Types.ObjectId;
    headline?: string;
    phone?: string;
    location?: string;
    bio?: string;
    resumeUrl?: string;
    resumeFileName?: string;
    resumeText?: string;
    parsedSkills: string[];
    experience: IExperienceEntry[];
    education: IEducationEntry[];
    githubUrl?: string;
    portfolioUrl?: string;
    linkedinUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

const CandidateProfileSchema: Schema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    headline: { type: String },
    phone: { type: String },
    location: { type: String },
    bio: { type: String },
    resumeUrl: { type: String },
    resumeFileName: { type: String },
    resumeText: { type: String },
    parsedSkills: [{ type: String }],
    experience: [{
        company: { type: String },
        role: { type: String },
        duration: { type: String },
        description: { type: String }
    }],
    education: [{
        degree: { type: String },
        institution: { type: String },
        year: { type: String }
    }],
    githubUrl: { type: String },
    portfolioUrl: { type: String },
    linkedinUrl: { type: String }
}, { timestamps: true });

export default mongoose.models.CandidateProfile || mongoose.model<ICandidateProfile>('CandidateProfile', CandidateProfileSchema);
