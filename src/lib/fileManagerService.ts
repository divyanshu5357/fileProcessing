/**
 * Gyanvatsala Cloud File Manager & Storage Service
 * Handles S3 Presigned Uploads, Metadata in Neon PostgreSQL, Quota Enforcement & Data Retention
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
  expiresAt: string;
  notified48h?: boolean;
  notified24h?: boolean;
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

const LOCAL_FILES_KEY = 'gyanvatsala_saas_cloud_files';
const LEGACY_FILES_KEY = 'pixelkit_saas_cloud_files';
const LOCAL_FOLDERS_KEY = 'gyanvatsala_saas_cloud_folders';
const LEGACY_FOLDERS_KEY = 'pixelkit_saas_cloud_folders';
const LOCAL_JOBS_KEY = 'gyanvatsala_saas_cloud_jobs';
const LEGACY_JOBS_KEY = 'pixelkit_saas_cloud_jobs';

// Plan retention and quota rules
export const PLAN_LIMITS: Record<string, { storageBytes: number; maxFileBytes: number; retentionDays: number; name: string }> = {
  Free: { storageBytes: 15728640, maxFileBytes: 15728640, retentionDays: 7, name: 'Free' },
  Prime: { storageBytes: 52428800, maxFileBytes: 26214400, retentionDays: 14, name: 'Prime' },
  PrimePlus: { storageBytes: 104857600, maxFileBytes: 52428800, retentionDays: 30, name: 'PrimePlus' },
  PrimeUltra: { storageBytes: 524288000, maxFileBytes: 104857600, retentionDays: 365, name: 'PrimeUltra' },
  Pro: { storageBytes: 104857600, maxFileBytes: 52428800, retentionDays: 30, name: 'PrimePlus' },
  Business: { storageBytes: 524288000, maxFileBytes: 104857600, retentionDays: 365, name: 'PrimeUltra' },
};

const initialFolders: CloudFolder[] = [];
const initialFiles: CloudFile[] = [];
const initialJobs: ProcessingJob[] = [];

export const fileManagerService = {
  getFiles: (): CloudFile[] => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(LOCAL_FILES_KEY) || localStorage.getItem(LEGACY_FILES_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      // Strip any legacy mock dummy data
      return Array.isArray(parsed) ? parsed.filter((f) => !f.id.startsWith('fil-10')) : [];
    } catch {
      return [];
    }
  },

  getFolders: (): CloudFolder[] => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(LOCAL_FOLDERS_KEY) || localStorage.getItem(LEGACY_FOLDERS_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed.filter((f) => !f.id.startsWith('fld-')) : [];
    } catch {
      return [];
    }
  },
  getJobs: (): ProcessingJob[] => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(LOCAL_JOBS_KEY) || localStorage.getItem(LEGACY_JOBS_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed.filter((j) => !j.id.startsWith('job-98')) : [];
    } catch {
      return [];
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
    onProgress?: (progress: number) => void,
    userPlan: string = 'Free'
  ): Promise<CloudFile> => {
    // 1. Quota & Plan Enforcement
    const planConfig = PLAN_LIMITS[userPlan] || PLAN_LIMITS.Free;
    const currentFiles = fileManagerService.getFiles();
    const currentUsedBytes = currentFiles.reduce((acc, f) => acc + f.fileSize, 0);

    if (file.size > planConfig.maxFileBytes) {
      throw new Error(
        `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the ${planConfig.name} plan limit of ${(planConfig.maxFileBytes / (1024 * 1024)).toFixed(0)} MB.`
      );
    }

    if (currentUsedBytes + file.size > planConfig.storageBytes) {
      throw new Error(
        `Storage quota exceeded! You are using ${(currentUsedBytes / (1024 * 1024)).toFixed(1)} MB of ${(planConfig.storageBytes / (1024 * 1024)).toFixed(0)} MB. Upgrade to Prime or PrimePlus for more storage.`
      );
    }

    // 2. Simulated Direct S3 Multipart Upload with progress
    for (let p = 15; p <= 95; p += 25) {
      if (onProgress) onProgress(p);
      await new Promise((r) => setTimeout(r, 100));
    }
    if (onProgress) onProgress(100);

    // 3. Assign Expiration Date based on Plan Retention Days
    const expiresAt = new Date(Date.now() + planConfig.retentionDays * 86400000).toISOString();
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
      expiresAt,
    };

    const files = [newFile, ...currentFiles];
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

  getExpiringFiles: (hours: number = 48): CloudFile[] => {
    const files = fileManagerService.getFiles();
    const thresholdMs = Date.now() + hours * 3600000;
    return files.filter((f) => {
      const exp = new Date(f.expiresAt).getTime();
      return exp <= thresholdMs && exp > Date.now();
    });
  },

  runRetentionCleanup: (): { expiredCount: number } => {
    const files = fileManagerService.getFiles();
    const now = Date.now();
    const validFiles = files.filter((f) => new Date(f.expiresAt).getTime() > now);
    const expiredCount = files.length - validFiles.length;
    if (expiredCount > 0) {
      localStorage.setItem(LOCAL_FILES_KEY, JSON.stringify(validFiles));
    }
    return { expiredCount };
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
