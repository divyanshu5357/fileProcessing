import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-24 bg-[#F7F9FC] dark:bg-[#0B0F17] text-[#0F172A] dark:text-[#F8FAFC]">
      <div className="max-w-lg w-full text-center space-y-6 bg-white dark:bg-[#131926] border border-[#E2E8F0] dark:border-[#1E293B] rounded-2xl p-8 sm:p-10 shadow-sm">
        <p className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase bg-[#E6F7F4] text-[#0F766E] dark:bg-[#0F766E]/20 dark:text-[#5EEAD4]">
          404 — Page Not Found
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          We couldn&apos;t find that page
        </h1>
        <p className="text-sm sm:text-base text-[#475569] dark:text-[#94A3B8] leading-relaxed">
          The page you requested may have moved or the URL may be incorrect. Return to the
          Gyanvatsala workspace to edit PDFs, convert files, or scan documents privately in your
          browser.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#0F766E] text-white hover:bg-[#0D655E] transition-colors"
          >
            Go to Homepage
          </Link>
          <Link
            href="/workspace"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold border border-[#CBD5E1] dark:border-[#334155] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] transition-colors"
          >
            Open Workspace
          </Link>
        </div>
      </div>
    </main>
  );
}
