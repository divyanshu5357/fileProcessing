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

const getDefaultActivities = (): UserActivityItem[] => {
  return [];
};

export const activityService = {
  getActivities: (): UserActivityItem[] => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(ACTIVITY_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (!data) return [];
      let parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.filter((item: UserActivityItem) => !item.id?.startsWith('act-'));
      }
      return [];
    } catch {
      return [];
    }
  },

  clearMockActivities: (): void => {
    if (typeof window === 'undefined') return;
    try {
      const data = localStorage.getItem(ACTIVITY_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((item: UserActivityItem) => !item.id?.startsWith('act-'));
          localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(cleaned));
        }
      }
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {}
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
