'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Mail,
  MessageSquare,
  ShieldCheck,
  Clock,
  Send,
  CheckCircle2,
  HelpCircle,
  FileText,
  User,
  Globe,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/Button';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Prepare mailto fallback link as well
    const mailtoSubject = encodeURIComponent(`[Gyanvatsala Support - ${category.toUpperCase()}] ${subject || 'Support Request'}`);
    const mailtoBody = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nCategory: ${category}\n\nMessage:\n${message}\n\n---\nSent from Gyanvatsala Support Form`
    );

    setTimeout(() => {
      setSubmitting(false);
      setIsSubmitted(true);
      // Also open user's email client optionally
      window.location.href = `mailto:fileprocess@gyanvatsala.in?subject=${mailtoSubject}&body=${mailtoBody}`;
    }, 400);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0D1017] text-[#20232B] dark:text-[#F8FAFC] selection:bg-[#536BCE] selection:text-white transition-colors duration-150">
      <Header />

      <main className="flex-1 py-14 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Header Metadata */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-xs font-semibold text-[#536BCE] dark:text-[#93A5F5] border border-blue-200 dark:border-blue-900/60">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Contact & Support Desk</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-[#20232B] dark:text-[#F8FAFC] tracking-tight">
              We&apos;re here to help.
            </h1>
            <p className="text-sm sm:text-base text-[#727783] dark:text-[#9DA3AE] leading-relaxed">
              Have a question about document conversion, cloud storage, privacy architecture, or need technical assistance? Reach our team directly.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Contact Details & Info Card */}
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-[#F7F8FA] dark:bg-[#111622] border border-[#E9EBF0] dark:border-[#222632] space-y-5">
                <h3 className="text-sm font-bold text-[#20232B] dark:text-[#F8FAFC] uppercase tracking-wider">
                  Direct Support Details
                </h3>

                <div className="space-y-4 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 text-[#536BCE] flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#727783] dark:text-[#9DA3AE]">Official Support Email</p>
                      <a
                        href="mailto:fileprocess@gyanvatsala.in"
                        className="font-bold text-[#536BCE] dark:text-[#93A5F5] hover:underline"
                      >
                        fileprocess@gyanvatsala.in
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 text-emerald-600 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#727783] dark:text-[#9DA3AE]">Service Operator</p>
                      <p className="font-bold text-[#20232B] dark:text-[#F8FAFC]">
                        DIVYANSHU PRATAP SINGH
                      </p>
                      <p className="text-[11px] text-[#727783]">India</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 text-amber-600 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#727783] dark:text-[#9DA3AE]">Response SLA</p>
                      <p className="font-bold text-[#20232B] dark:text-[#F8FAFC]">
                        Within 24–48 Business Hours
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-900/60 text-purple-600 flex items-center justify-center shrink-0">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#727783] dark:text-[#9DA3AE]">Official Domain</p>
                      <p className="font-bold text-[#20232B] dark:text-[#F8FAFC]">
                        https://www.gyanvatsala.in
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E9EBF0] dark:border-[#222632]">
                  <a
                    href="mailto:fileprocess@gyanvatsala.in"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-[#536BCE] hover:bg-[#4157B5] text-white shadow-xs transition"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Open Email Client</span>
                  </a>
                </div>
              </div>

              {/* Quick Self-Help Card */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#111622] border border-[#E9EBF0] dark:border-[#222632] space-y-3">
                <h3 className="text-xs font-bold text-[#20232B] dark:text-[#F8FAFC] uppercase tracking-wider">
                  Self-Service & Guides
                </h3>
                <ul className="text-xs space-y-2 text-[#727783] dark:text-[#9DA3AE]">
                  <li>
                    <Link href="/pricing" className="text-[#536BCE] hover:underline font-semibold flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Subscription Tiers & Quotas</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className="text-[#536BCE] hover:underline font-semibold flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Terms & Conditions</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacy" className="text-[#536BCE] hover:underline font-semibold flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Privacy Policy & Local Processing</span>
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Interactive Contact Form */}
            <div className="lg:col-span-2">
              <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-[#111622] border border-[#E9EBF0] dark:border-[#222632] shadow-sm space-y-6">
                {isSubmitted ? (
                  <div className="py-12 text-center space-y-4 animate-in fade-in">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-black text-[#20232B] dark:text-[#F8FAFC]">
                        Message Prepared & Sent
                      </h3>
                      <p className="text-xs sm:text-sm text-[#727783] dark:text-[#9DA3AE] max-w-md mx-auto leading-relaxed">
                        Thank you, {name || 'valued user'}. Your request has been queued to <strong>fileprocess@gyanvatsala.in</strong>. An engineer will follow up shortly.
                      </p>
                    </div>
                    <div className="pt-4 flex justify-center gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsSubmitted(false);
                          setMessage('');
                          setSubject('');
                        }}
                        className="text-xs font-semibold py-2 px-4 rounded-xl"
                      >
                        Send Another Note
                      </Button>
                      <Link
                        href="/workspace"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#536BCE] text-white hover:bg-[#4157B5] transition shadow-xs"
                      >
                        <span>Go to Workspace</span>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <h2 className="text-xl font-bold text-[#20232B] dark:text-[#F8FAFC]">
                        Send a Message
                      </h2>
                      <p className="text-xs text-[#727783] dark:text-[#9DA3AE] mt-0.5">
                        Fill in the details below and we will get back to you promptly.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#20232B] dark:text-[#F8FAFC]">
                          Your Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Divyanshu Pratap"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#334155] text-xs bg-white dark:bg-[#0D1017] focus:outline-hidden focus:ring-2 focus:ring-[#536BCE]/40"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#20232B] dark:text-[#F8FAFC]">
                          Email Address <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. you@example.com"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#334155] text-xs bg-white dark:bg-[#0D1017] focus:outline-hidden focus:ring-2 focus:ring-[#536BCE]/40"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#20232B] dark:text-[#F8FAFC]">
                          Inquiry Category
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#334155] text-xs bg-white dark:bg-[#0D1017] focus:outline-hidden focus:ring-2 focus:ring-[#536BCE]/40"
                        >
                          <option value="general">General Inquiry</option>
                          <option value="technical">Document Processing Help</option>
                          <option value="account">Account & Storage Limits</option>
                          <option value="billing">Billing & Paid Plans</option>
                          <option value="grievance">Grievance & Privacy Support</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#20232B] dark:text-[#F8FAFC]">
                          Subject
                        </label>
                        <input
                          type="text"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="Brief description of your query"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#334155] text-xs bg-white dark:bg-[#0D1017] focus:outline-hidden focus:ring-2 focus:ring-[#536BCE]/40"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#20232B] dark:text-[#F8FAFC]">
                        Message Details <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={5}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Please describe how we can assist you..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#334155] text-xs bg-white dark:bg-[#0D1017] focus:outline-hidden focus:ring-2 focus:ring-[#536BCE]/40"
                      />
                    </div>

                    <div className="pt-2">
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={submitting}
                        className="w-full py-3 rounded-xl font-bold text-xs bg-[#536BCE] hover:bg-[#4157B5] text-white shadow-md flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{submitting ? 'Submitting...' : 'Send Message to fileprocess@gyanvatsala.in'}</span>
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
