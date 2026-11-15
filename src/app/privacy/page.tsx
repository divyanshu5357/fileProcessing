'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  Eye,
  FileText,
  Mail,
  Globe,
  Clock,
  HardDrive,
  Cpu,
  UserCheck,
  Server,
  Trash2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0D1017] text-[#20232B] dark:text-[#F8FAFC] selection:bg-[#536BCE] selection:text-white transition-colors duration-150">
      <Header />

      <main className="flex-1 py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Metadata */}
          <div className="border-b border-[#E9EBF0] dark:border-[#222632] pb-8 mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-xs font-semibold text-[#159B75] mb-4 border border-emerald-200 dark:border-emerald-800/60">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Data Protection & Privacy</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-[#20232B] dark:text-[#F8FAFC] tracking-tight">
              Privacy Policy
            </h1>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-[#727783] dark:text-[#9DA3AE] mt-4 font-mono">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#536BCE]" />
                Effective Date: 15 November 2026
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#536BCE]" />
                Last Updated: 15 November 2026
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#536BCE]" />
                Website: https://www.gyanvatsala.in/
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#536BCE]" />
                Privacy Email: fileprocess@gyanvatsala.in
              </span>
            </div>
          </div>

          {/* Table of Contents Pill Bar */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#F7F8FA] dark:bg-[#141824] border border-[#E9EBF0] dark:border-[#242B3E] mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#727783] dark:text-[#9DA3AE] mb-3">
              Policy Table of Contents
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              {[
                { num: '1', title: 'Introduction & Operator' },
                { num: '2', title: 'Information We Collect' },
                { num: '3', title: 'How We Process Files' },
                { num: '4', title: 'Storage & Retention Limits' },
                { num: '5', title: 'Legal Bases for Processing' },
                { num: '6', title: 'Third-Party Providers' },
                { num: '7', title: 'Cookies & Storage' },
                { num: '8', title: 'Data Security Measures' },
                { num: '9', title: 'Your Rights & Choices' },
                { num: '10', title: 'International Transfers' },
                { num: '11', title: "Children's Privacy" },
                { num: '12', title: 'Changes to this Policy' },
                { num: '13', title: 'Contact & Grievance' },
              ].map((s) => (
                <a
                  key={s.num}
                  href={`#privacy-section-${s.num}`}
                  className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-[#1E2538] text-[#20232B] dark:text-[#CBD5E1] hover:text-[#536BCE] transition flex items-center gap-1.5"
                >
                  <span className="font-mono text-[#536BCE] font-bold">{s.num}.</span>
                  <span className="truncate">{s.title}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Privacy Content Sections */}
          <div className="space-y-12 text-sm leading-relaxed text-[#20232B] dark:text-[#CBD5E1]">
            {/* Section 1 */}
            <section id="privacy-section-1" className="scroll-mt-24">
              <h2 className="text-xl font-bold text-[#20232B] dark:text-[#F8FAFC] border-b border-[#E9EBF0] dark:border-[#222632] pb-2 mb-3">
                1. Introduction
              </h2>
              <p className="mb-3">
                Gyanvatsala (&quot;we&quot;, &quot;our&quot;, &quot;us&quot; or &quot;the Service&quot;) is a digital workspace providing tools for processing, editing, converting, organizing and managing documents, PDFs, images and other supported file formats.
              </p>
              <p className="mb-3">
                This Privacy Policy explains how we collect, use, store, process, disclose and protect personal information and uploaded files when you use our website and services.
              </p>
              <div className="p-4 rounded-xl bg-[#EDF0FF]/60 dark:bg-[#536BCE]/15 border border-[#536BCE]/30 text-xs text-[#20232B] dark:text-[#F8FAFC] mb-3">
                <strong className="block font-bold text-[#536BCE] mb-1">Service Operator Notice:</strong>
                Gyanvatsala is operated by <strong>DIVYANSHU PRATAP SINGH</strong>, an individual operating from India. Gyanvatsala is the product and brand name used for the service.
              </div>
              <p>
                By using our services, you acknowledge this Privacy Policy. Where applicable law requires consent for a particular processing activity, we will seek that consent separately.
              </p>
            </section>

            {/* Section 2 */}
            <section id="privacy-section-2" className="scroll-mt-24">
              <h2 className="text-xl font-bold text-[#20232B] dark:text-[#F8FAFC] border-b border-[#E9EBF0] dark:border-[#222632] pb-2 mb-3">
                2. Information We Collect
              </h2>

              <h3 className="font-bold text-base mt-3 mb-1">2.1 Account and Authentication Information</h3>
              <p className="mb-2">When you create an account or sign in, we may process:</p>
              <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm mb-3">
                <li>Name or display name.</li>
                <li>Email address.</li>
                <li>Account identifier.</li>
                <li>Authentication and session information.</li>
                <li>Account creation and login timestamps.</li>
                <li>Security-related information.</li>
              </ul>
              <p className="mb-2">
                Gyanvatsala uses Better Auth for authentication and account management.
              </p>
              <p className="mb-3">
                If you choose Google sign-in, Google may provide information such as your name, email address and profile picture according to the permissions and authorization you grant.
              </p>
              <p className="mb-4">
                We do not intentionally store passwords in readable form; passwords and OTP tokens are securely hashed.
              </p>

              <h3 className="font-bold text-base mt-4 mb-1">2.2 Uploaded Files and Processing Information</h3>
              <p className="mb-2">Depending on the tool you use, we may process:</p>
              <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm mb-3">
                <li>Original file contents.</li>
                <li>File name and format.</li>
                <li>File size.</li>
                <li>Page count and document metadata.</li>
                <li>Processing settings.</li>
                <li>Processing status and errors.</li>
                <li>Generated output files.</li>
              </ul>
              <p className="mb-3">
                Files are processed only as necessary to provide the requested operation, manage optional cloud storage, maintain security or comply with applicable legal obligations.
              </p>
              <p className="mb-4 font-semibold text-[#159B75]">
                You retain ownership of your uploaded files and generated documents.
              </p>

              <h3 className="font-bold text-base mt-4 mb-1">2.3 Payment and Subscription Information</h3>
              <p className="mb-2">If you purchase a subscription, we may process:</p>
              <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm mb-3">
                <li>Selected plan.</li>
                <li>Subscription status.</li>
                <li>Transaction reference.</li>
                <li>Payment amount and currency.</li>
                <li>Billing and renewal dates.</li>
                <li>Payment status.</li>
              </ul>
              <p className="mb-4 text-xs text-[#727783] dark:text-[#9DA3AE]">
                Payments may be handled by a third-party payment provider. We do not store your full payment card number, CVV, UPI PIN or banking authentication credentials on our servers.
              </p>

              <h3 className="font-bold text-base mt-4 mb-1">2.4 Technical and Usage Information</h3>
              <p className="mb-2">We and our infrastructure providers may process technical information such as:</p>
              <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm mb-3">
                <li>IP address.</li>
                <li>Browser and operating system information.</li>
                <li>Device information.</li>
                <li>Website access timestamps.</li>
                <li>API requests.</li>
                <li>Authentication and session events.</li>
                <li>Security and diagnostic logs.</li>
                <li>Error reports and performance information.</li>
              </ul>
              <p className="mb-4">
                We use this information to operate the service, maintain security, troubleshoot errors and prevent misuse.
              </p>

              <h3 className="font-bold text-base mt-4 mb-1">2.5 Support Communications</h3>
              <p className="mb-2">
                If you contact us, we may process your email address, message, attachments you voluntarily provide and information necessary to respond.
              </p>
              <p className="text-xs text-[#727783] dark:text-[#9DA3AE]">
                Our support email is <a href="mailto:fileprocess@gyanvatsala.in" className="text-[#536BCE] underline">fileprocess@gyanvatsala.in</a>. Please do not send passwords, OTPs or unnecessary sensitive information through support email.
              </p>
            </section>

            {/* Section 3 */}
            <section id="privacy-section-3" className="scroll-mt-24">
              <h2 className="text-xl font-bold text-[#20232B] dark:text-[#F8FAFC] border-b border-[#E9EBF0] dark:border-[#222632] pb-2 mb-3">
                3. How We Process Your Files
              </h2>
              <p className="mb-3">
                Gyanvatsala supports both local browser-based processing and server-side processing. The method depends on the selected tool.
              </p>

              <h3 className="font-bold text-base mt-3 mb-1">3.1 Local Browser Processing</h3>
              <p className="mb-2">
                Many tools (such as PDF to Word, image compression, page numbering, scan simulation, and format conversion) process files directly within your browser or on your device.
              </p>
              <p className="mb-2">Where local processing is used:</p>
              <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm mb-3">
                <li>Your selected file is processed within your browser memory via WebAssembly and HTML5 Canvas APIs.</li>
                <li>The file does not need to be transmitted to our remote processing backend for that operation.</li>
                <li>You can download the resulting file directly to your local storage.</li>
                <li>The file is not automatically saved to Gyanvatsala cloud storage merely because you used the tool.</li>
                <li>Closing your browser tab or clearing memory instantly destroys the active document blob in RAM.</li>
              </ul>

              <h3 className="font-bold text-base mt-4 mb-1">3.2 Optional Cloud Processing and Storage</h3>
              <p className="mb-2">
                When you are signed in and explicitly choose to save files to your account or queue heavy asynchronous tasks:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm mb-3">
                <li>Files are securely transmitted over encrypted TLS 1.3 connections to our private storage vault.</li>
                <li>Files are accessible only through authenticated, short-lived presigned download URLs.</li>
                <li>Files count towards your plan&apos;s allocated cloud storage quota.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section id="privacy-section-4" className="scroll-mt-24">
              <h2 className="text-xl font-bold text-[#20232B] dark:text-[#F8FAFC] border-b border-[#E9EBF0] dark:border-[#222632] pb-2 mb-3">
                4. Cloud Storage, Retention and Automated Deletion
              </h2>
              <p className="mb-3">
                For files that you deliberately save to your Gyanvatsala cloud account, storage capacity and automated retention periods are defined as follows:
              </p>

              <div className="overflow-x-auto my-4 rounded-xl border border-[#E9EBF0] dark:border-[#28314A]">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F7F8FA] dark:bg-[#151926] text-[#20232B] dark:text-[#F8FAFC] font-bold border-b border-[#E9EBF0] dark:border-[#28314A]">
                      <th className="p-3">Plan</th>
                      <th className="p-3">Cloud Storage</th>
                      <th className="p-3">Retention Period</th>
                      <th className="p-3">Deletion Mechanism</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E9EBF0] dark:divide-[#28314A]">
                    <tr>
                      <td className="p-3 font-semibold text-[#536BCE]">Free Starter</td>
                      <td className="p-3">15 MB</td>
                      <td className="p-3">7 days</td>
                      <td className="p-3 text-[#159B75]">Automated lifecycle cleanup</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-[#536BCE]">Prime</td>
                      <td className="p-3">50 MB</td>
                      <td className="p-3">14 days</td>
                      <td className="p-3 text-[#159B75]">Automated lifecycle cleanup</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-[#536BCE]">PrimePlus</td>
                      <td className="p-3">100 MB</td>
                      <td className="p-3">30 days</td>
                      <td className="p-3 text-[#159B75]">Automated lifecycle cleanup</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-[#536BCE]">PrimeUltra</td>
                      <td className="p-3">500 MB</td>
                      <td className="p-3">365 days</td>
                      <td className="p-3 text-[#159B75]">Automated lifecycle cleanup</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-[#727783] dark:text-[#9DA3AE] mb-3">
                Retention periods are calculated from the file upload timestamp. When a file reaches the end of its retention window, automated workers purge the file data from storage vaults and index records. You may also delete your files manually at any time through your <Link href="/dashboard/files" className="text-[#536BCE] underline">Files Dashboard</Link>.
              </p>
            </section>

            {/* Section 5 */}
            <section id="privacy-section-5" className="scroll-mt-24">
              <h2 className="text-xl font-bold text-[#20232B] dark:text-[#F8FAFC] border-b border-[#E9EBF0] dark:border-[#222632] pb-2 mb-3">
                5. Legal Bases for Processing
              </h2>
              <p className="mb-2">We process personal information under the following legal grounds:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm mb-3">
                <li><strong>Contractual Necessity:</strong> To provide the document processing, workspace tools, account features, and subscription capabilities you request.</li>
                <li><strong>Consent:</strong> Where you voluntarily opt into optional services, sign up via Google OAuth, or contact support.</li>
                <li><strong>Legitimate Interests:</strong> To protect our infrastructure against cyber attacks, prevent abusive automated scraping, and ensure high platform availability.</li>
                <li><strong>Legal Compliance:</strong> To comply with applicable statutory, taxation, and regulatory mandates in India.</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section id="privacy-section-6" className="scroll-mt-24">
              <h2 className="text-xl font-bold text-[#20232B] dark:text-[#F8FAFC] border-b border-[#E9EBF0] dark:border-[#222632] pb-2 mb-3">
                6. Third-Party Service Providers
              </h2>
              <p className="mb-2">
                We engage trusted infrastructure and software providers to deliver our services:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm mb-3">
                <li><strong>Better Auth:</strong> Open-source authentication framework for session validation and security.</li>
                <li><strong>Google Identity:</strong> Optional federated sign-in provider for one-click account authentication.</li>
                <li><strong>Storage & Database Infrastructure:</strong> Encrypted cloud storage vaults (AWS S3) and serverless database pooling (Neon PostgreSQL) for account records.</li>
                <li><strong>Transactional Email:</strong> SMTP gateways for delivering verification one-time passwords (OTPs).</li>
              </ul>
              <p className="text-xs text-[#727783] dark:text-[#9DA3AE]">
                These providers are permitted to process information only as necessary to provide their infrastructure services under confidentiality agreements. We never sell your personal data or document contents to data brokers or third parties.
              </p>
            </section>

            {/* Section 7 */}
            <section id="privacy-section-7" className="scroll-mt-24">
              <h2 className="text-xl font-bold text-[#20232B] dark:text-[#F8FAFC] border-b border-[#E9EBF0] dark:border-[#222632] pb-2 mb-3">
                7. Cookies and Local Browser Storage
              </h2>
              <p className="mb-3">
                Gyanvatsala uses essential browser cookies and local storage items strictly necessary for website operation:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm mb-3">
                <li><strong>Authentication Tokens:</strong> Secure HTTP-only cookies to keep you signed into your workspace.</li>
                <li><strong>Theme Preference:</strong> Stored locally in your browser (<code className="font-mono text-xs">gyanvatsala-theme</code>) to preserve Light or Dark mode.</li>
                <li><strong>Offline File Staging:</strong> Temporary IndexedDB / RAM storage while you edit documents in Canvas Editor or Scan Studio.</li>
              </ul>
              <p className="text-xs font-semibold text-[#159B75]">
                We do not use third-party advertising tracking cookies or behavioral marketing trackers.
              </p>
            </section>

            {/* Section 8 */}
            <section id="privacy-section-8" className="scroll-mt-24">
              <h2 className="text-xl font-bold text-[#20232B] dark:text-[#F8FAFC] border-b border-[#E9EBF0] dark:border-[#222632] pb-2 mb-3">
                8. Data Security and Safeguards
              </h2>
              <p className="mb-3">
                We implement comprehensive administrative, physical and technical safeguards to protect your documents and personal data:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm mb-3">
                <li><strong>Encryption in Transit:</strong> All data exchanged with our servers is encrypted using Transport Layer Security (TLS 1.3 / HTTPS).</li>
                <li><strong>Encryption at Rest:</strong> Cloud files stored in private vaults are encrypted using industry-standard AES-256 encryption.</li>
                <li><strong>Access Control:</strong> Cloud storage buckets are non-public; downloads are generated via cryptographically signed URLs that expire automatically after a short duration.</li>
                <li><strong>No Plaintext Passwords:</strong> Credentials, if any, are salt-hashed using modern cryptographic algorithms.</li>
              </ul>
            </section>

            {/* Section 9 */}
            <section id="privacy-section-9" className="scroll-mt-24">
              <h2 className="text-xl font-bold text-[#20232B] dark:text-[#F8FAFC] border-b border-[#E9EBF0] dark:border-[#222632] pb-2 mb-3">
                9. Your Rights and Choices
              </h2>
              <p className="mb-2">Depending on applicable laws, you have the following rights regarding your personal information:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm mb-3">
                <li><strong>Access and Export:</strong> You can view and download all files saved to your cloud workspace at any time.</li>
                <li><strong>Rectification:</strong> You can update your profile name and email preferences in account settings.</li>
                <li><strong>Deletion & Account Erasure:</strong> You can permanently delete individual files or request complete account termination by contacting <a href="mailto:fileprocess@gyanvatsala.in" className="text-[#536BCE] underline">fileprocess@gyanvatsala.in</a>.</li>
                <li><strong>Revoking Permissions:</strong> If you authenticated via Google, you can revoke access anytime through your Google Account Security settings.</li>
              </ul>
            </section>

            {/* Section 10 */}
            <section id="privacy-section-10" className="scroll-mt-24">
              <h2 className="text-xl font-bold text-[#20232B] dark:text-[#F8FAFC] border-b border-[#E9EBF0] dark:border-[#222632] pb-2 mb-3">
                10. International Data Transfers
              </h2>
              <p className="mb-3">
                Gyanvatsala is operated from India. When you upload files to optional cloud services, data may be hosted on infrastructure providers located in India, the United States, or other jurisdictions where our cloud partners maintain data centers. We take reasonable measures to ensure appropriate safeguards are maintained.
              </p>
            </section>

            {/* Section 11 */}
            <section id="privacy-section-11" className="scroll-mt-24">
              <h2 className="text-xl font-bold text-[#20232B] dark:text-[#F8FAFC] border-b border-[#E9EBF0] dark:border-[#222632] pb-2 mb-3">
                11. Children&apos;s Privacy
              </h2>
              <p className="mb-3">
                Gyanvatsala is not directed toward children under 18 years of age without parental or guardian supervision. We do not knowingly collect personal information directly from minors without appropriate legal consent. If you believe a child has provided us with personal information without consent, please contact us immediately to have it purged.
              </p>
            </section>

            {/* Section 12 */}
            <section id="privacy-section-12" className="scroll-mt-24">
              <h2 className="text-xl font-bold text-[#20232B] dark:text-[#F8FAFC] border-b border-[#E9EBF0] dark:border-[#222632] pb-2 mb-3">
                12. Changes to this Privacy Policy
              </h2>
              <p className="mb-3">
                We may periodically update this Privacy Policy to reflect technical enhancements, security changes, or legal requirements. Updated versions will be published on this page with an updated &quot;Last Updated&quot; date. We encourage regular review of this policy.
              </p>
            </section>

            {/* Section 13 */}
            <section id="privacy-section-13" className="scroll-mt-24">
              <h2 className="text-xl font-bold text-[#20232B] dark:text-[#F8FAFC] border-b border-[#E9EBF0] dark:border-[#222632] pb-2 mb-3">
                13. Contact & Grievance Redressal
              </h2>
              <p className="mb-3">
                If you have questions, feedback, grievance inquiries, or requests regarding this Privacy Policy or your personal information, please contact:
              </p>
              <div className="p-5 rounded-2xl bg-[#F7F8FA] dark:bg-[#141824] border border-[#E9EBF0] dark:border-[#242B3E] text-xs font-mono space-y-1 mb-4">
                <p className="font-bold text-[#20232B] dark:text-[#F8FAFC]">Gyanvatsala Privacy & Grievance Desk</p>
                <p className="text-[#727783]">Attn: DIVYANSHU PRATAP SINGH (Service Operator)</p>
                <p>Email: <a href="mailto:fileprocess@gyanvatsala.in" className="text-[#536BCE] underline">fileprocess@gyanvatsala.in</a></p>
                <p>Website: <a href="https://www.gyanvatsala.in/" className="text-[#536BCE] underline">https://www.gyanvatsala.in/</a></p>
              </div>
              <p className="text-xs text-[#727783] dark:text-[#9DA3AE]">
                We aim to acknowledge privacy-related communications promptly and resolve legitimate inquiries in accordance with the applicable laws of India.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
