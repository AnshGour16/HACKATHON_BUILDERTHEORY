import mongoose, { Schema, Document } from 'mongoose';

export interface IJobRubric {
    criterion: string;
    weightage: number;
    description: string;
}

export type JobDepartment =
    | 'Software & IT'
    | 'Sales & Business Development'
    | 'Marketing & Digital Media'
    | 'Finance & Accounting'
    | 'Human Resources'
    | 'Operations & Logistics'
    | 'Customer Support'
    | 'Design & Creative';

export type JobEvaluationType =
    | 'TECHNICAL_GITHUB'
    | 'NON_TECHNICAL_ASSIGNMENT'
    | 'RESUME_ONLY';

export interface IJob extends Document {
    title: string;
    companyName: string;
    companyLogo?: string;
    department: JobDepartment;
    location: string;
    jobType: 'Full-time' | 'Part-time' | 'Contract' | 'Remote' | 'Hybrid';
    experienceLevel: 'Entry-level' | 'Mid-level' | 'Senior' | 'Lead' | 'Director';
    salaryRange?: string;
    description: string;
    responsibilities?: string[];
    requiredSkills: string[];
    niceToHaveSkills?: string[];
    evaluationType: JobEvaluationType;
    assignmentPrompt?: string; // Case study / assignment for non-tech roles
    rubricCriteria: IJobRubric[];
    recruiter: mongoose.Types.ObjectId;
    status: 'OPEN' | 'PAUSED' | 'CLOSED';
    candidateCount?: number;
    createdAt: Date;
    updatedAt: Date;
}

const JobSchema: Schema = new Schema({
    title: { type: String, required: true },
    companyName: { type: String, required: true },
    companyLogo: { type: String },
    department: {
        type: String,
        required: true,
        enum: [
            'Software & IT',
            'Sales & Business Development',
            'Marketing & Digital Media',
            'Finance & Accounting',
            'Human Resources',
            'Operations & Logistics',
            'Customer Support',
            'Design & Creative'
        ],
        default: 'Software & IT'
    },
    location: { type: String, default: 'Remote' },
    jobType: {
        type: String,
        enum: ['Full-time', 'Part-time', 'Contract', 'Remote', 'Hybrid'],
        default: 'Full-time'
    },
    experienceLevel: {
        type: String,
        enum: ['Entry-level', 'Mid-level', 'Senior', 'Lead', 'Director'],
        default: 'Mid-level'
    },
    salaryRange: { type: String },
    description: { type: String, required: true },
    responsibilities: [{ type: String }],
    requiredSkills: [{ type: String, required: true }],
    niceToHaveSkills: [{ type: String }],
    evaluationType: {
        type: String,
        enum: ['TECHNICAL_GITHUB', 'NON_TECHNICAL_ASSIGNMENT', 'RESUME_ONLY'],
        default: 'TECHNICAL_GITHUB'
    },
    assignmentPrompt: { type: String },
    rubricCriteria: [{
        criterion: { type: String, required: true },
        weightage: { type: Number, required: true },
        description: { type: String }
    }],
    recruiter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
        type: String,
        enum: ['OPEN', 'PAUSED', 'CLOSED'],
        default: 'OPEN'
    },
    candidateCount: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.models.Job || mongoose.model<IJob>('Job', JobSchema);
