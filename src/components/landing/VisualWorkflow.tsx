'use client';

import React, { useState } from 'react';
import { FileText, ArrowRight, CheckCircle2, Sliders, FolderDown, Sparkles } from 'lucide-react';

export function VisualWorkflow() {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(2);

  const steps = [
    {
      num: '01',
      title: 'Start with your file',
      description: 'Drag and drop any PDF, image, document, or spreadsheet. It opens instantly in your local browser sandbox.',
      meta: 'Instant Local Drop',
    },
    {
      num: '02',
      title: 'Make it yours',
      description: 'Reconstruct layouts, customize page numbers, apply scan skew, edit text, or re-encode lossless WebP.',
      meta: 'Interactive Precision',
    },
    {
      num: '03',
      title: 'Get the finished result',
      description: 'Inspect the live preview before saving, adjust the filename, and route directly to your chosen local folder.',
      meta: 'Custom Folder Export',
    },
  ];

  return (
    <section id="how-it-works" className="w-full py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#0D1017] border-t border-[#E9EBF0] dark:border-[#222632] transition-colors scroll-mt-20">
      <div className="max-w-7xl mx-auto flex flex-col gap-14">
        {/* Section Heading */}
        <div className="max-w-2xl">
          <span className="text-xs font-semibold text-[#536BCE] uppercase tracking-wider block mb-2">
            The Workflow
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#20232B] dark:text-[#F8FAFC] tracking-tight leading-tight">
            From the first page to the final file.
          </h2>
          <p className="text-base sm:text-lg text-[#727783] dark:text-[#9DA3AE] mt-3 leading-relaxed">
            See your document transform visually at each step. Clear, predictable, and always under your control.
          </p>
        </div>

        {/* 3 Step Interactive Workflow Experience */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Step Selectors */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {steps.map((step, idx) => {
              const stepNumber = (idx + 1) as 1 | 2 | 3;
              const isActive = activeStep === stepNumber;
              return (
                <div
                  key={step.num}
                  onClick={() => setActiveStep(stepNumber)}
                  className={`p-6 rounded-2xl border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#F7F8FA] dark:bg-[#151926] border-[#536BCE] shadow-sm'
                      : 'bg-white dark:bg-[#0D1017] border-[#E9EBF0] dark:border-[#222632] hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-xs font-mono font-bold ${
                        isActive ? 'text-[#536BCE]' : 'text-[#727783]'
                      }`}
                    >
                      {step.num}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white dark:bg-[#1E2538] border border-[#E9EBF0] dark:border-[#28314A] text-[#727783]">
                      {step.meta}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-[#20232B] dark:text-[#F8FAFC]">
                    {step.title}
                  </h3>
                  <p className="text-xs text-[#727783] dark:text-[#9DA3AE] mt-1.5 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Right Column: Dynamic Document Visual Transformation */}
          <div className="lg:col-span-7 rounded-3xl bg-[#F7F8FA] dark:bg-[#131722] border border-[#E9EBF0] dark:border-[#242B3E] p-6 sm:p-10 flex items-center justify-center min-h-[380px] relative overflow-hidden shadow-sm">
            {/* STAGE 1 VISUAL: RAW UPLOAD */}
            {activeStep === 1 && (
              <div className="w-full max-w-md bg-white dark:bg-[#1A2030] rounded-2xl border border-dashed border-[#536BCE] p-8 flex flex-col items-center text-center gap-4 animate-in fade-in duration-200">
                <div className="w-14 h-14 rounded-2xl bg-[#EDF0FF] dark:bg-[#536BCE]/20 flex items-center justify-center text-[#536BCE]">
                  <FileText className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#20232B] dark:text-[#F8FAFC]">
                    Quarterly_Financial_Review.pdf
                  </h4>
                  <span className="text-xs text-[#727783] font-mono mt-1 block">
                    3.8 MB • Loaded in 42ms • Zero network transfer
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="w-full h-full bg-[#536BCE] rounded-full" />
                </div>
                <span className="text-[11px] text-[#159B75] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready for Transformation
                </span>
              </div>
            )}

            {/* STAGE 2 VISUAL: TRANSFORMATION IN PROGRESS */}
            {activeStep === 2 && (
              <div className="w-full max-w-md bg-white dark:bg-[#1A2030] rounded-2xl border border-[#E9EBF0] dark:border-[#28314A] p-6 shadow-md flex flex-col gap-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#536BCE]" />
                    <span className="text-xs font-bold text-[#20232B] dark:text-[#F8FAFC]">
                      Active Document Tuning
                    </span>
                  </div>
                  <span className="text-[10px] font-mono bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 px-2 py-0.5 rounded-full font-semibold">
                    Live Rendering
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#F7F8FA] dark:bg-[#121622] flex flex-col gap-2.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#727783]">Reconstructed Tables:</span>
                    <span className="font-semibold text-emerald-600">8 Tables (100% Native)</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#727783]">Vector Font Families:</span>
                    <span className="font-semibold text-[#20232B] dark:text-[#F8FAFC]">Calibri, Georgia</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#727783]">Page Numbering:</span>
                    <span className="font-semibold text-[#536BCE]">Bottom Center (Page 1 of 8)</span>
                  </div>
                </div>

                <div className="border border-dashed border-[#536BCE]/40 rounded-lg p-3 text-center text-xs text-[#727783]">
                  Changes are reflected in real time on the document canvas.
                </div>
              </div>
            )}

            {/* STAGE 3 VISUAL: EXPORT PREVIEW & FOLDER PICKER */}
            {activeStep === 3 && (
              <div className="w-full max-w-md bg-white dark:bg-[#1A2030] rounded-2xl border border-[#E9EBF0] dark:border-[#28314A] p-6 shadow-lg flex flex-col gap-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <FolderDown className="w-4 h-4 text-[#159B75]" />
                    <span className="text-xs font-bold text-[#20232B] dark:text-[#F8FAFC]">
                      Export Preview Modal
                    </span>
                  </div>
                  <span className="text-[10px] font-mono bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                    Completed
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-medium text-[#727783]">Save File Name</label>
                  <input
                    type="text"
                    readOnly
                    value="Quarterly_Financial_Review_Final.docx"
                    className="w-full px-3 py-2 rounded-lg border border-[#E9EBF0] dark:border-[#28314A] bg-[#F7F8FA] dark:bg-[#121622] text-xs font-medium text-[#20232B] dark:text-[#F8FAFC]"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <div className="flex-1 py-2.5 rounded-xl bg-[#536BCE] text-white text-xs font-semibold text-center shadow-xs">
                    Choose Local Folder & Save
                  </div>
                  <div className="px-3 py-2.5 rounded-xl border border-[#E9EBF0] dark:border-[#28314A] text-xs font-semibold text-[#727783] text-center">
                    Download
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
