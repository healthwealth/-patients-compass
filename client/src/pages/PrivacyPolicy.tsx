import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9F6F0] to-[#EBE6DC] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="flex items-center gap-2 text-[#7E9A85] hover:text-[#6A8571] mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold text-[#2C2A29] mb-2">Privacy Policy</h1>
          <p className="text-sm text-[#999] mb-8">Last updated: June 18, 2026</p>

          <div className="prose prose-sm max-w-none text-[#5C5A59] space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-[#2C2A29] mt-8 mb-4">1. Introduction</h2>
              <p>
                The Patient's Compass ("we," "us," "our," or "Company") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#2C2A29] mt-8 mb-4">2. Information We Collect</h2>
              <p>We may collect information about you in a variety of ways. The information we may collect on the Site includes:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Personal Data:</strong> Name, email address, phone number, password, and other account information</li>
                <li><strong>Health Information:</strong> Lab results, biomarker data, health history (provided voluntarily)</li>
                <li><strong>Usage Data:</strong> Pages visited, time spent, features used, and interactions with the Service</li>
                <li><strong>Device Information:</strong> IP address, browser type, operating system, and device identifiers</li>
                <li><strong>Payment Information:</strong> Processed securely through Shopify Payments (we do not store full payment details)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#2C2A29] mt-8 mb-4">3. Use of Your Information</h2>
              <p>Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Site to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Create and manage your account</li>
                <li>Process your transactions and send related information</li>
                <li>Email you regarding your account or order</li>
                <li>Fulfill and manage purchases, orders, payments, and other transactions related to the Service</li>
                <li>Generate a personal profile about you so that future visits to the Site will be personalized</li>
                <li>Improve the Site and Service based on feedback and data analysis</li>
                <li>Respond to your inquiries, questions, and other requests</li>
                <li>Send promotional communications (with your consent)</li>
                <li>Monitor and analyze trends, usage, and activities for security purposes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#2C2A29] mt-8 mb-4">4. Disclosure of Your Information</h2>
              <p>We may share information we have collected about you in certain situations:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>By Law or to Protect Rights:</strong> If required by law or if we believe in good faith that disclosure is necessary to protect our rights</li>
                <li><strong>Third-Party Service Providers:</strong> We may share your information with vendors, consultants, and service providers who assist us (Shopify Payments for billing, email providers, analytics services)</li>
                <li><strong>Business Transfers:</strong> If we are involved in a merger, acquisition, or asset sale, your information may be transferred</li>
                <li><strong>With Your Consent:</strong> We may disclose your information with your explicit consent for any other purpose</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#2C2A29] mt-8 mb-4">5. Security of Your Information</h2>
              <p>
                We use administrative, technical, and physical security measures to protect your personal information. However, no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#2C2A29] mt-8 mb-4">6. Contact Us</h2>
              <p>
                If you have questions or comments about this Privacy Policy, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded">
                <p><strong>Email:</strong> privacy@thepatientscompass.com</p>
                <p><strong>Website:</strong> <Link href="/contact" className="text-[#D48C70] hover:underline">Contact Page</Link></p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#2C2A29] mt-8 mb-4">7. GDPR Compliance (EU Users)</h2>
              <p>
                If you are located in the European Union, you have the following rights under the General Data Protection Regulation (GDPR):
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Right to access your personal data</li>
                <li>Right to rectification of inaccurate data</li>
                <li>Right to erasure ("right to be forgotten")</li>
                <li>Right to restrict processing</li>
                <li>Right to data portability</li>
                <li>Right to object to processing</li>
                <li>Right to withdraw consent at any time</li>
              </ul>
              <p className="mt-4">
                To exercise any of these rights, please contact us at privacy@thepatientscompass.com.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#2C2A29] mt-8 mb-4">8. CCPA Compliance (California Users)</h2>
              <p>
                If you are a California resident, you have the following rights under the California Consumer Privacy Act (CCPA):
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Right to know what personal information is collected, used, shared, or sold</li>
                <li>Right to delete personal information collected from you</li>
                <li>Right to opt-out of the sale or sharing of your personal information</li>
                <li>Right to non-discrimination for exercising your CCPA rights</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#2C2A29] mt-8 mb-4">9. Cookies and Tracking Technologies</h2>
              <p>
                We use cookies and similar tracking technologies to track activity on our Site and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Site.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#2C2A29] mt-8 mb-4">10. Changes to This Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time in order to reflect, for example, changes to our practices or for other operational, legal, or regulatory reasons. We will notify you of any changes by updating the "Last updated" date of this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#2C2A29] mt-8 mb-4">11. Health Information Disclaimer</h2>
              <p className="font-semibold text-[#D48C70]">
                EDUCATIONAL CONTENT ONLY: The Patient's Compass is an educational platform. Any health information provided is for educational purposes only and should not be considered as medical advice, diagnosis, or treatment. Always consult with a qualified healthcare professional before making any health-related decisions.
              </p>
            </section>

            <div className="mt-12 p-4 bg-amber-50 border border-amber-200 rounded">
              <p className="text-sm text-amber-800">
                <strong>EDUCATIONAL CONTENT ONLY</strong> - This platform is for educational purposes. Your privacy is important to us.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
