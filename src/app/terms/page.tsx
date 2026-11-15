'use client';

import React from 'react';
import Link from 'next/link';
import {
  FileText,
  ShieldCheck,
  Scale,
  Mail,
  Globe,
  ArrowRight,
  Clock,
  HardDrive,
  UserCheck,
  AlertCircle,
  HelpCircle,
  Lock,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0D1017] text-[#20232B] dark:text-[#F8FAFC] selection:bg-[#536BCE] selection:text-white transition-colors duration-150">
      <Header />

      <main className="flex-1 py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Metadata */}
          <div className="border-b border-[#E9EBF0] dark:border-[#222632] pb-8 mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EDF0FF] dark:bg-[#536BCE]/20 text-xs font-semibold text-[#536BCE] mb-4">
              <Scale className="w-3.5 h-3.5" />
              <span>Legal Agreement</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-[#20232B] dark:text-[#F8FAFC] tracking-tight">
              Terms and Conditions
            </h1>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-[#727783] dark:text-[#9DA3AE] mt-4 font-mono">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#536BCE]" />
                Effective Date: 15 November 2026
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#536BCE]" />
                Website: https://www.gyanvatsala.in/
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#536BCE]" />
                Contact: fileprocess@gyanvatsala.in
              </span>
            </div>
          </div>

          {/* Table of Contents Pill Bar */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#F7F8FA] dark:bg-[#141824] border border-[#E9EBF0] dark:border-[#242B3E] mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#727783] dark:text-[#9DA3AE] mb-3">
              Summary of Sections
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              {[
                { num: '1', title: 'Introduction & Operator' },
                { num: '2', title: 'Eligibility & Accounts' },
                { num: '3', title: 'Our Services' },
                { num: '4', title: 'User Files & Ownership' },
                { num: '5', title: 'Processing & Storage' },
                { num: '6', title: 'Subscriptions & Pricing' },
                { num: '7', title: 'Payments & Refunds' },
                { num: '8', title: 'Acceptable Use' },
                { num: '9', title: 'Processing Accuracy' },
                { num: '10', title: 'Intellectual Property' },
                { num: '11', title: 'Third-Party Services' },
                { num: '12', title: 'Service Availability' },
                { num: '13', title: 'Account Termination' },
                { num: '14', title: 'Privacy Information' },
                { num: '15', title: 'Limitation of Liability' },
                { num: '16', title: 'Indemnification' },
                { num: '17', title: 'Changes to Terms' },
                { num: '18', title: 'Governing Law' },
                { num: '19', title: 'Grievance Support' },
                { num: '20', title: 'General Provisions' },
              ].map((s) => (
                <a
                  key={s.num}
                  href={`#section-${s.num}`}
                  className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-[#1E2538] text-[#20232B] dark:text-[#CBD5E1] hover:text-[#536BCE] transition flex items-center gap-1.5"
                >
                  <span className="font-mono text-[#536BCE] font-bold">{s.num}.</span>
                  <span className="truncate">{s.title}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Terms Content Sections */}
          <div className="space-y-12 text-sm leading-relaxed text-[#20232B] dark:text-[#CBD5E1]">
            {/* Section 1 */}
            <section id="section-1" className="scroll-mt-24">
              <h2 className="text-xl font-bold text-[#20232B] dark:text-[#F8FAFC] border-b border-[#E9EBF0] dark:border-[#222632] pb-2 mb-3">
                1. Introduction
              </h2>
              <p className="mb-3">
                Welcome to Gyanvatsala (&quot;Gyanvatsala&quot;, &quot;we&quot;, &quot;our&quot; or &quot;us&quot;).
              </p>
              <p className="mb-3">
                Gyanvatsala is an online digital workspace that provides tools and services for working with documents, PDFs, images and other supported file formats.
              </p>
              <p className="mb-3">
                These Terms and Conditions govern your access to and use of our website, applications, tools, subscriptions and related services.
              </p>
              <p className="mb-3">
                By accessing or using Gyanvatsala, you agree to these Terms. If you do not agree, please do not use the services.
              </p>
              <div className="p-4 rounded-xl bg-[#EDF0FF]/60 dark:bg-[#536BCE]/15 border border-[#536BCE]/30 text-xs text-[#20232B] dark:text-[#F8FAFC]">
                <strong className="block font-bold text-[#536BCE] mb-1">Service Operator Notice:</strong>
                Gyanvatsala is operated by <strong>DIVYANSHU PRATAP SINGH</strong>, an individual operating from India. Gyanvatsala is a product/brand name and is not, by itself, a representation that the service is operated by an incorporated company.
              </div>
            </section>

            {/* Section 2 */}
            <section id="section-2" className="scroll-mt-24">
              <h2 className="text-xl font-bold text-[#20232B] dark:text-[#F8FAFC] border-b border-[#E9EBF0] dark:border-[#222632] pb-2 mb-3">
                2. Eligibility and User Accounts
              </h2>
              <p className="mb-3">
                You must be at least 18 years old to create an account and purchase a subscription independently. If you are below 18, you may use the service only with the involvement and permission of a parent or legal guardian, where permitted by applicable law.
              </p>
              <p className="mb-2 font-medium">When creating an account, you agree to:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm mb-3">
                <li>Provide accurate and current information.</li>
                <li>Keep your login credentials confidential.</li>
                <li>Not share your account in a way that circumvents plan restrictions.</li>
                <li>Notify us if you suspect unauthorized access.</li>
                <li>Keep your account information updated.</li>
              </ul>
              <p className="mb-3">
                You are responsible for activities performed through your account, except where unauthorized activity results from circumstances for which we are legally responsible.
              </p>
              <p>
                We may restrict or suspend accounts involved in fraud, abuse, security threats or serious violations of these Terms. Where reasonably possible, we will provide notice and an opportunity to resolve the issue.
              </p>
            </section>

            {/* Section 3 */}
            <section id="section-3" className="scroll-mt-24">
              <h2 className="text-xl font-bold text-[#20232B] dark:text-[#F8FAFC] border-b border-[#E9EBF0] dark:border-[#222632] pb-2 mb-3">
                3. Our Services
              </h2>
              <p className="mb-2">Gyanvatsala may provide tools and features including:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm mb-3">
                <li>PDF creation, editing, conversion, compression, merging and splitting.</li>
                <li>Document conversion and extraction.</li>
                <li>Image resizing, compression and format conversion.</li>
                <li>Scan Studio and document appearance adjustments.</li>
                <li>Canvas Editor and document annotations.</li>
                <li>Other file-processing and productivity features introduced from time to time.</li>
              </ul>
              <p className="mb-3">
                Available tools, supported file formats and processing limits may vary. Some features may be available without registration, while other features may require an account or an eligible subscription.
              </p>
              <p>
                We may introduce, improve, modify or discontinue individual features as our platform develops. We will make reasonable efforts to avoid unnecessary disruption to existing paid services.
              </p>
            </section>

            {/* Section 4 */}
            <section id="section-4" className="scroll-mt-24">
              <h2 className="text-xl font-bold text-[#20232B] dark:text-[#F8FAFC] border-b border-[#E9EBF0] dark:border-[#222632] pb-2 mb-3">
                4. User Files and Ownership
              </h2>
              <p className="mb-3">
                You retain ownership of the documents, images and other files that you upload or process through Gyanvatsala. You do not transfer ownership of your content to us by using our services.
              </p>
              <p className="mb-2 font-medium">By uploading or submitting a file, you confirm that:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm mb-3">
                <li>You own the file or have the necessary permission to use and process it.</li>
                <li>Your use of the file does not violate another person&apos;s intellectual property, privacy or other legal rights.</li>
                <li>You are legally permitted to perform the requested processing.</li>
              </ul>
              <p className="mb-3">
                You grant Gyanvatsala only the limited permission necessary to receive, process, transmit, temporarily store and return your files for the purpose of providing the requested service.
              </p>
              <p>
                We do not claim ownership of your original documents or processed outputs. You are responsible for maintaining your own copies of important documents.
              </p>
            </section>

            {/* Section 5 */}
            <section id="section-5" className="scroll-mt-24">
              <h2 className="text-xl font-bold text-[#20232B] dark:text-[#F8FAFC] border-b border-[#E9EBF0] dark:border-[#222632] pb-2 mb-3">
                5. File Processing and Storage
              </h2>
              <h3 className="font-bold text-base mt-3 mb-1">5.1 Local browser processing</h3>
              <p className="mb-3">
                Where a tool supports local processing, your files are processed within your browser or on your device. Files processed locally are not automatically saved to Gyanvatsala cloud storage merely because you use the tool. However, certain supporting services, account features or optional operations may involve data transmission. The applicable processing method will depend on the feature being used.
              </p>

              <h3 className="font-bold text-base mt-4 mb-1">5.2 Cloud processing and cloud storage</h3>
              <p className="mb-3">
                Some services may require files to be transmitted to our servers or temporarily stored to complete the requested operation. Cloud storage is optional where the product provides a choice to download a result without saving it to your account. If you choose to save a file to your cloud account, it will count towards your plan&apos;s storage allowance and applicable retention period.
              </p>

              <h3 className="font-bold text-base mt-4 mb-1">5.3 Storage allowances and retention</h3>
              <p className="mb-3">The currently planned subscription allowances are:</p>
              <div className="overflow-x-auto my-4 rounded-xl border border-[#E9EBF0] dark:border-[#28314A]">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F7F8FA] dark:bg-[#151926] text-[#20232B] dark:text-[#F8FAFC] font-bold border-b border-[#E9EBF0] dark:border-[#28314A]">
                      <th className="p-3">Plan</th>
                      <th className="p-3">Cloud Storage</th>
                      <th className="p-3">Retention Period</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E9EBF0] dark:divide-[#28314A]">
                    <tr>
                      <td className="p-3 font-semibold text-[#536BCE]">Free Starter</td>
                      <td className="p-3">15 MB</td>
                      <td className="p-3">7 days</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-[#536BCE]">Prime</td>
                      <td className="p-3">50 MB</td>
                      <td className="p-3">14 days</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-[#536BCE]">PrimePlus</td>
                      <td className="p-3">100 MB</td>
                      <td className="p-3">30 days</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-[#536BCE]">PrimeUltra</td>
                      <td className="p-3">500 MB</td>
                      <td className="p-3">365 days</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-[#727783] dark:text-[#9DA3AE] mb-3">
                These limits refer to the cloud storage and retention features of the applicable plans. They do not automatically mean that every locally processed file is uploaded or retained by us. Retention periods are measured from the applicable file upload or save date, as displayed in the product.
              </p>
              <p className="mb-3">
                Files may be automatically deleted when their retention period expires. We may provide advance notifications where the relevant system supports them, but you remain responsible for downloading important files before their expiry.
              </p>
              <p className="mb-3">
                We will make reasonable efforts to delete expired files and associated storage records in accordance with our retention procedures. Technical delays, backups and legal obligations may affect the timing of complete deletion.
              </p>

              <h3 className="font-bold text-base mt-4 mb-1">5.4 Storage limits</h3>
              <p>
                You agree not to exceed the storage allowance associated with your plan. If your storage limit is reached, we may prevent additional cloud uploads or saves until you free up space or become eligible for a higher allowance. We will not automatically charge you for an upgrade without your authorization.
              </p>
            </section>

            {/* Section 6 */}
            <section id="section-6" className="scroll-mt-24">
              <h2 className="text-xl font-bold text-[#20232B] dark:text-[#F8FAFC] border-b border-[#E9EBF0] dark:border-[#222632] pb-2 mb-3">
                6. Subscriptions and Pricing
              </h2>
              <p className="mb-3">
                Gyanvatsala may offer free and paid subscription plans. The available plans, prices, features, storage allowances and billing periods will be displayed on the Pricing page or during checkout. Paid subscriptions may include additional storage, extended retention, processing capabilities or other benefits.
              </p>
              <p className="mb-2"><strong>6.1 Free plan:</strong> The Free Starter plan may be used subject to its published limits and applicable usage restrictions.</p>
              <p className="mb-2"><strong>6.2 Paid plans:</strong> A paid subscription becomes active only after the payment has been successfully processed and verified by our payment system. Selecting a plan, clicking an upgrade button or beginning checkout does not by itself activate a paid subscription. If payment functionality is not yet available for a particular plan, the displayed plan information is informational and no paid subscription can be purchased through that unavailable checkout.</p>
              <p className="mb-2"><strong>6.3 Billing:</strong> The billing frequency, price and applicable taxes will be shown before you confirm a purchase. You authorize the applicable payment provider to process the payment you initiate. We do not store your full card number, CVV or UPI PIN on our servers. Payment credentials are handled by the applicable payment provider.</p>
              <p className="mb-2"><strong>6.4 Plan changes:</strong> Upgrades and downgrades are subject to availability and the applicable billing rules. A plan change will take effect only after the required confirmation and payment verification, where payment is necessary. If you downgrade, your available storage allowance and retention benefits may change. We will communicate relevant consequences before the change takes effect wherever reasonably possible.</p>
              <p><strong>6.5 Pricing changes:</strong> We may revise subscription prices or features for future purchases and renewals. Changes will not retroactively alter a payment already completed for an existing billing period. Where applicable, we will notify customers of material changes before the next renewal.</p>
            </section>

            {/* Section 7 */}
            <section id="section-7" className="scroll-mt-24">
              <h2 className="text-xl font-bold text-[#20232B] dark:text-[#F8FAFC] border-b border-[#E9EBF0] dark:border-[#222632] pb-2 mb-3">
                7. Payments, Cancellations and Refunds
              </h2>
              <p className="mb-3">
                Payments may be processed through third-party payment providers. The payment provider&apos;s checkout and payment terms may also apply to your transaction. You are responsible for reviewing the amount, plan and billing period before confirming payment.
              </p>
              <p className="mb-3">
                If a payment fails, is reversed or remains unverified, the associated paid subscription may not be activated or may be restricted until the payment status is resolved.
              </p>
              <p className="mb-3">
                Cancellation of an automatically renewing subscription will stop future renewals according to the applicable billing process. Cancellation does not necessarily mean that an already-paid billing period ends immediately.
              </p>
              <p>
                Refund requests will be handled in accordance with our separate Refund and Cancellation Policy and applicable consumer protection laws. Nothing in these Terms removes any refund, cancellation or consumer rights that cannot legally be excluded.
              </p>
            </section>

            {/* Section 8 */}
            <section id="section-8" className="scroll-mt-24">
              <h2 className="text-xl font-bold text-[#20232B] dark:text-[#F8FAFC] border-b border-[#E9EBF0] dark:border-[#222632] pb-2 mb-3">
                8. Acceptable Use
              </h2>
              <p className="mb-2 font-medium">You agree to use Gyanvatsala only for lawful purposes. You must not:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm mb-3">
                <li>Upload malware, viruses or files designed to compromise systems.</li>
                <li>Attempt unauthorized access to our website, servers, accounts or APIs.</li>
                <li>Interfere with the operation or security of our services.</li>
                <li>Use automated scripts, bots or scraping tools in ways that overload or abuse our infrastructure.</li>
                <li>Circumvent subscription limits, access controls or usage restrictions.</li>
                <li>Use our services to violate copyright, trademark, privacy or other legal rights.</li>
                <li>Process content that is unlawful or that you are not authorized to use.</li>
                <li>Use the platform for fraud, impersonation or other unlawful activity.</li>
                <li>Reverse engineer, exploit or disrupt our systems except where applicable law expressly permits it.</li>
              </ul>
              <p>
                We may investigate suspected misuse and take reasonable measures to protect our users and infrastructure.
              </p>
            </section>

            {/* Section 9 */}
            <section id="section-9" className="scroll-mt-24">
              <h2 className="text-xl font-bold text-[#20232B] dark:text-[#F8FAFC] border-b border-[#E9EBF0] dark:border-[#222632] pb-2 mb-3">
                9. Processing Accuracy and User Responsibility
              </h2>
              <p className="mb-3">
                Although we aim to provide useful and reliable file-processing tools, results may vary depending on the original file, format, quality, structure, fonts, images and other technical characteristics.
              </p>
              <p className="mb-2">For example:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm mb-3">
                <li>PDF-to-Word conversion may not preserve every font, layout or formatting element.</li>
                <li>OCR may misread text in low-quality or handwritten documents.</li>
                <li>Image compression may reduce image quality.</li>
                <li>Scanning effects may change the visual appearance of a document.</li>
                <li>Some files may be unsupported, corrupted or password-protected.</li>
              </ul>
              <p>
                You should review the resulting file before using, sharing, printing or submitting it for official purposes. Gyanvatsala does not guarantee that every output will be identical to its source or suitable for every professional, legal, academic or regulatory requirement.
              </p>
            </section>

            {/* Section 10 */}
            <section id="section-10" className="scroll-mt-24">
              <h2 className="text-xl font-bold text-[#20232B] dark:text-[#F8FAFC] border-b border-[#E9EBF0] dark:border-[#222632] pb-2 mb-3">
                10. Intellectual Property
              </h2>
              <p className="mb-3">
                The Gyanvatsala name, branding, website design, software, source code, graphics, logos, interface elements and original platform content are owned by or licensed to the service operator, unless otherwise stated.
              </p>
              <p className="mb-3">
                You may not copy, reproduce, distribute, sell, modify or commercially exploit our proprietary materials without permission.
              </p>
              <p>
                Your own uploaded files and documents remain yours, subject to the limited processing permission described in these Terms.
              </p>
            </section>

            {/* Section 11 */}
            <section id="section-11" className="scroll-mt-24">
              <h2 className="text-xl font-bold text-[#20232B] dark:text-[#F8FAFC] border-b border-[#E9EBF0] dark:border-[#222632] pb-2 mb-3">
                11. Third-Party Services
              </h2>
              <p className="mb-2">Gyanvatsala may use third-party providers for services such as:</p>
              <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm mb-3">
                <li>Hosting and infrastructure.</li>
                <li>Authentication and account management.</li>
                <li>Email delivery.</li>
                <li>Payment processing.</li>
                <li>Cloud storage.</li>
                <li>Analytics and error monitoring.</li>
              </ul>
              <p className="mb-3">
                These providers may process information necessary to provide their services. Third-party services are governed by their own terms and privacy policies.
              </p>
              <p>
                We are not responsible for independent third-party services beyond responsibilities imposed on us by applicable law.
              </p>
            </section>

            {/* Section 12 */}
            <section id="section-12" className="scroll-mt-24">
              <h2 className="text-xl font-bold text-[#20232B] dark:text-[#F8FAFC] border-b border-[#E9EBF0] dark:border-[#222632] pb-2 mb-3">
                12. Service Availability and Maintenance
              </h2>
              <p className="mb-3">
                We aim to keep Gyanvatsala available and functional, but uninterrupted service cannot be guaranteed. Access may occasionally be affected by scheduled maintenance, security updates, server or network failures, third-party provider outages, unexpected technical issues, or events outside our reasonable control.
              </p>
              <p>
                We will make reasonable efforts to restore affected services and communicate significant disruptions where appropriate. We do not promise a particular uptime percentage unless expressly stated in a separate written service agreement.
              </p>
            </section>

            {/* Section 13 */}
            <section id="section-13" className="scroll-mt-24">
              <h2 className="text-xl font-bold text-[#20232B] dark:text-[#F8FAFC] border-b border-[#E9EBF0] dark:border-[#222632] pb-2 mb-3">
                13. Suspension and Account Termination
              </h2>
              <p className="mb-3">
                You may stop using Gyanvatsala at any time. You may request account closure by contacting <a href="mailto:fileprocess@gyanvatsala.in" className="text-[#536BCE] underline">fileprocess@gyanvatsala.in</a> or through an available account-management feature.
              </p>
              <p className="mb-2">We may suspend or terminate access where:</p>
              <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm mb-3">
                <li>You materially violate these Terms.</li>
                <li>Your account is involved in fraud or unlawful activity.</li>
                <li>Your use creates a serious security or operational risk.</li>
                <li>We are legally required to restrict access.</li>
                <li>Continued provision of a particular service becomes technically or commercially impracticable.</li>
              </ul>
              <p className="mb-3">
                Where appropriate, we will provide notice and an opportunity to resolve the issue. Termination does not remove payment obligations already lawfully incurred or rights that accrued before termination.
              </p>
              <p>
                File deletion and retention after account closure will follow our Privacy Policy and applicable retention requirements.
              </p>
            </section>

            {/* Section 14 */}
            <section id="section-14" className="scroll-mt-24">
              <h2 className="text-xl font-bold text-[#20232B] dark:text-[#F8FAFC] border-b border-[#E9EBF0] dark:border-[#222632] pb-2 mb-3">
                14. Privacy and Personal Information
              </h2>
              <p className="mb-3">
                Your use of Gyanvatsala is also governed by our Privacy Policy. The Privacy Policy explains what personal information we collect, how account and payment-related information is handled, how uploaded files are processed, when files may be stored or deleted, how third-party providers are involved, and how users can contact us regarding their personal information.
              </p>
              <p>
                Please review the Privacy Policy before using services that require uploading or saving files.
              </p>
            </section>

            {/* Section 15 */}
            <section id="section-15" className="scroll-mt-24">
              <h2 className="text-xl font-bold text-[#20232B] dark:text-[#F8FAFC] border-b border-[#E9EBF0] dark:border-[#222632] pb-2 mb-3">
                15. Limitation of Liability
              </h2>
              <p className="mb-3">
                To the maximum extent permitted by applicable law, Gyanvatsala will not be liable for indirect, incidental, special or consequential losses arising from your use of the service, including loss of business opportunities, profits or data, where such exclusions are legally permitted.
              </p>
              <p className="mb-3">
                We do not guarantee that every file-processing operation will be error-free or that every output will satisfy a particular requirement. You should maintain independent backups of important files and verify processed outputs.
              </p>
              <p>
                Nothing in these Terms excludes or limits liability that cannot legally be excluded or limited, including liability for fraud, wilful misconduct, or any non-excludable statutory consumer rights. Where liability can legally be limited, the extent of that limitation will be determined under applicable law and the circumstances of the claim.
              </p>
            </section>

            {/* Section 16 */}
            <section id="section-16" className="scroll-mt-24">
              <h2 className="text-xl font-bold text-[#20232B] dark:text-[#F8FAFC] border-b border-[#E9EBF0] dark:border-[#222632] pb-2 mb-3">
                16. Indemnification
              </h2>
              <p className="mb-3">
                To the extent permitted by applicable law, you agree to be responsible for losses, claims and reasonable expenses directly arising from your unlawful use of Gyanvatsala, your infringement of another person&apos;s rights or your material violation of these Terms.
              </p>
              <p>
                This provision does not require you to indemnify us for losses caused by our own unlawful conduct, negligence or breach of obligations that cannot legally be excluded.
              </p>
            </section>

            {/* Section 17 */}
            <section id="section-17" className="scroll-mt-24">
              <h2 className="text-xl font-bold text-[#20232B] dark:text-[#F8FAFC] border-b border-[#E9EBF0] dark:border-[#222632] pb-2 mb-3">
                17. Changes to These Terms
              </h2>
              <p className="mb-3">
                We may update these Terms to reflect changes in our services, security requirements, payment processes or applicable laws. The revised version will be published on this website with an updated Effective Date.
              </p>
              <p className="mb-3">
                For material changes affecting existing paid subscriptions or user rights, we will provide notice where required by law or reasonably appropriate.
              </p>
              <p>
                Your continued use after an updated version takes effect constitutes acceptance only to the extent permitted by applicable law. If you do not agree with a material change, you may stop using the affected services and contact us regarding your account or subscription.
              </p>
            </section>

            {/* Section 18 */}
            <section id="section-18" className="scroll-mt-24">
              <h2 className="text-xl font-bold text-[#20232B] dark:text-[#F8FAFC] border-b border-[#E9EBF0] dark:border-[#222632] pb-2 mb-3">
                18. Governing Law and Disputes
              </h2>
              <p className="mb-3">
                These Terms are governed by the laws of India. We encourage users to contact us first so that complaints and disputes can be addressed through a reasonable support process.
              </p>
              <p className="mb-3">
                Nothing in this section prevents you from approaching a competent consumer commission, court, regulator or other authority where you have a legal right to do so.
              </p>
              <p>
                Any court proceedings will be subject to the jurisdiction of the courts legally competent to hear the matter under applicable Indian law.
              </p>
            </section>

            {/* Section 19 */}
            <section id="section-19" className="scroll-mt-24">
              <h2 className="text-xl font-bold text-[#20232B] dark:text-[#F8FAFC] border-b border-[#E9EBF0] dark:border-[#222632] pb-2 mb-3">
                19. Contact and Grievance Support
              </h2>
              <p className="mb-3">
                For questions, complaints, payment concerns, account issues or requests relating to these Terms, contact:
              </p>
              <div className="p-4 rounded-xl bg-[#F7F8FA] dark:bg-[#141824] border border-[#E9EBF0] dark:border-[#242B3E] text-xs font-mono space-y-1 mb-3">
                <p className="font-bold text-[#20232B] dark:text-[#F8FAFC]">Gyanvatsala Support</p>
                <p>Email: <a href="mailto:fileprocess@gyanvatsala.in" className="text-[#536BCE] underline">fileprocess@gyanvatsala.in</a></p>
                <p>Website: <a href="https://www.gyanvatsala.in/" className="text-[#536BCE] underline">https://www.gyanvatsala.in/</a></p>
              </div>
              <p className="mb-3">
                Please include relevant details about your issue, but do not send passwords, OTPs, full payment card details or other sensitive authentication information.
              </p>
              <p>
                We aim to acknowledge complaints within a reasonable time and address them as promptly as possible, in accordance with applicable legal requirements.
              </p>
            </section>

            {/* Section 20 */}
            <section id="section-20" className="scroll-mt-24">
              <h2 className="text-xl font-bold text-[#20232B] dark:text-[#F8FAFC] border-b border-[#E9EBF0] dark:border-[#222632] pb-2 mb-3">
                20. General Provisions
              </h2>
              <p className="mb-3">
                If any provision of these Terms is found unenforceable, the remaining provisions will continue to apply to the extent legally permitted. Our failure to enforce a provision immediately does not mean that we waive our right to enforce it later.
              </p>
              <p className="mb-6">
                These Terms, together with the Privacy Policy, Refund and Cancellation Policy and any applicable service-specific terms, form the agreement governing your use of Gyanvatsala.
              </p>

              <div className="p-5 rounded-2xl bg-[#F7F8FA] dark:bg-[#141824] border border-[#E9EBF0] dark:border-[#242B3E] text-xs space-y-1 font-mono">
                <p className="font-bold text-[#536BCE]">Gyanvatsala</p>
                <p className="text-[#727783]">Your Digital Document Workspace</p>
                <p>Website: <a href="https://www.gyanvatsala.in/" className="text-[#536BCE] underline">https://www.gyanvatsala.in/</a></p>
                <p>Support: <a href="mailto:fileprocess@gyanvatsala.in" className="text-[#536BCE] underline">fileprocess@gyanvatsala.in</a></p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
