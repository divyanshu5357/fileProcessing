'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  UploadCloud,
  Sparkles,
  FileText,
  FileSpreadsheet,
  Presentation,
  Image as ImageIcon,
  ScanLine,
  LayoutGrid,
  PenTool,
  Minimize2,
  Maximize2,
  Crop,
  Layers,
  Lock,
  Unlock,
  Stamp,
  Hash,
  Scissors,
  RotateCw,
  Trash2,
  ArrowRight,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  ShieldCheck,
  Download,
  ExternalLink,
  HardDrive,
  CreditCard,
  User,
  Star,
  RefreshCw,
  AlertCircle,
  FileCheck,
  Eye,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  CENTRAL_TOOL_REGISTRY,
  CentralToolItem,
  ToolCategory,
  getToolsForFileExtension,
  getFileCategory,
} from '@/lib/toolRegistry';
import { activityService, UserActivityItem } from '@/lib/activityService';
import { fileTransferService } from '@/lib/fileTransferService';
import { fileManagerService } from '@/lib/fileManagerService';
import { formatBytes, downloadBlob } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UserMenu } from '@/components/auth/UserMenu';
import { ExportPreviewModal } from '@/components/common/ExportPreviewModal';
import { GyanvatsalaLogo } from '@/components/common/GyanvatsalaLogo';
import { pdfToDocx, compressPdfDocument } from '@/lib/pdfEngine';
import { compressImage } from '@/lib/imageProcessing';

