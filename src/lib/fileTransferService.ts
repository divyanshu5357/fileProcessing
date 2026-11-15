/**
 * In-memory file bridge for seamless transitions between the Workspace and dedicated tools.
 */

let pendingFile: File | null = null;
let pendingToolId: string | null = null;

export const fileTransferService = {
  setPendingFile: (file: File, toolId?: string) => {
    pendingFile = file;
    pendingToolId = toolId || null;
  },

  getPendingFile: () => pendingFile,

  getPendingToolId: () => pendingToolId,

  hasPendingFile: () => pendingFile !== null,

  consumePendingFile: (): { file: File; toolId: string | null } | null => {
    if (!pendingFile) return null;
    const result = { file: pendingFile, toolId: pendingToolId };
    pendingFile = null;
    pendingToolId = null;
    return result;
  },

  clearPendingFile: () => {
    pendingFile = null;
    pendingToolId = null;
  },
};
