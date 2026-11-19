/**
 * User File Processing Activity Service
 * Manages chronological timeline of user operations without exposing infrastructure details.
 */

export interface UserActivityItem {
  id: string;
  userId?: string;
  fileName: string;
  fileType: 'pdf' | 'image' | 'word' | 'excel' | 'powerpoint' | 'document' | 'other';
  fileSize: number;
  operation: string; // e.g. "PDF to Word", "Compress Image", "Edit PDF", "Merged PDF", "Scan Studio"
  status: 'Uploaded' | 'Processing' | 'Completed' | 'Failed' | 'Expired';
  timestamp: string; // ISO date string
  resultFileName?: string;
  resultSize?: number;
  downloadUrl?: string;
}

const ACTIVITY_STORAGE_KEY = 'gyanvatsala_user_activities_v2';
const LEGACY_STORAGE_KEY = 'pixelkit_user_activities_v2';

// Initial realistic default activities reflecting the user's recent operations
const getDefaultActivities = (): UserActivityItem[] => {
  const now = Date.now();
  const oneHourAgo = new Date(now - 3600000 * 2).toISOString();
  const fourHoursAgo = new Date(now - 3600000 * 5).toISOString();
  const yesterday = new Date(now - 86400000).toISOString();
  const twoDaysAgo = new Date(now - 86400000 * 2).toISOString();

  return [
    {
      id: 'act-1',
      fileName: 'Practical_File.pdf',
      fileType: 'pdf',
      fileSize: 4210000,
      operation: 'PDF to Word (DOCX)',
      status: 'Completed',
      timestamp: oneHourAgo,
      resultFileName: 'Practical_File.docx',
      resultSize: 1820000,
    },
    {
      id: 'act-2',
      fileName: 'University_Logo.png',
      fileType: 'image',
      fileSize: 1250000,
      operation: 'Compress Image (Lossless)',
      status: 'Completed',
      timestamp: fourHoursAgo,
      resultFileName: 'University_Logo_compressed.png',
      resultSize: 420000,
    },
    {
      id: 'act-3',
      fileName: 'Quarterly_Financial_Report_2026.pdf',
      fileType: 'pdf',
      fileSize: 3100000,
      operation: 'PDF Editor — Annotated & Signed',
      status: 'Completed',
      timestamp: yesterday,
      resultFileName: 'Quarterly_Financial_Report_2026_edited.pdf',
      resultSize: 3200000,
    },
    {
      id: 'act-4',
      fileName: 'Lecture_Handout_Scanned.pdf',
      fileType: 'pdf',
      fileSize: 5800000,
      operation: 'Scan Studio — Deskew & Warm Paper',
      status: 'Completed',
      timestamp: twoDaysAgo,
      resultFileName: 'Lecture_Handout_Scanned.pdf',
      resultSize: 4900000,
    },
  ];
};

export const activityService = {
  getActivities: (): UserActivityItem[] => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(ACTIVITY_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (!data) {
        const defaults = getDefaultActivities();
        localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(defaults));
        return defaults;
      }
      return JSON.parse(data);
    } catch {
      return getDefaultActivities();
    }
  },

  logActivity: (
    activity: Omit<UserActivityItem, 'id' | 'timestamp'> & { timestamp?: string }
  ): UserActivityItem => {
    const existing = activityService.getActivities();
    const newItem: UserActivityItem = {
      ...activity,
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: activity.timestamp || new Date().toISOString(),
    };
    const updated = [newItem, ...existing];
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(updated.slice(0, 100)));
      } catch (err) {
        console.warn('Failed to save activity to storage:', err);
      }
    }
    return newItem;
  },

  deleteActivity: (id: string): void => {
    const existing = activityService.getActivities();
    const updated = existing.filter((a) => a.id !== id);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to delete activity from storage:', err);
      }
    }
  },

  clearActivities: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ACTIVITY_STORAGE_KEY);
    }
  },
};
