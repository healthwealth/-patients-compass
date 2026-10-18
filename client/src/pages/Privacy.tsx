import SEO from "@/components/SEO";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Activity, ArrowLeft, Shield } from "lucide-react";

const SECTIONS = [
  {
    title: "1. Introduction",
    content: `The Patient's Compass Health Intelligence System ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website at thepatientscompass.com and use our platform services.

Please read this policy carefully. If you disagree with its terms, please discontinue use of the platform. We reserve the right to make changes to this policy at any time. We will alert you about any changes by updating the "Last Updated" date at the top of this page.`,
  },
  {
    title: "2. Information We Collect",
    content: `We collect information you voluntarily provide when you:

• Create an account (email address, display name)
• Upload or paste lab report text for analysis
• Log biomarker readings to your health history
• Submit the contact form
• Subscribe to our newsletter

We also automatically collect limited technical data including browser type, operating system, pages visited, and time spent on pages through anonymized analytics. We do not use tracking cookies for advertising purposes.

We do not collect Social Security numbers, government ID numbers, insurance information, or any financial data beyond what is processed through our payment provider (if applicable).`,
  },
  {
    title: "3. How We Use Your Information",
    content: `We use the information we collect to:

• Provide, operate, and maintain the platform
• Process and display your lab report analyses
• Store your biomarker history and trend data in your personal Dashboard
• Send you transactional emails (account confirmation, support responses)
• Send you the newsletter if you subscribed (you may unsubscribe at any time)
• Improve platform features and user experience through aggregated, anonymized analytics
• Respond to your support requests and inquiries
• Comply with applicable laws and regulations

We do not sell, rent, trade, or otherwise share your personal health data with third parties for marketing or advertising purposes.`,
  },
  {
    title: "4. Data Storage and Security",
    content: `Your data is stored in encrypted databases hosted on secure cloud infrastructure. We apply industry-standard security measures including:

• Encryption of data in transit (TLS/HTTPS)
• Encrypted database storage
• Access controls limiting who can view your data
• Regular security reviews

While we implement these safeguards, no method of electronic transmission or storage is 100% secure. We cannot guarantee absolute security, and you use the platform at your own risk. If you believe your account has been compromised, contact us immediately at privacy@thepatientscompass.com.`,
  },
  {
    title: "5. Health Information Disclaimer",
    content: `The Patient's Compass is an educational platform, not a healthcare provider, health plan, or healthcare clearinghouse. HIPAA may not apply to information processed as part of our general direct-to-consumer educational services. Other federal and state consumer-health privacy laws may still apply.

If we perform a service for a HIPAA-covered partner that involves creating, receiving, maintaining, or transmitting protected health information on that partner's behalf, we will handle that information according to the applicable Business Associate Agreement and HIPAA requirements. We apply privacy and security safeguards to health-related information and do not disclose it except as described in this policy.

We strongly recommend that you do not include highly sensitive health information (such as HIV status, mental health diagnoses, or substance use history) in your lab report uploads or contact form messages.`,
  },
  {
    title: "6. Cookies and Tracking",
    content: `We use strictly necessary cookies to maintain your login session. We do not use third-party advertising cookies or cross-site tracking technologies.

We use anonymized, privacy-respecting analytics to understand how users interact with the platform in aggregate. This data cannot be used to identify individual users.

You may disable cookies in your browser settings, but this will prevent you from staying logged in to your account.`,
  },
  {
    title: "7. Third-Party Services",
    content: `We use the following third-party services to operate the platform:

• Authentication: Secure OAuth (session management)
• Database: Encrypted cloud database (data storage)
• AI Analysis: Large language model APIs (lab report analysis — your data is not used to train AI models)
• Analytics: Privacy-respecting, anonymized analytics

Each third-party service is bound by its own privacy policy. We select partners who meet our standards for data privacy and security.`,
  },
  {
    title: "8. Your Rights and Choices",
    content: `You have the following rights regarding your personal data:

• Access: Request a copy of the personal data we hold about you
• Correction: Request correction of inaccurate data
• Deletion: Request deletion of your account and all associated data
• Portability: Request an export of your data in a machine-readable format
• Opt-out: Unsubscribe from marketing emails at any time using the link in any email

To exercise any of these rights, email privacy@thepatientscompass.com. We will respond within 30 days. We may need to verify your identity before processing your request.`,
  },
  {
    title: "9. Children's Privacy",
    content: `The Patient's Compass is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected personal data from a child under 18 without parental consent, we will take steps to delete that information promptly.

If you believe we have inadvertently collected information from a child, please contact us at privacy@thepatientscompass.com.`,
  },
  {
    title: "10. Licensed Care Connections — Planned Feature",
    content: `If Licensed Care Connections becomes available, we may process limited information needed to display eligible independent partner options or initiate a connection, such as your account identifier, contact information, state or jurisdiction, selected service category, selected partner, referral timestamp, and records of notices or authorizations shown to you.

Our recommended initial implementation will not transmit your lab results, uploaded documents, symptoms, diagnoses, medications, AI conversations, or biomarker history to a partner. You will enter clinical information directly in the partner-operated environment after reviewing that partner's privacy notice and consent forms.

If a future workflow supports transferring health information, we will present a separate authorization identifying the recipient, data categories, purpose, and your available choices before transfer. We will not place health information in referral URLs, advertising pixels, or general-purpose analytics. Independent partners govern information you submit directly to them under their own privacy notices and, where applicable, HIPAA Notices of Privacy Practices.`,
  },
  {
    title: "11. Changes to This Policy",
    content: `We may update this Privacy Policy from time to time. We will notify you of any material changes by updating the "Last Updated" date at the top of this page and, where appropriate, by sending an email notification to registered users.

Your continued use of the platform after any changes constitutes your acceptance of the updated policy.`,
  },
  {
    title: "12. Contact Us",
    content: `If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:

Email: privacy@thepatientscompass.com
General support: support@thepatientscompass.com
Website: thepatientscompass.com/contact

The Patient's Compass Health Intelligence System`,
  },
];

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#F9F6F0] text-[#2C2A29]">
      <SEO
        title="Privacy Policy"
        description="Learn how The Patient's Compass collects, uses, and protects your personal health data. Your privacy is our priority."
        path="/privacy"
      />
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#F9F6F0]/90 backdrop-blur-md border-b border-[#EBE6DC]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="bg-[#7E9A85] text-white p-2 rounded-xl shadow-sm">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-base tracking-tight">The Patient's Compass</span>
                <p className="text-[10px] text-[#7E9A85] font-semibold tracking-wider uppercase">Health Intelligence System</p>
              </div>
            </div>
          </Link>
          <Link href="/">
            <button className="flex items-center gap-2 text-sm text-[#5C5A59] hover:text-[#2C2A29] transition-colors font-medium">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 border-b border-[#EBE6DC] bg-white">
        <div className="max-w-3xl mx-auto px-4 text-center space-y-4">
          <div className="bg-[#7E9A85]/10 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto text-[#7E9A85]">
            <Shield className="w-7 h-7" />
          </div>
          <Badge className="bg-[#7E9A85]/10 text-[#7E9A85] border-none px-3 py-1 rounded-full text-xs font-semibold">
            Legal
          </Badge>
          <h1 className="text-4xl font-serif font-bold text-[#2C2A29]">Privacy Policy</h1>
          <p className="text-sm text-[#9E9A90] font-medium">Last Updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
          <p className="text-base text-[#5C5A59] leading-relaxed max-w-xl mx-auto">
            We are committed to protecting your privacy. This policy explains how we collect, use, and safeguard your information.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 space-y-10">
          {SECTIONS.map((section, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-[#EBE6DC] p-6 sm:p-8 shadow-sm space-y-4">
              <h2 className="text-lg font-serif font-bold text-[#2C2A29]">{section.title}</h2>
              <div className="text-sm text-[#5C5A59] leading-relaxed whitespace-pre-line">{section.content}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#2C2A29] text-[#EBE6DC] py-8 border-t border-[#3D3A39]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#9E9A90]">
          <p>© {new Date().getFullYear()} The Patient's Compass. All rights reserved.</p>
          <p>Educational Content Only — Not Medical Advice</p>
          <div className="flex gap-4 font-medium">
            <Link href="/terms"><span className="hover:text-white cursor-pointer transition-colors">Terms</span></Link>
            <Link href="/faq"><span className="hover:text-white cursor-pointer transition-colors">FAQ</span></Link>
            <Link href="/contact"><span className="hover:text-white cursor-pointer transition-colors">Contact</span></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
