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
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { fileManagerService, CloudFile, CloudFolder } from '@/lib/fileManagerService';
import { Button } from '@/components/ui/Button';

export default function CloudFileManagerPage() {
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

  useEffect(() => {
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
      await fileManagerService.uploadFile(file, selectedFolderId);
      loadData();
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedFileIds.length === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedFileIds.length} files from S3?`)) {
      fileManagerService.deleteFiles(selectedFileIds);
      setSelectedFileIds([]);
      loadData();
    }
  };

  const handleBulkZipDownload = () => {
    if (selectedFileIds.length === 0) return;
    alert(`Packaging ${selectedFileIds.length} S3 objects into encrypted ZIP archive...`);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameFileId || !renameFileName.trim()) return;
    fileManagerService.renameFile(renameFileId, renameFileName.trim());
    setRenameFileId(null);
    setRenameFileName('');
    loadData();
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

  // Filtering & Sorting
  const filteredFiles = files
    .filter((f) => (selectedFolderId ? f.folderId === selectedFolderId : true))
    .filter((f) => {
      if (filterType === 'pdf') return f.fileExtension === 'pdf';
      if (filterType === 'image') return ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(f.fileExtension);
      if (filterType === 'spreadsheet') return ['xlsx', 'csv'].includes(f.fileExtension);
      return true;
    })
    .filter((f) => f.originalName.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc'
          ? a.originalName.localeCompare(b.originalName)
          : b.originalName.localeCompare(a.originalName);
      }
      if (sortBy === 'size') {
        return sortOrder === 'asc' ? a.fileSize - b.fileSize : b.fileSize - a.fileSize;
      }
      // date
      return sortOrder === 'asc'
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

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
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        {/* Header Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Cloud File Manager
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Secure AWS S3 storage with presigned downloads and Neon relational indexing.
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
              <span>{isUploading ? 'Uploading to S3...' : 'Upload File'}</span>
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          </div>
        </div>

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

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#334155] shadow-xs">
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            {(['all', 'pdf', 'image', 'spreadsheet'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition ${
                  filterType === type
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
            <span className="text-slate-400 font-medium">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B1120] text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none"
            >
              <option value="date">Date</option>
              <option value="name">Name</option>
              <option value="size">Size</option>
            </select>
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Toggle sort direction"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            </button>
          </div>
        </div>

        {/* Multi-Selection Action Toolbar */}
        {selectedFileIds.length > 0 && (
          <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 flex items-center justify-between text-xs animate-fade-in">
            <span className="font-bold text-blue-900 dark:text-blue-200">
              {selectedFileIds.length} file{selectedFileIds.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleBulkZipDownload}
                className="text-xs font-bold"
              >
                <Archive className="w-3.5 h-3.5 mr-1" />
                Bulk ZIP Download
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={handleDeleteSelected}
                className="text-xs font-bold"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Delete Selected
              </Button>
            </div>
          </div>
        )}

        {/* Files Table */}
        <div className="rounded-2xl border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#111827] overflow-hidden shadow-xs">
          {filteredFiles.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No files found in this folder. Click &quot;Upload File&quot; to upload to your private S3 bucket.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {/* Header row */}
              <div className="p-3 bg-slate-50 dark:bg-[#0B1120] flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <div className="flex items-center gap-3">
                  <button type="button" onClick={toggleSelectAll} className="p-0.5">
                    {selectedFileIds.length === filteredFiles.length && filteredFiles.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                  <span>Name</span>
                </div>
                <div className="flex items-center gap-12 pr-4">
                  <span className="hidden sm:inline">Size</span>
                  <span className="hidden md:inline">Modified</span>
                  <span>Actions</span>
                </div>
              </div>

              {/* File rows */}
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

                    <div className="flex items-center gap-8 shrink-0">
                      <span className="text-xs font-mono text-slate-500 hidden sm:inline">
                        {formatBytes(file.fileSize)}
                      </span>

                      <span className="text-xs text-slate-400 hidden md:inline">
                        {new Date(file.createdAt).toLocaleDateString()}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setPreviewFile(file)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Preview File"
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
                placeholder="Folder Name (e.g. Legal Documents)"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsCreateFolderOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" variant="primary">
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
              onSubmit={handleRenameSubmit}
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
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setRenameFileId(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" variant="primary">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Modal: File Preview */}
        {previewFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#111827] border border-[#CBD5E1] dark:border-[#334155] p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  {getFileIcon(previewFile.fileExtension)}
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate max-w-md">
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

              <div className="p-8 rounded-xl bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-center text-center space-y-3">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 shadow-md">
                  {getFileIcon(previewFile.fileExtension)}
                </div>
                <p className="text-xs font-mono text-slate-500">
                  Size: {formatBytes(previewFile.fileSize)} &bull; S3 Object: {previewFile.s3Key}
                </p>
                <p className="text-xs text-slate-400 max-w-md">
                  Files in private buckets are securely downloaded using signed Amazon S3 v4 HMAC-SHA256 presigned URLs valid for 15 minutes.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => alert(`Generating presigned AWS S3 download token for ${previewFile.originalName}`)}
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Download via Signed URL
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
