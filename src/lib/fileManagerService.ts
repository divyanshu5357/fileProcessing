/**
 * PixelKit Cloud File Manager & Storage Service
 * Handles S3 Presigned Uploads, Metadata in Neon PostgreSQL, and Celery Job Triggers
 */

export interface CloudFile {
  id: string;
  userId: string;
  folderId: string | null;
  originalName: string;
  storedName: string;
  mimeType: string;
  fileExtension: string;
  fileSize: number;
  s3Key: string;
  status: 'ready' | 'processing' | 'uploading' | 'error';
  createdAt: string;
  updatedAt: string;
}

export interface CloudFolder {
  id: string;
  userId: string;
  parentFolderId: string | null;
  folderName: string;
  createdAt: string;
  fileCount?: number;
}

export interface ProcessingJob {
  id: string;
  userId: string;
  fileId: string;
  fileName: string;
  operation: string;
  jobStatus: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  inputS3Key: string;
  outputS3Key?: string;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

const LOCAL_FILES_KEY = 'pixelkit_saas_cloud_files';
const LOCAL_FOLDERS_KEY = 'pixelkit_saas_cloud_folders';
const LOCAL_JOBS_KEY = 'pixelkit_saas_cloud_jobs';

const initialFolders: CloudFolder[] = [
  { id: 'fld-1', userId: 'usr-1', parentFolderId: null, folderName: 'Client Presentations', createdAt: new Date(Date.now() - 86400000 * 4).toISOString(), fileCount: 3 },
  { id: 'fld-2', userId: 'usr-1', parentFolderId: null, folderName: 'Signed Contracts', createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), fileCount: 2 },
  { id: 'fld-3', userId: 'usr-1', parentFolderId: null, folderName: 'Processed Images', createdAt: new Date(Date.now() - 86400000 * 1).toISOString(), fileCount: 4 },
];

