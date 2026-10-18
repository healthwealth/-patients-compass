import SEO from "@/components/SEO";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Activity, ArrowLeft, FileText } from "lucide-react";

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    content: `By accessing or using The Patient's Compass Health Intelligence System ("the Platform") at thepatientscompass.com, you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the Platform.

We reserve the right to update these Terms at any time. Continued use of the Platform after changes are posted constitutes your acceptance of the revised Terms. The date of the most recent revision is noted at the top of this page.`,
  },
  {
    title: "2. Educational Purpose — Not Medical Advice",
    content: `THE PATIENT'S COMPASS IS AN EDUCATIONAL PLATFORM ONLY. ALL CONTENT, TOOLS, AI RESPONSES, BIOMARKER ANALYSES, DOCTOR'S LETTERS, WELLNESS RECOMMENDATIONS, AND TREND INTERPRETATIONS ARE PROVIDED FOR INFORMATIONAL AND EDUCATIONAL PURPOSES ONLY.

Nothing on this Platform constitutes medical advice, diagnosis, treatment, or a substitute for consultation with a licensed healthcare provider. You should always seek the advice of your physician or other qualified health professional with any questions you may have regarding a medical condition.

Never disregard professional medical advice or delay seeking it because of something you have read or received from this Platform. If you think you may have a medical emergency, call your doctor or emergency services immediately.`,
  },
  {
    title: "3. Eligibility and Account Registration",
    content: `You must be at least 18 years of age to use this Platform. By using the Platform, you represent and warrant that you are 18 or older.

To access certain features, you must create an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.

You agree to notify us immediately of any unauthorized use of your account at support@thepatientscompass.com.`,
  },
  {
    title: "4. Permitted Use",
    content: `You may use the Platform solely for your own personal, non-commercial educational purposes. You agree not to:

• Use the Platform for any unlawful purpose or in violation of any applicable law
• Attempt to gain unauthorized access to any part of the Platform or its infrastructure
• Upload, transmit, or distribute malicious code, viruses, or harmful content
• Scrape, crawl, or systematically extract data from the Platform without written permission
• Impersonate any person or entity or misrepresent your affiliation with any person or entity
• Use the Platform to provide medical advice to others or to operate a healthcare practice
• Reverse-engineer, decompile, or disassemble any part of the Platform
• Use automated tools to interact with the Platform in a manner that places excessive load on our servers`,
  },
  {
    title: "5. Intellectual Property",
    content: `All content on the Platform — including but not limited to text, graphics, logos, icons, images, audio clips, digital downloads, data compilations, and software — is the property of The Patient's Compass or its content suppliers and is protected by applicable intellectual property laws.

The books "The Patient's Compass" and "Your Chronic Disease Lab Guide," the Patient's Compass Method™, and all associated educational materials are the exclusive intellectual property of the author and publisher. Reproduction, distribution, or commercial use of any content without express written permission is strictly prohibited.

You retain ownership of any lab report text you upload. By uploading content, you grant us a limited, non-exclusive license to process and display that content solely to provide you with the Platform's services.`,
  },
  {
    title: "6. AI-Generated Content Disclaimer",
    content: `The Platform uses artificial intelligence to generate educational content, biomarker interpretations, wellness recommendations, and physician preparation letters. You acknowledge and agree that:

• AI-generated content may contain errors, inaccuracies, or outdated information
• AI responses are not reviewed by a licensed healthcare professional before delivery
• AI-generated doctor's letters are templates for educational discussion only and do not constitute medical documentation
• You should independently verify any health information before acting on it
• The AI models used may have knowledge cutoff dates and may not reflect the latest medical research

We make no warranty regarding the accuracy, completeness, or suitability of AI-generated content for any particular purpose.`,
  },
  {
    title: "7. Limitation of Liability",
    content: `TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, THE PATIENT'S COMPASS, ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:

(a) Your use of or inability to use the Platform;
(b) Any content obtained from the Platform;
(c) Any health decisions made based on Platform content;
(d) Unauthorized access to or alteration of your data;
(e) Any other matter relating to the Platform.

IN NO EVENT SHALL OUR TOTAL LIABILITY EXCEED THE AMOUNT YOU PAID US IN THE TWELVE MONTHS PRECEDING THE CLAIM, OR $100, WHICHEVER IS GREATER.`,
  },
  {
    title: "8. Disclaimer of Warranties",
    content: `THE PLATFORM IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT ANY WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.

We do not warrant that the Platform will be uninterrupted, error-free, or free of viruses or other harmful components. We do not warrant the accuracy, completeness, or usefulness of any information on the Platform.`,
  },
  {
    title: "9. Termination",
    content: `We reserve the right to suspend or terminate your account and access to the Platform at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users, us, third parties, or the integrity of the Platform.

You may terminate your account at any time by contacting us at support@thepatientscompass.com. Upon termination, your right to use the Platform will immediately cease.`,
  },
  {
    title: "10. Governing Law",
    content: `These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts located in the United States.`,
  },
  {
    title: "11. Licensed Care Connections — Planned Feature",
    content: `If made available, Licensed Care Connections may help users identify or connect with independent, third-party healthcare professionals or telehealth services. The Patient's Compass provides education and navigation only and does not itself provide medical care, form a provider-patient relationship, make clinical decisions, prescribe, bill for clinical services, or guarantee provider availability or outcomes.

Independent providers and telehealth partners are responsible for their own licensure, eligibility, informed consent, clinical services, medical records, billing, privacy practices, and compliance. Their terms and policies apply when you enter their service. No Patient's Compass health content will be shared by default. Any future data-transfer workflow will identify the recipient and data categories and request separate authorization before transfer.

Licensed Care Connections is not an emergency service. Call 911 or your local emergency number for urgent or life-threatening symptoms. In the United States, call or text 988 for mental-health crisis support.`,
  },
  {
    title: "12. Contact Information",
    content: `If you have any questions about these Terms of Service, please contact us:

Email: support@thepatientscompass.com
Privacy inquiries: privacy@thepatientscompass.com
General inquiries: info@thepatientscompass.com
Website: thepatientscompass.com/contact

The Patient's Compass Health Intelligence System`,
  },
];

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#F9F6F0] text-[#2C2A29]">
      <SEO
        title="Terms of Service"
        description="Read the Terms of Service for The Patient's Compass. Understand your rights and responsibilities when using our platform."
        path="/terms"
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
          <div className="bg-[#D48C70]/10 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto text-[#D48C70]">
            <FileText className="w-7 h-7" />
          </div>
          <Badge className="bg-[#D48C70]/10 text-[#D48C70] border-none px-3 py-1 rounded-full text-xs font-semibold">
            Legal
          </Badge>
          <h1 className="text-4xl font-serif font-bold text-[#2C2A29]">Terms of Service</h1>
          <p className="text-sm text-[#9E9A90] font-medium">Last Updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
          <p className="text-base text-[#5C5A59] leading-relaxed max-w-xl mx-auto">
            Please read these terms carefully before using The Patient's Compass platform.
          </p>
        </div>
      </section>

      {/* Important Notice Banner */}
      <div className="bg-amber-50 border-y border-amber-200 py-4">
        <div className="max-w-3xl mx-auto px-4 flex items-start gap-3">
          <span className="text-amber-600 text-lg shrink-0">⚠️</span>
          <p className="text-sm text-amber-800 font-medium leading-relaxed">
            <strong>Educational Platform Only:</strong> The Patient's Compass does not provide medical advice, diagnosis, or treatment. All content is for educational purposes only. Always consult a licensed healthcare provider for medical decisions.
          </p>
        </div>
      </div>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 space-y-8">
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
            <Link href="/privacy"><span className="hover:text-white cursor-pointer transition-colors">Privacy</span></Link>
            <Link href="/faq"><span className="hover:text-white cursor-pointer transition-colors">FAQ</span></Link>
            <Link href="/contact"><span className="hover:text-white cursor-pointer transition-colors">Contact</span></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
