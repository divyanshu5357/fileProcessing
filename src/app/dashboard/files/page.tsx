'use client';

import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  FolderPlus,
  Search,
  Filter,
  Download,
  Trash2,
  Edit2,
  FolderOpen,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  MoreVertical,
  CheckSquare,
  Square,
  ArrowUpDown,
  Archive,
  Eye,
  X,
  Check,
  AlertTriangle,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { fileManagerService, CloudFile, CloudFolder } from '@/lib/fileManagerService';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

export default function CloudFileManagerPage() {
  const { user } = useAuth();
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [folders, setFolders] = useState<CloudFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pdf' | 'image' | 'spreadsheet'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isUploading, setIsUploading] = useState(false);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [previewFile, setPreviewFile] = useState<CloudFile | null>(null);

  // Rename modal
  const [renameFileId, setRenameFileId] = useState<string | null>(null);
  const [renameFileName, setRenameFileName] = useState('');
  const [currentTime, setCurrentTime] = useState<number>(0);

  useEffect(() => {
    setCurrentTime(Date.now());
    loadData();
  }, []);

  const loadData = () => {
    setFiles(fileManagerService.getFiles());
    setFolders(fileManagerService.getFolders());
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    fileManagerService.createFolder(newFolderName.trim(), selectedFolderId);
    setNewFolderName('');
    setIsCreateFolderOpen(false);
    loadData();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsUploading(true);
    try {
      await fileManagerService.uploadFile(file, selectedFolderId, undefined, user?.plan || 'Free');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedFileIds.length === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedFileIds.length} files permanently?`)) {
      fileManagerService.deleteFiles(selectedFileIds);
      setSelectedFileIds([]);
      loadData();
    }
  };

  const handleBulkZipDownload = () => {
    if (selectedFileIds.length === 0) return;
    alert(`Packaging ${selectedFileIds.length} objects into encrypted ZIP archive... Download will start.`);
  };

  const handleDownloadFile = (file: CloudFile) => {
    alert(`Generating verified presigned download URL for '${file.originalName}'. Download started!`);
  };

  const toggleSelectAll = () => {
    if (selectedFileIds.length === filteredFiles.length) {
      setSelectedFileIds([]);
    } else {
      setSelectedFileIds(filteredFiles.map((f) => f.id));
    }
  };

  const toggleSelectFile = (id: string) => {
    setSelectedFileIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Find files expiring in less than 48 hours
  const expiringSoonFiles = currentTime
    ? files.filter((f) => {
        const exp = new Date(f.expiresAt).getTime();
        return exp <= currentTime + 48 * 3600000 && exp > currentTime;
      })
    : [];

  const getExpirationBadge = (expiresAtStr: string) => {
    if (!currentTime) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
          Retained
        </span>
      );
    }
    const exp = new Date(expiresAtStr).getTime();
    const diffHours = (exp - currentTime) / (1000 * 3600);

    if (diffHours <= 0) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
          Expired
        </span>
      );
    }
    if (diffHours <= 24) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 flex items-center gap-1">
          <Clock className="w-3 h-3 animate-pulse" />
          <span>{Math.round(diffHours)}h Left (Urgent)</span>
        </span>
      );
    }
    if (diffHours <= 48) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{Math.round(diffHours / 24)}d Left</span>
        </span>
      );
    }
    const daysLeft = Math.round(diffHours / 24);
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
        {daysLeft}d retention
      </span>
    );
  };

  // Filter & Search
  const filteredFiles = files
    .filter((f) => {
      if (selectedFolderId !== null && f.folderId !== selectedFolderId) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        if (!f.originalName.toLowerCase().includes(q)) return false;
      }
      if (filterType === 'pdf') return f.fileExtension === 'pdf';
      if (filterType === 'image') return ['jpg', 'jpeg', 'png', 'webp'].includes(f.fileExtension);
      if (filterType === 'spreadsheet') return ['xlsx', 'csv', 'xls'].includes(f.fileExtension);
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        const tA = new Date(a.createdAt).getTime();
        const tB = new Date(b.createdAt).getTime();
        return sortOrder === 'desc' ? tB - tA : tA - tB;
      }
      if (sortBy === 'size') {
        return sortOrder === 'desc' ? b.fileSize - a.fileSize : a.fileSize - b.fileSize;
      }
      return sortOrder === 'desc'
        ? b.originalName.localeCompare(a.originalName)
        : a.originalName.localeCompare(b.originalName);
    });

  const getFileIcon = (ext: string) => {
    switch (ext) {
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
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        {/* Header Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Cloud File Manager
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Secure cloud storage with automated plan retention rules and presigned downloads.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCreateFolderOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#111827] text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <FolderPlus className="w-4 h-4 text-amber-500" />
              <span>New Folder</span>
            </button>

            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition">
              <UploadCloud className="w-4 h-4" />
              <span>{isUploading ? 'Uploading...' : 'Upload File'}</span>
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* 48-Hour Data Retention Expiration Warning Banner */}
        {expiringSoonFiles.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-900 dark:text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">⚠️ Automatic Retention Expiration Alert:</p>
                <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                  {expiringSoonFiles.length} file(s) are scheduled for automatic permanent deletion within 48 hours. Download your documents now before they expire.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => alert(`Initiating batch ZIP archive download for ${expiringSoonFiles.length} expiring files...`)}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Expiring Files</span>
            </button>
          </div>
        )}

        {/* Folders Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            type="button"
            onClick={() => setSelectedFolderId(null)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              selectedFolderId === null
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#334155] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Root Workspace</span>
          </button>

          {folders.map((folder) => (
            <button
              key={folder.id}
              type="button"
              onClick={() => setSelectedFolderId(folder.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                selectedFolderId === folder.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#334155] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
              <span>{folder.folderName}</span>
            </button>
          ))}
        </div>

        {/* Search, Filter & Bulk Controls */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#334155] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search files by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2">
              {(['all', 'pdf', 'image', 'spreadsheet'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFilterType(type)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg uppercase tracking-wider transition ${
                    filterType === type
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedFileIds.length > 0 && (
              <div className="flex items-center gap-2 pr-2 border-r border-slate-200 dark:border-slate-800">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleBulkZipDownload}
                  className="text-xs h-8"
                >
                  <Archive className="w-3.5 h-3.5 mr-1 text-blue-500" />
                  <span>ZIP Selected ({selectedFileIds.length})</span>
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={handleDeleteSelected}
                  className="text-xs h-8"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  <span>Delete</span>
                </Button>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                if (sortBy === 'date') setSortBy('name');
                else if (sortBy === 'name') setSortBy('size');
                else setSortBy('date');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              <ArrowUpDown className="w-3 h-3 text-slate-400" />
              <span>Sort: {sortBy}</span>
            </button>
          </div>
        </div>

        {/* Files Table List */}
        <div className="rounded-2xl border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#111827] overflow-hidden shadow-xs">
          {/* Table Header */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B1120] flex items-center justify-between text-xs font-bold text-slate-400">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="p-0.5 text-slate-400 hover:text-slate-600"
              >
                {selectedFileIds.length === filteredFiles.length && filteredFiles.length > 0 ? (
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </button>
              <span>File Details</span>
            </div>
            <div className="flex items-center gap-8 pr-3">
              <span className="hidden sm:inline">Size</span>
              <span className="hidden md:inline">Retention / Expiry</span>
              <span>Actions</span>
            </div>
          </div>

          {filteredFiles.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <FolderOpen className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-medium">No files found. Click &quot;Upload File&quot; to upload to your private cloud storage.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredFiles.map((file) => {
                const isSelected = selectedFileIds.includes(file.id);

                return (
                  <div
                    key={file.id}
                    className={`p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition ${
                      isSelected ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleSelectFile(file.id)}
                        className="p-0.5"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </button>

                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                        {getFileIcon(file.fileExtension)}
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-xs sm:max-w-md">
                          {file.originalName}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          s3://{file.s3Key}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 shrink-0">
                      <span className="text-xs font-mono text-slate-500 hidden sm:inline">
                        {formatBytes(file.fileSize)}
                      </span>

                      <div className="hidden md:inline">
                        {getExpirationBadge(file.expiresAt)}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDownloadFile(file)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Download before expiration"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setPreviewFile(file)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Preview File Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setRenameFileId(file.id);
                            setRenameFileName(file.originalName);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Rename File"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Delete ${file.originalName}?`)) {
                              fileManagerService.deleteFiles([file.id]);
                              loadData();
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Delete File"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal: Create Folder */}
        {isCreateFolderOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <form
              onSubmit={handleCreateFolder}
              className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#334155] p-6 shadow-2xl space-y-4"
            >
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Create New Folder
              </h3>
              <input
                type="text"
                required
                autoFocus
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder Name (e.g. Invoices)"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex items-center justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  type="button"
                  onClick={() => setIsCreateFolderOpen(false)}
                >
                  Cancel
                </Button>
                <Button size="sm" variant="primary" type="submit">
                  Create Folder
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Modal: Rename File */}
        {renameFileId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!renameFileName.trim()) return;
                fileManagerService.renameFile(renameFileId, renameFileName.trim());
                setRenameFileId(null);
                loadData();
              }}
              className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#334155] p-6 shadow-2xl space-y-4"
            >
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Rename File
              </h3>
              <input
                type="text"
                required
                autoFocus
                value={renameFileName}
                onChange={(e) => setRenameFileName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex items-center justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  type="button"
                  onClick={() => setRenameFileId(null)}
                >
                  Cancel
                </Button>
                <Button size="sm" variant="primary" type="submit">
                  Save Name
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Modal: Preview File & Retention Details */}
        {previewFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#334155] p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {previewFile.originalName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewFile(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 rounded-xl bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-center text-center space-y-3">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 shadow-md">
                  {getFileIcon(previewFile.fileExtension)}
                </div>
                <p className="text-xs font-mono text-slate-500">
                  Size: {formatBytes(previewFile.fileSize)} &bull; S3 Key: {previewFile.s3Key}
                </p>
                
                {/* Expiration date details */}
                <div className="w-full p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 text-left space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      Retention Expiration:
                    </span>
                    <span className="font-mono font-bold">{new Date(previewFile.expiresAt).toLocaleString()}</span>
                  </div>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">
                    This file is automatically purged once expired. Download to your computer before this time to keep your copy.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleDownloadFile(previewFile)}
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Download File
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setPreviewFile(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
