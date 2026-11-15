'use client';

import React, { useState } from 'react';
import {
  Layers,
  Type,
  Image as ImageIcon,
  Square,
  PenTool,
  Highlighter,
  Eraser,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  ChevronUp,
  ChevronDown,
  Edit2,
  Check,
  X,
} from 'lucide-react';
import {
  AddedTextElement,
  ImageElement,
  ShapeElement,
  SignatureElement,
  AnnotationElement,
  WhiteoutElement,
  SelectedObjectRef,
  EditableObjectType,
} from '@/types/pdfEditor';

interface LayersPanelProps {
  currentPage: number;
  addedTexts: AddedTextElement[];
  images: ImageElement[];
  shapes: ShapeElement[];
  signatures: SignatureElement[];
  annotations: AnnotationElement[];
  whiteouts: WhiteoutElement[];
  selectedObject: SelectedObjectRef | null;
  onSelectObject: (ref: SelectedObjectRef | null) => void;
  onUpdateObject: (type: EditableObjectType, id: string, updates: any) => void;
  onDeleteObject: (type: EditableObjectType, id: string) => void;
  onReorderZIndex: (type: EditableObjectType, id: string, direction: 'up' | 'down') => void;
  onClose: () => void;
}

export function LayersPanel({
  currentPage,
  addedTexts,
  images,
  shapes,
  signatures,
  annotations,
  whiteouts,
  selectedObject,
  onSelectObject,
  onUpdateObject,
  onDeleteObject,
  onReorderZIndex,
  onClose,
}: LayersPanelProps) {
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');

  // Collect all elements on this page
  interface UnifiedLayerItem {
    id: string;
    type: EditableObjectType;
    name: string;
    hidden: boolean;
    locked: boolean;
    zIndex: number;
    icon: any;
    preview: string;
  }

  const items: UnifiedLayerItem[] = [];

  // 1. Text items
  addedTexts
    .filter((t) => t.pageNumber === currentPage)
    .forEach((t, idx) => {
      items.push({
        id: t.id,
        type: 'addedText',
        name: t.name || `Text ${idx + 1}`,
        hidden: !!t.hidden,
        locked: !!t.locked,
        zIndex: t.zIndex || 20,
        icon: Type,
        preview: t.text ? (t.text.length > 18 ? t.text.substring(0, 18) + '...' : t.text) : 'Empty text',
      });
    });

  // 2. Image items
  images
    .filter((img) => img.pageNumber === currentPage)
    .forEach((img, idx) => {
      items.push({
        id: img.id,
        type: 'image',
        name: img.name || `Image ${idx + 1}`,
        hidden: !!img.hidden,
        locked: !!img.locked,
        zIndex: img.zIndex || 20,
        icon: ImageIcon,
        preview: `${Math.round(img.pdfWidth)}×${Math.round(img.pdfHeight)} pt`,
      });
    });

  // 3. Shape items
  shapes
    .filter((s) => s.pageNumber === currentPage)
    .forEach((s, idx) => {
      items.push({
        id: s.id,
        type: 'shape',
        name: s.name || `${s.type.charAt(0).toUpperCase() + s.type.slice(1)} ${idx + 1}`,
        hidden: !!s.hidden,
        locked: !!s.locked,
        zIndex: s.zIndex || 20,
        icon: Square,
        preview: `${s.strokeColor}`,
      });
    });

  // 4. Signatures
  signatures
    .filter((sig) => sig.pageNumber === currentPage)
    .forEach((sig, idx) => {
      items.push({
        id: sig.id,
        type: 'signature',
        name: sig.name || `Signature ${idx + 1}`,
        hidden: !!sig.hidden,
        locked: !!sig.locked,
        zIndex: sig.zIndex || 25,
        icon: PenTool,
        preview: 'Signature',
      });
    });

  // 5. Annotations
  annotations
    .filter((a) => a.pageNumber === currentPage)
    .forEach((a, idx) => {
      items.push({
        id: a.id,
        type: 'annotation',
        name: a.name || `Highlight ${idx + 1}`,
        hidden: !!a.hidden,
        locked: !!a.locked,
        zIndex: a.zIndex || 15,
        icon: Highlighter,
        preview: a.type,
      });
    });

  // 6. Whiteouts
  whiteouts
    .filter((w) => w.pageNumber === currentPage)
    .forEach((w, idx) => {
      items.push({
        id: w.id,
        type: 'whiteout',
        name: w.name || `Whiteout ${idx + 1}`,
        hidden: !!w.hidden,
        locked: !!w.locked,
        zIndex: w.zIndex || 10,
        icon: Eraser,
        preview: 'Whiteout mask',
      });
    });

  // Sort descending by zIndex so top elements appear at the top of the layers list
  items.sort((a, b) => b.zIndex - a.zIndex);

  const startRenaming = (item: UnifiedLayerItem) => {
    setEditingNameId(item.id);
    setTempName(item.name);
  };

  const saveRename = (item: UnifiedLayerItem) => {
    if (tempName.trim()) {
      onUpdateObject(item.type, item.id, { name: tempName.trim() });
    }
    setEditingNameId(null);
  };

  return (
    <div className="w-72 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col h-full shadow-lg select-none">
      {/* Header */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Layers & Objects
          </h3>
          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full font-mono text-slate-500 font-bold">
            {items.length}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Layer List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {items.length === 0 ? (
          <div className="text-center py-10 px-4 text-slate-400">
            <Layers className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs font-medium">No editable objects on Page {currentPage}</p>
            <p className="text-[11px] mt-1 text-slate-400">
              Add text, images, or shapes to manage layers.
            </p>
          </div>
        ) : (
          items.map((item) => {
            const isSelected = selectedObject?.id === item.id;
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                onClick={() =>
                  onSelectObject({
                    id: item.id,
                    type: item.type,
                    pageNumber: currentPage,
                  })
                }
                className={`group flex items-center justify-between p-2 rounded-xl text-xs transition-colors cursor-pointer border ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 dark:border-blue-600'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                {/* Left: Icon & Name */}
                <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                  <div
                    className={`p-1.5 rounded-lg ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    {editingNameId === item.id ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveRename(item);
                            if (e.key === 'Escape') setEditingNameId(null);
                          }}
                          autoFocus
                          className="w-full text-xs bg-white dark:bg-slate-800 border border-blue-500 rounded px-1.5 py-0.5 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => saveRename(item)}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono truncate">
                          {item.preview}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Actions (Visibility, Lock, Reorder, Delete) */}
                <div
                  className="flex items-center gap-0.5 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Rename */}
                  {editingNameId !== item.id && (
                    <button
                      type="button"
                      title="Rename Layer"
                      onClick={() => startRenaming(item)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  )}

                  {/* Visibility */}
                  <button
                    type="button"
                    title={item.hidden ? 'Show Layer' : 'Hide Layer'}
                    onClick={() =>
                      onUpdateObject(item.type, item.id, { hidden: !item.hidden })
                    }
                    className={`p-1 rounded cursor-pointer ${
                      item.hidden
                        ? 'text-slate-300 dark:text-slate-600'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                    }`}
                  >
                    {item.hidden ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* Lock */}
                  <button
                    type="button"
                    title={item.locked ? 'Unlock Layer' : 'Lock Layer'}
                    onClick={() =>
                      onUpdateObject(item.type, item.id, { locked: !item.locked })
                    }
                    className={`p-1 rounded cursor-pointer ${
                      item.locked
                        ? 'text-amber-600'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                    }`}
                  >
                    {item.locked ? (
                      <Lock className="w-3.5 h-3.5" />
                    ) : (
                      <Unlock className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* Reorder Up */}
                  <button
                    type="button"
                    title="Bring Forward"
                    onClick={() => onReorderZIndex(item.type, item.id, 'up')}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>

                  {/* Reorder Down */}
                  <button
                    type="button"
                    title="Send Backward"
                    onClick={() => onReorderZIndex(item.type, item.id, 'down')}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    title="Delete Layer"
                    onClick={() => onDeleteObject(item.type, item.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 font-mono text-center bg-slate-50 dark:bg-slate-900/50">
        Page {currentPage} Objects Stack
      </div>
    </div>
  );
}