export default function AuthenticatedWorkspace() {
  const router = useRouter();
  const { user, storageUsage } = useAuth();

  // Active uploaded file in workspace
  const [activeFile, setActiveFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // In-place processing states
  const [isProcessingInPlace, setIsProcessingInPlace] = useState(false);
  const [processingStatusText, setProcessingStatusText] = useState('');
  const [exportPreviewBlob, setExportPreviewBlob] = useState<Blob | null>(null);
  const [exportPreviewFilename, setExportPreviewFilename] = useState('');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Tool discovery state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | 'all'>('all');
  const [toolViewFilter, setToolViewFilter] = useState<'all' | 'popular' | 'favorites'>('all');
  const [favoriteToolIds, setFavoriteToolIds] = useState<string[]>([
    'pdf-editor',
    'pdf-to-word',
    'compress-image',
    'scan-studio',
  ]);

  // Activity timeline state
  const [activities, setActivities] = useState<UserActivityItem[]>([]);
  const [activitySearch, setActivitySearch] = useState('');
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>('all');

  // Load activities on mount
  useEffect(() => {
    setActivities(activityService.getActivities());
  }, []);

  // Cleanup object preview URL
  useEffect(() => {
    return () => {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    };
  }, [filePreviewUrl]);

  // Handle file selection
  const handleFileSelect = (selectedFile: File) => {
    setUploadError(null);
    setIsUploading(true);
    setUploadProgress(15);

    // Simulate swift validation and upload
    const timer = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(timer);
          return 100;
        }
        return prev + 25;
      });
    }, 80);

    setTimeout(() => {
      setIsUploading(false);
      setUploadProgress(0);
      setActiveFile(selectedFile);

      // Create preview if image
      if (selectedFile.type.startsWith('image/')) {
        setFilePreviewUrl(URL.createObjectURL(selectedFile));
      } else {
        setFilePreviewUrl(null);
      }

      // Log upload activity
      const ext = selectedFile.name.split('.').pop() || '';
      activityService.logActivity({
        fileName: selectedFile.name,
        fileType: getFileCategory(ext),
        fileSize: selectedFile.size,
        operation: 'File Uploaded',
        status: 'Uploaded',
      });
      setActivities(activityService.getActivities());
    }, 400);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Launch a dedicated tool with the active file
  const handleLaunchTool = (tool: CentralToolItem) => {
    if (activeFile) {
      fileTransferService.setPendingFile(activeFile, tool.id);
    }
    router.push(tool.route);
  };

  // Save active file to cloud storage
  const handleSaveToCloud = async () => {
    if (!activeFile) return;
    try {
      await fileManagerService.uploadFile(
        activeFile,
        null,
        undefined,
        user?.plan || 'Free'
      );
      activityService.logActivity({
        fileName: activeFile.name,
        fileType: getFileCategory(activeFile.name.split('.').pop() || ''),
        fileSize: activeFile.size,
        operation: 'Saved to Cloud Storage',
        status: 'Completed',
      });
      setActivities(activityService.getActivities());
      alert(`"${activeFile.name}" has been saved to your cloud files!`);
    } catch (err: any) {
      alert(err.message || 'Failed to save to cloud');
    }
  };

  // Fast In-Place Processing
  const handleQuickProcess = async (toolId: string) => {
    if (!activeFile) return;
    setIsProcessingInPlace(true);

    try {
      const buffer = await activeFile.arrayBuffer();

      if (toolId === 'pdf-to-word') {
        setProcessingStatusText('Converting PDF document into editable Word DOCX...');
        const docxRes = await pdfToDocx(
          activeFile,
          { format: 'docx', extractImages: true, ocrFallback: true },
          (p: number) => {
            setProcessingStatusText(`Converting text and tables... ${Math.round(p)}%`);
          }
        );

        const baseName = activeFile.name.replace(/\.[^/.]+$/, '');
        const outName = `${baseName}.docx`;

        activityService.logActivity({
          fileName: activeFile.name,
          fileType: 'pdf',
          fileSize: activeFile.size,
          operation: 'PDF to Word (DOCX)',
          status: 'Completed',
          resultFileName: outName,
          resultSize: docxRes.blob.size,
        });
        setActivities(activityService.getActivities());

        setExportPreviewBlob(docxRes.blob);
        setExportPreviewFilename(outName);
        setIsExportModalOpen(true);
      } else if (toolId === 'compress-pdf') {
        setProcessingStatusText('Compressing PDF stream objects and embedded media...');
        const compRes = await compressPdfDocument(activeFile, { compressionLevel: 'recommended' });

        const baseName = activeFile.name.replace(/\.[^/.]+$/, '');
        const outName = `${baseName}_compressed.pdf`;

        activityService.logActivity({
          fileName: activeFile.name,
          fileType: 'pdf',
          fileSize: activeFile.size,
          operation: 'Compress PDF',
          status: 'Completed',
          resultFileName: outName,
          resultSize: compRes.blob.size,
        });
        setActivities(activityService.getActivities());

        setExportPreviewBlob(compRes.blob);
        setExportPreviewFilename(outName);
        setIsExportModalOpen(true);
      } else if (toolId === 'compress-image') {
        setProcessingStatusText('Optimizing image quality and stripping metadata...');
        const compRes = await compressImage(activeFile, {
          quality: 80,
          format: 'image/jpeg',
          targetSizeKb: 0,
          maxDimension: 0,
        });

        const baseName = activeFile.name.replace(/\.[^/.]+$/, '');
        const outName = `${baseName}_compressed.jpg`;

        activityService.logActivity({
          fileName: activeFile.name,
          fileType: 'image',
          fileSize: activeFile.size,
          operation: 'Compress Image',
          status: 'Completed',
          resultFileName: outName,
          resultSize: compRes.blob ? compRes.blob.size : 0,
        });
        setActivities(activityService.getActivities());

        if (compRes.blob) {
          setExportPreviewBlob(compRes.blob);
          setExportPreviewFilename(outName);
          setIsExportModalOpen(true);
        }
      } else {
        // Fallback: launch the dedicated tool
        const tool = CENTRAL_TOOL_REGISTRY.find((t) => t.id === toolId);
        if (tool) handleLaunchTool(tool);
      }
    } catch (err: any) {
      console.error('In-place processing error:', err);
      alert('Processing failed: ' + err.message);
    } finally {
      setIsProcessingInPlace(false);
      setProcessingStatusText('');
    }
  };

  // Toggle favorite tools
  const toggleFavorite = (toolId: string) => {
    setFavoriteToolIds((prev) =>
      prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId]
    );
  };

  // Filter tools for Explore section
  const filteredTools = CENTRAL_TOOL_REGISTRY.filter((tool) => {
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || tool.category === selectedCategory;

    const matchesView =
      toolViewFilter === 'all' ||
      (toolViewFilter === 'popular' && tool.popular) ||
      (toolViewFilter === 'favorites' && favoriteToolIds.includes(tool.id));

    return matchesSearch && matchesCategory && matchesView;
  });

  // Compatible tools for currently uploaded file
  const compatibleTools = activeFile
    ? getToolsForFileExtension(activeFile.name.split('.').pop() || '')
    : [];

  const fileExt = activeFile?.name.split('.').pop()?.toLowerCase() || '';
  const detectedCategory = getFileCategory(fileExt);

  // Filter activities
  const filteredActivities = activities.filter((act) => {
    const matchesSearch =
      act.fileName.toLowerCase().includes(activitySearch.toLowerCase()) ||
      act.operation.toLowerCase().includes(activitySearch.toLowerCase());
    const matchesType =
      activityTypeFilter === 'all' || act.fileType === activityTypeFilter;
    return matchesSearch && matchesType;
  });

  // Calculate percent storage
  const storageLimit = storageUsage.limitBytes || 15728640;
  const storagePercent = Math.min(
    100,
    Math.round((storageUsage.usedBytes / storageLimit) * 100)
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B1120] text-[#0F172A] dark:text-[#F8FAFC] selection:bg-[#2563EB] selection:text-white transition-colors">
      {/* ======================================================== */}
      {/* 1. CLEAN TOP NAVIGATION BAR                              */}
      {/* ======================================================== */}
      <header className="w-full bg-white dark:bg-[#111827] border-b border-[#CBD5E1] dark:border-[#334155] sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <GyanvatsalaLogo size={32} showWordmark={true} />
          </Link>

          {/* Primary Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300">
            <Link
              href="/workspace"
              className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-extrabold"
            >
              Workspace
            </Link>
            <a
              href="#tools"
              className="px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition"
            >
              All Tools
            </a>
            <a
              href="#activity"
              className="px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition"
            >
              Recent Activity
            </a>
            <Link
              href="/dashboard/files"
              className="px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition"
            >
              My Files
            </Link>
            <Link
              href="/pricing"
              className="px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition text-amber-600 dark:text-amber-400"
            >
              Pricing
            </Link>
          </nav>

          {/* Right: Theme Toggle & User Menu */}
          <div className="flex items-center gap-2.5 shrink-0">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 space-y-10">
        {/* ======================================================== */}
        {/* A. WELCOME HEADER (NO INFRASTRUCTURE JARGON)             */}
        {/* ======================================================== */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-linear-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-xl">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold mb-3 border border-white/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Document & Media Productivity Workspace</span>
            </div>
            <div className="flex items-center gap-3.5">
              {user?.avatarUrl && !avatarError ? (
                <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-full overflow-hidden border-2 border-white/50 shadow-md shrink-0 bg-white/20">
                  <img
                    src={user.avatarUrl}
                    alt={user.name || 'User'}
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    onError={() => setAvatarError(true)}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : user ? (
                <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-full overflow-hidden border-2 border-white/50 shadow-md shrink-0 bg-white/20 flex items-center justify-center font-bold text-lg text-white">
                  {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                </div>
              ) : null}
              <div>
                <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
                  Welcome back, {user?.name || 'Creator'}
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-blue-100 font-medium">
                  {user?.email ? `Signed in as ${user.email} • What would you like to do today?` : 'What would you like to do today? Upload a file or choose an action below.'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shrink-0">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-white text-blue-700 font-bold">
                  {user?.plan || 'Free'} Plan
                </span>
                <span className="text-xs text-blue-100 font-mono">
                  {formatBytes(storageUsage.usedBytes)} of {formatBytes(storageLimit)}
                </span>
              </div>
              <div className="w-40 h-1.5 bg-white/20 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${storagePercent}%` }}
                />
              </div>
            </div>

            <Link
              href="/pricing"
              className="px-3.5 py-1.5 rounded-xl bg-white text-blue-700 font-extrabold text-xs shadow-md hover:bg-blue-50 transition shrink-0"
            >
              Upgrade
            </Link>
          </div>
        </div>

        {/* ======================================================== */}
        {/* B. MAIN UPLOAD AREA & INSTANT FILE TYPE DETECTION        */}
        {/* ======================================================== */}
        {!activeFile ? (
          <div className="flex flex-col items-center">
            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-10 sm:p-14 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 bg-white dark:bg-slate-900 rounded-3xl flex flex-col items-center justify-center text-center shadow-md transition-all cursor-pointer group"
            >
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-xs">
                <UploadCloud className="w-8 h-8" />
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                Drop your file here, or browse files
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">
                Upload any PDF, Image, Word document, Excel spreadsheet, or presentation to begin editing, converting, or transforming.
              </p>

              {/* Supported Formats Pills */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5 max-w-xl">
                {['PDF', 'JPG', 'PNG', 'WebP', 'DOCX', 'XLSX', 'PPTX', 'TXT'].map((ext) => (
                  <span
                    key={ext}
                    className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  >
                    {ext}
                  </span>
                ))}
              </div>

              <div className="mt-4 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Zero Server Uploads • Files are processed privately in your browser</span>
              </div>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* 3. ACTIVE FILE PROCESSING & ACTION WORKSPACE             */
          /* ======================================================== */
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* File Info Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800 shadow-xs">
                  {detectedCategory === 'pdf' ? (
                    <FileText className="w-7 h-7 text-red-500" />
                  ) : detectedCategory === 'image' ? (
                    <ImageIcon className="w-7 h-7 text-blue-500" />
                  ) : detectedCategory === 'word' ? (
                    <FileText className="w-7 h-7 text-blue-600" />
                  ) : detectedCategory === 'excel' ? (
                    <FileSpreadsheet className="w-7 h-7 text-emerald-500" />
                  ) : detectedCategory === 'powerpoint' ? (
                    <Presentation className="w-7 h-7 text-orange-500" />
                  ) : (
                    <FileCheck className="w-7 h-7 text-purple-500" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 truncate max-w-md">
                      {activeFile.name}
                    </h2>
                    <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                      {detectedCategory}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 font-mono">
                    {formatBytes(activeFile.size)} • {compatibleTools.length} Recommended Actions Available
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSaveToCloud}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                >
                  <HardDrive className="w-3.5 h-3.5 text-blue-500" />
                  <span>Save to Cloud</span>
                </button>

                <button
                  type="button"
                  onClick={() => downloadBlob(activeFile, activeFile.name)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Download</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveFile(null);
                    setFilePreviewUrl(null);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear File</span>
                </button>
              </div>
            </div>

            {/* In-Place Processing Status */}
            {isProcessingInPlace && (
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
                <span className="text-xs font-bold text-blue-900 dark:text-blue-100">
                  {processingStatusText || 'Processing document...'}
                </span>
              </div>
            )}

            {/* Contextual Action Grid for this File */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Recommended Actions for this {detectedCategory.toUpperCase()}
                </h3>
                <span className="text-[11px] text-blue-600 font-semibold">
                  Click any action to begin processing
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {compatibleTools.map((tool) => {
                  const isQuickAction =
                    tool.id === 'pdf-to-word' ||
                    tool.id === 'compress-pdf' ||
                    tool.id === 'compress-image';

                  return (
                    <div
                      key={tool.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-400 bg-slate-50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 transition flex flex-col justify-between group shadow-2xs"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                            {tool.name}
                          </span>
                          {tool.badge && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold">
                              {tool.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {tool.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        {isQuickAction ? (
                          <button
                            type="button"
                            onClick={() => handleQuickProcess(tool.id)}
                            className="text-xs font-extrabold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>Convert Now</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleLaunchTool(tool)}
                            className="text-xs font-extrabold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>Open Tool</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <span className="text-[10px] font-mono text-slate-400">
                          → {tool.supportedOutputs.join(', ')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 4. EXPLORE ALL TOOLS SECTION WITH SEARCH & CATEGORIES    */}
        {/* ======================================================== */}
        <section id="tools" className="space-y-4 pt-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Explore All Document & Media Tools
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Browse our complete suite of browser-native file converters, compressors, and document editors.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tools (e.g. Word, Excel, Scan...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'all', label: 'All Tools' },
              { id: 'pdf', label: 'PDF Tools' },
              { id: 'image', label: 'Image Tools' },
              { id: 'document', label: 'Document Tools' },
              { id: 'scan', label: 'Scan Studio' },
              { id: 'conversion', label: 'Conversion Tools' },
              { id: 'compression', label: 'Compression Tools' },
              { id: 'editing', label: 'Editing Tools' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTools.map((tool) => {
              const isFav = favoriteToolIds.includes(tool.id);

              return (
                <div
                  key={tool.id}
                  onClick={() => handleLaunchTool(tool)}
                  className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-400 shadow-sm hover:shadow-md transition flex flex-col justify-between group cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {tool.categoryLabel}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(tool.id);
                        }}
                        className={`p-1 rounded-md cursor-pointer ${
                          isFav
                            ? 'text-amber-500'
                            : 'text-slate-300 hover:text-amber-400'
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-500' : ''}`} />
                      </button>
                    </div>

                    <h3 className="font-black text-base text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                      {tool.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {tool.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-blue-600">
                    <span className="text-[11px] font-mono text-slate-400">
                      {tool.supportedInputs[0]} → {tool.supportedOutputs[0]}
                    </span>
                    <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Open <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ======================================================== */}
        {/* 5. RECENT FILES & ACTIVITY TIMELINE                      */}
        {/* ======================================================== */}
        <section id="activity" className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Recent Processing Activity
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Chronological history of your file conversions and edits.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search history..."
                value={activitySearch}
                onChange={(e) => setActivitySearch(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
              />
              <select
                value={activityTypeFilter}
                onChange={(e) => setActivityTypeFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="pdf">PDFs</option>
                <option value="image">Images</option>
                <option value="word">Word Docs</option>
              </select>
            </div>
          </div>

          {/* Activity Cards List */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {filteredActivities.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-semibold">No recent activity matching your filters</p>
              </div>
            ) : (
              filteredActivities.map((act) => {
                const dateObj = new Date(act.timestamp);
                const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });

                return (
                  <div
                    key={act.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        {act.fileType === 'pdf' ? (
                          <FileText className="w-5 h-5 text-red-500" />
                        ) : act.fileType === 'image' ? (
                          <ImageIcon className="w-5 h-5 text-blue-500" />
                        ) : act.fileType === 'word' ? (
                          <FileText className="w-5 h-5 text-blue-600" />
                        ) : (
                          <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                            {act.fileName}
                          </span>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                              act.status === 'Completed'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
                            }`}
                          >
                            {act.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {act.operation} • <span className="font-mono">{formatBytes(act.fileSize)}</span> • {dateStr} at {timeStr}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      {act.resultFileName && (
                        <button
                          type="button"
                          onClick={() => {
                            alert(`Result "${act.resultFileName}" is ready for download.`);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-950 text-blue-600 hover:bg-blue-100 transition cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Result</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          activityService.deleteActivity(act.id);
                          setActivities(activityService.getActivities());
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>

      {/* Pre-Download Export Modal */}
      <ExportPreviewModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        blob={exportPreviewBlob}
        defaultFilename={exportPreviewFilename}
        title="Conversion Ready"
        fileType={
          exportPreviewFilename.endsWith('.docx')
            ? 'generic'
            : exportPreviewFilename.endsWith('.jpg') || exportPreviewFilename.endsWith('.png')
            ? 'image'
            : 'pdf'
        }
      />
    </div>
  );
}
