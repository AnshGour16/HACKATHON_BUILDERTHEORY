'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { UploadCloud, FileText, CheckCircle2, Trophy, Target, Bot } from 'lucide-react';
import { useState, useEffect, DragEvent } from 'react';

interface IEvaluationResult {
    submissionId: string;
    totalScore: number;
    summary: string;
    strengths?: string[];
    weaknesses?: string[];
}

interface IHackathonOption {
    _id: string;
    name: string;
    slug: string;
    theme: string;
    description: string;
    customAiPrompt: string;
    tracks: {
        name: string;
        requiredSlides: string[];
        rubrics: { criterion: string; weightage: number; description: string }[];
    }[];
}

export default function DocumentUpload() {
    const [file, setFile] = useState<File | null>(null);
    const [teamName, setTeamName] = useState('');
    const [hackathons, setHackathons] = useState<IHackathonOption[]>([]);
    const [selectedHackathonId, setSelectedHackathonId] = useState('');
    const [track, setTrack] = useState('');
    const [availableTracks, setAvailableTracks] = useState<{ name: string }[]>([]);
    const [problemStatement, setProblemStatement] = useState('');
    const [memberCount, setMemberCount] = useState<number | ''>(1);
    const [members, setMembers] = useState<{ name: string; department: string; rollNo: string }[]>([
        { name: '', department: '', rollNo: '' }
    ]);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [result, setResult] = useState<IEvaluationResult | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setErrorMessage(null);
        }
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFile = e.dataTransfer.files[0];
            const lower = droppedFile.name.toLowerCase();
            const isValid = lower.endsWith('.pdf') || lower.endsWith('.pptx') || lower.endsWith('.ppt') ||
                droppedFile.type === 'application/pdf' ||
                droppedFile.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
                droppedFile.type === 'application/vnd.ms-powerpoint';

            if (isValid) {
                setFile(droppedFile);
                setErrorMessage(null);
            } else {
                setErrorMessage('Please drop a valid presentation file: PDF (.pdf), PowerPoint (.pptx), or legacy PowerPoint (.ppt).');
            }
        }
    };

    useEffect(() => {
        fetch('/api/hackathons')
            .then((res) => res.json())
            .then((data) => {
                if (data.success && Array.isArray(data.data) && data.data.length > 0) {
                    setHackathons(data.data);
                    const first = data.data[0];
                    setSelectedHackathonId(first._id);
                    if (first.tracks && first.tracks.length > 0) {
                        setAvailableTracks(first.tracks);
                    }
                }
            })
            .catch((err) => {
                console.error('Failed to load hackathons:', err);
            });
    }, []);

    const handleHackathonChange = (hId: string) => {
        setSelectedHackathonId(hId);
        const found = hackathons.find((h) => h._id === hId);
        if (found && found.tracks && found.tracks.length > 0) {
            setAvailableTracks(found.tracks);
            setTrack(found.tracks[0].name);
        } else {
            setAvailableTracks([]);
            setTrack('General');
        }
    };

    return (
        <Card className="w-full max-w-xl mx-auto border border-slate-200/80 bg-white shadow-xs rounded-3xl p-6 text-slate-900">
            <CardHeader className="text-center p-0 pb-4">
                <CardTitle className="text-2xl font-black text-slate-900">Submit Project Pitch</CardTitle>
                <CardDescription className="text-xs text-slate-500">Upload your deck or document for AI evaluation</CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${isDragging ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50'}`}
                >
                    <UploadCloud className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-800">Drag &amp; drop your deck here, or click to browse</p>
                    <p className="text-xs text-slate-400 mt-1">PDF or PPTX up to 25MB</p>
                    <input type="file" onChange={handleFileChange} className="hidden" id="file-upload-input" />
                    <label htmlFor="file-upload-input" className="inline-block mt-3 px-4 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-xs cursor-pointer hover:bg-slate-50">
                        Select File
                    </label>
                </div>
                {file && (
                    <div className="flex items-center gap-2 p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl text-xs text-indigo-900 font-medium">
                        <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span className="truncate flex-1">{file.name}</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    </div>
                )}
                {errorMessage && (
                    <p className="text-xs text-rose-600 font-medium">{errorMessage}</p>
                )}
            </CardContent>
        </Card>
    );
}