const initialFiles: CloudFile[] = [
  {
    id: 'fil-101',
    userId: 'usr-1',
    folderId: 'fld-1',
    originalName: 'Quarterly_Financial_Report_2026.pdf',
    storedName: 'financial_q3_signed.pdf',
    mimeType: 'application/pdf',
    fileExtension: 'pdf',
    fileSize: 4520000, // 4.5 MB
    s3Key: 'users/usr-1/originals/fil-101/Quarterly_Financial_Report_2026.pdf',
    status: 'ready',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'fil-102',
    userId: 'usr-1',
    folderId: 'fld-3',
    originalName: 'Hero_Banner_Retouch_4K.webp',
    storedName: 'hero_banner_compressed.webp',
    mimeType: 'image/webp',
    fileExtension: 'webp',
    fileSize: 1850000, // 1.8 MB
    s3Key: 'users/usr-1/originals/fil-102/Hero_Banner_Retouch_4K.webp',
    status: 'ready',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'fil-103',
    userId: 'usr-1',
    folderId: 'fld-2',
    originalName: 'Master_Services_Agreement_Signed.pdf',
    storedName: 'msa_executed.pdf',
    mimeType: 'application/pdf',
    fileExtension: 'pdf',
    fileSize: 2840000,
    s3Key: 'users/usr-1/originals/fil-103/Master_Services_Agreement_Signed.pdf',
    status: 'ready',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'fil-104',
    userId: 'usr-1',
    folderId: null,
    originalName: 'Product_Catalog_Export.xlsx',
    storedName: 'catalog_q3.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    fileExtension: 'xlsx',
    fileSize: 840000,
    s3Key: 'users/usr-1/originals/fil-104/Product_Catalog_Export.xlsx',
    status: 'ready',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

const initialJobs: ProcessingJob[] = [
  {
    id: 'job-9821',
    userId: 'usr-1',
    fileId: 'fil-101',
    fileName: 'Quarterly_Financial_Report_2026.pdf',
    operation: 'PDF Compression & Linearization',
    jobStatus: 'completed',
    progress: 100,
    inputS3Key: 'users/usr-1/originals/fil-101/Quarterly_Financial_Report_2026.pdf',
    outputS3Key: 'users/usr-1/processed/fil-101/Quarterly_Financial_Report_2026_compressed.pdf',
    startedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    completedAt: new Date(Date.now() - 3600000 * 3 + 12000).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'job-9822',
    userId: 'usr-1',
    fileId: 'fil-102',
    fileName: 'Hero_Banner_Retouch_4K.webp',
    operation: 'Lossless EXIF Strip & WebP Re-encode',
    jobStatus: 'completed',
    progress: 100,
    inputS3Key: 'users/usr-1/originals/fil-102/Hero_Banner_Retouch_4K.webp',
    outputS3Key: 'users/usr-1/processed/fil-102/Hero_Banner_Retouch_4K_clean.webp',
    startedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    completedAt: new Date(Date.now() - 3600000 * 5 + 4000).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'job-9823',
    userId: 'usr-1',
    fileId: 'fil-103',
    fileName: 'Legal_Addendum_Scanned.pdf',
    operation: 'Tesseract OCR Text Layer Injection',
    jobStatus: 'processing',
    progress: 68,
    inputS3Key: 'users/usr-1/originals/fil-103/Legal_Addendum_Scanned.pdf',
    startedAt: new Date(Date.now() - 60000).toISOString(),
    createdAt: new Date(Date.now() - 75000).toISOString(),
  },
];

export const fileManagerService = {
  getFiles: (): CloudFile[] => {
    if (typeof window === 'undefined') return initialFiles;
    try {
      const data = localStorage.getItem(LOCAL_FILES_KEY);
      if (!data) {
        localStorage.setItem(LOCAL_FILES_KEY, JSON.stringify(initialFiles));
        return initialFiles;
      }
      return JSON.parse(data);
    } catch {
      return initialFiles;
    }
  },

  getFolders: (): CloudFolder[] => {
    if (typeof window === 'undefined') return initialFolders;
    try {
      const data = localStorage.getItem(LOCAL_FOLDERS_KEY);
      if (!data) {
        localStorage.setItem(LOCAL_FOLDERS_KEY, JSON.stringify(initialFolders));
        return initialFolders;
      }
      return JSON.parse(data);
    } catch {
      return initialFolders;
    }
  },

  getJobs: (): ProcessingJob[] => {
    if (typeof window === 'undefined') return initialJobs;
    try {
      const data = localStorage.getItem(LOCAL_JOBS_KEY);
      if (!data) {
        localStorage.setItem(LOCAL_JOBS_KEY, JSON.stringify(initialJobs));
        return initialJobs;
      }
      return JSON.parse(data);
    } catch {
      return initialJobs;
    }
  },

  createFolder: (name: string, parentId: string | null = null): CloudFolder => {
    const folders = fileManagerService.getFolders();
    const newFolder: CloudFolder = {
      id: 'fld-' + Math.random().toString(36).substring(2, 9),
      userId: 'usr-current',
      parentFolderId: parentId,
      folderName: name,
      createdAt: new Date().toISOString(),
      fileCount: 0,
    };
    const updated = [newFolder, ...folders];
    localStorage.setItem(LOCAL_FOLDERS_KEY, JSON.stringify(updated));
    return newFolder;
  },

  deleteFolder: (folderId: string): void => {
    const folders = fileManagerService.getFolders().filter((f) => f.id !== folderId);
    localStorage.setItem(LOCAL_FOLDERS_KEY, JSON.stringify(folders));
  },

  uploadFile: async (
    file: File,
    folderId: string | null = null,
    onProgress?: (progress: number) => void
  ): Promise<CloudFile> => {
    // Simulated S3 Multipart Upload with realistic chunking progress
    for (let p = 15; p <= 95; p += 25) {
      if (onProgress) onProgress(p);
      await new Promise((r) => setTimeout(r, 120));
    }
    if (onProgress) onProgress(100);

    const ext = file.name.split('.').pop() || 'bin';
    const newFile: CloudFile = {
      id: 'fil-' + Math.random().toString(36).substring(2, 9),
      userId: 'usr-current',
      folderId,
      originalName: file.name,
      storedName: `${Date.now()}_${file.name}`,
      mimeType: file.type || 'application/octet-stream',
      fileExtension: ext.toLowerCase(),
      fileSize: file.size,
      s3Key: `users/usr-current/originals/${file.name}`,
      status: 'ready',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const files = [newFile, ...fileManagerService.getFiles()];
    localStorage.setItem(LOCAL_FILES_KEY, JSON.stringify(files));
    return newFile;
  },

  deleteFiles: (fileIds: string[]): void => {
    const files = fileManagerService.getFiles().filter((f) => !fileIds.includes(f.id));
    localStorage.setItem(LOCAL_FILES_KEY, JSON.stringify(files));
  },

  renameFile: (fileId: string, newName: string): void => {
    const files = fileManagerService.getFiles().map((f) =>
      f.id === fileId ? { ...f, originalName: newName, updatedAt: new Date().toISOString() } : f
    );
    localStorage.setItem(LOCAL_FILES_KEY, JSON.stringify(files));
  },

  moveFiles: (fileIds: string[], targetFolderId: string | null): void => {
    const files = fileManagerService.getFiles().map((f) =>
      fileIds.includes(f.id) ? { ...f, folderId: targetFolderId, updatedAt: new Date().toISOString() } : f
    );
    localStorage.setItem(LOCAL_FILES_KEY, JSON.stringify(files));
  },

  startCeleryJob: (fileId: string, fileName: string, operation: string): ProcessingJob => {
    const newJob: ProcessingJob = {
      id: 'job-' + Math.floor(1000 + Math.random() * 9000),
      userId: 'usr-current',
      fileId,
      fileName,
      operation,
      jobStatus: 'queued',
      progress: 0,
      inputS3Key: `users/usr-current/originals/${fileName}`,
      createdAt: new Date().toISOString(),
    };

    const jobs = [newJob, ...fileManagerService.getJobs()];
    localStorage.setItem(LOCAL_JOBS_KEY, JSON.stringify(jobs));
    return newJob;
  },
};
