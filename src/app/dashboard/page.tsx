'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  UploadCloud,
  FolderPlus,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  HardDrive,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Cpu,
  Layers,
  Search,
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { fileManagerService, CloudFile, ProcessingJob } from '@/lib/fileManagerService';
import { Button } from '@/components/ui/Button';

export default function DashboardOverview() {
  const { user, storageUsage } = useAuth();
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    setFiles(fileManagerService.getFiles());
    setJobs(fileManagerService.getJobs());
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsUploading(true);
    setUploadProgress(10);
    try {
      const uploaded = await fileManagerService.uploadFile(file, null, (p) => {
        setUploadProgress(p);
      });
      setFiles(fileManagerService.getFiles());
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  const activeJobs = jobs.filter((j) => j.jobStatus === 'processing' || j.jobStatus === 'queued');
  const completedJobs = jobs.filter((j) => j.jobStatus === 'completed');

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (ext: string) => {
    switch (ext.toLowerCase()) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'xlsx':
      case 'csv':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
      default:
        return <ImageIcon className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 text-white shadow-xl">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-4 border border-white/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Multi-Tenant Scalable SaaS Infrastructure</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name || 'Architect'}
            </h1>
            <p className="mt-2 text-sm text-blue-100 leading-relaxed">
              Your files are securely backed by private AWS S3 buckets and Neon PostgreSQL serverless pooling. Heavy document conversions and OCR are dispatched asynchronously to Celery Redis workers.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-blue-600 font-bold text-xs shadow-md hover:bg-blue-50 transition">
                <UploadCloud className="w-4 h-4" />
                <span>Upload to S3</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>

              <Link
                href="/tools/pdf-editor"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-bold text-xs transition"
              >
                <Layers className="w-4 h-4" />
                <span>Open PDF Editor</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Upload Progress Bar if active */}
        {isUploading && (
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-200">
            <div className="flex items-center justify-between font-bold mb-2">
              <span className="flex items-center gap-2">
                <UploadCloud className="w-4 h-4 animate-bounce text-blue-600" />
                Direct S3 Multipart Uploading...
              </span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-blue-200 dark:bg-blue-900 overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Storage */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#334155] shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold">S3 Storage Used</span>
              <HardDrive className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              {formatBytes(storageUsage.usedBytes)}
            </div>
            <div className="mt-2 text-[11px] text-slate-500 font-mono">
              Quota: {formatBytes(storageUsage.limitBytes)} ({user?.plan || 'Free'})
            </div>
          </div>

          {/* Card 2: Total Files */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#334155] shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold">Total Cloud Files</span>
              <FileText className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              {files.length}
            </div>
            <div className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>All indexed in Neon Postgres</span>
            </div>
          </div>

          {/* Card 3: Active Jobs */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#334155] shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold">Active Celery Tasks</span>
              <Cpu className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              {activeJobs.length}
            </div>
            <div className="mt-2 text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
              <Clock className="w-3 h-3 animate-spin" />
              <span>Redis Queue Broker</span>
            </div>
          </div>

          {/* Card 4: Monthly Conversions */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#334155] shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold">Completed Jobs</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              {completedJobs.length}
            </div>
            <div className="mt-2 text-[11px] text-slate-500 font-mono">
              100% Success Rate
            </div>
          </div>
        </div>

        {/* Two Column Layout: Recent Files & Celery Queue */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Files Table (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Recent Cloud Files
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Stored in private AWS S3 bucket with short-lived presigned URLs.
                </p>
              </div>

              <Link
                href="/dashboard/files"
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="rounded-2xl border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#111827] overflow-hidden shadow-xs">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {files.slice(0, 5).map((file) => (
                  <div
                    key={file.id}
                    className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                        {getFileIcon(file.fileExtension)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {file.originalName}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                          {formatBytes(file.fileSize)} &bull; {new Date(file.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold uppercase">
                        {file.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Celery Background Pipeline (1 Col) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Processing Queue
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Redis broker & Celery workers.
                </p>
              </div>

              <Link
                href="/dashboard/jobs"
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="rounded-2xl border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#111827] p-4 shadow-xs space-y-3">
              {jobs.slice(0, 4).map((job) => (
                <div
                  key={job.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                      {job.fileName}
                    </span>
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold ${
                        job.jobStatus === 'completed'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : job.jobStatus === 'processing'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 animate-pulse'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {job.jobStatus}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {job.operation}
                  </p>

                  {job.jobStatus === 'processing' && (
                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-300"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
