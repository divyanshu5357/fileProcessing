'use client';

import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Download,
  ExternalLink,
  Cpu,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { fileManagerService, ProcessingJob } from '@/lib/fileManagerService';
import { Button } from '@/components/ui/Button';

export default function CeleryJobsPage() {
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);

  useEffect(() => {
    setJobs(fileManagerService.getJobs());
    // Auto-update progress for active jobs
    const interval = setInterval(() => {
      setJobs((prev) =>
        prev.map((j) => {
          if (j.jobStatus === 'processing' && j.progress < 100) {
            const nextProgress = Math.min(100, j.progress + 15);
            return {
              ...j,
              progress: nextProgress,
              jobStatus: nextProgress === 100 ? 'completed' : 'processing',
              completedAt: nextProgress === 100 ? new Date().toISOString() : undefined,
              outputS3Key:
                nextProgress === 100
                  ? `users/usr-current/processed/${j.fileId}/output_${j.fileName}`
                  : undefined,
            };
          }
          return j;
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleRetryJob = (jobId: string) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? {
              ...j,
              jobStatus: 'processing',
              progress: 10,
              startedAt: new Date().toISOString(),
              errorMessage: undefined,
            }
          : j
      )
    );
  };

  const getStatusBadge = (status: ProcessingJob['jobStatus']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            <span>Completed</span>
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-800 animate-pulse">
            <Clock className="w-3 h-3" />
            <span>Processing</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono uppercase px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-bold border border-red-300 dark:border-red-800">
            <AlertTriangle className="w-3 h-3" />
            <span>Failed</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono uppercase px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
            <Clock className="w-3 h-3" />
            <span>Queued</span>
          </span>
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Background Jobs & Celery Worker Pipeline
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Decoupled queue architecture powered by Redis broker, Celery worker concurrency, and S3 artifact storage.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-[#CBD5E1] dark:border-[#334155] text-xs font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Worker Concurrency: 4
              </span>
            </div>
          </div>
        </div>

        {/* Architecture flow callout */}
        <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4 shadow-md text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded bg-blue-600 font-bold">1. FastAPI</span>
            <ArrowRight className="w-3 h-3 text-slate-500" />
            <span className="px-2 py-1 rounded bg-red-600 font-bold">2. Redis Broker</span>
            <ArrowRight className="w-3 h-3 text-slate-500" />
            <span className="px-2 py-1 rounded bg-emerald-600 font-bold">3. Celery Worker</span>
            <ArrowRight className="w-3 h-3 text-slate-500" />
            <span className="px-2 py-1 rounded bg-amber-600 font-bold">4. AWS S3</span>
            <ArrowRight className="w-3 h-3 text-slate-500" />
            <span className="px-2 py-1 rounded bg-purple-600 font-bold">5. Neon DB</span>
          </div>
          <span className="text-[11px] text-slate-400 font-sans">
            Zero API thread blocking for heavy conversions.
          </span>
        </div>

        {/* Jobs List */}
        <div className="rounded-2xl border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#111827] overflow-hidden shadow-xs">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {jobs.map((job) => (
              <div key={job.id} className="p-4 sm:p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                          {job.fileName}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          ({job.id})
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        Task: {job.operation}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    {getStatusBadge(job.jobStatus)}

                    {job.jobStatus === 'completed' && job.outputS3Key && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => alert(`Downloading processed S3 artifact: ${job.outputS3Key}`)}
                        className="text-xs font-bold"
                      >
                        <Download className="w-3.5 h-3.5 mr-1" />
                        Download Result
                      </Button>
                    )}

                    {job.jobStatus === 'failed' && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleRetryJob(job.id)}
                        className="text-xs font-bold"
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1" />
                        Retry Task
                      </Button>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                {job.jobStatus === 'processing' && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-amber-600 dark:text-amber-400 font-bold">
                      <span>Worker processing document in isolated subprocess...</span>
                      <span>{job.progress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-300"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* S3 Key Metadata Info */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800/80 text-[11px] font-mono text-slate-500 flex flex-wrap items-center justify-between gap-2">
                  <span className="truncate max-w-md">
                    Input: s3://{job.inputS3Key}
                  </span>
                  <span>
                    Started: {new Date(job.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
