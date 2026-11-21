import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    passwordHash?: string;
    role: 'ADMIN' | 'JUDGE' | 'RECRUITER' | 'PARTICIPANT' | 'CANDIDATE';
    phone?: string;
    college?: string;
    companyName?: string;
    title?: string;
    avatarUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String },
    role: {
        type: String,
        enum: ['ADMIN', 'JUDGE', 'RECRUITER', 'PARTICIPANT', 'CANDIDATE'],
        default: 'CANDIDATE'
    },
    phone: { type: String },
    college: { type: String },
    companyName: { type: String },
    title: { type: String },
    avatarUrl: { type: String },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
