import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-dark text-light">
      {/* Header */}
      <header className="px-6 pt-12 pb-8 md:px-24 border-b border-light/10">
        <div className="max-w-4xl mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted hover:text-light transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">
            Privacy Policy
          </h1>
          <p className="text-muted">
            <strong>Effective Date:</strong> July 10, 2025<br />
            <strong>Last Updated:</strong> July 10, 2025
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="px-6 py-12 md:px-24">
        <div className="max-w-4xl mx-auto prose prose-invert prose-lg">
          <section className="mb-12">
            <h2 className="text-2xl font-bold tracking-tighter mb-6">1. Introduction</h2>
            <p className="text-muted mb-4">
              Marcus and Muse ("we," "our," or "us") operates the website marcusandmuse.com and related services, including any Chrome extensions we may provide (collectively, the "Services"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Services.
            </p>
            <p className="text-muted">
              By using our Services, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, do not use our Services.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold tracking-tighter mb-6">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold mb-4">2.1 Personal Information</h3>
            <p className="text-muted mb-4">
              We may collect personally identifiable information that you voluntarily provide to us, including but not limited to:
            </p>
            <ul className="text-muted mb-6 list-disc pl-6 space-y-2">
              <li>Name and contact information (email address, phone number, mailing address)</li>
              <li>Professional information (company name, job title, industry)</li>
              <li>Payment information (billing address, payment method details)</li>
              <li>Communication preferences</li>
              <li>Any other information you choose to provide</li>
            </ul>

            <h3 className="text-xl font-semibold mb-4">2.2 Usage Information</h3>
            <p className="text-muted mb-4">
              We automatically collect certain information about your use of our Services:
            </p>
            <ul className="text-muted mb-6 list-disc pl-6 space-y-2">
              <li>Browser type and version</li>
              <li>Operating system</li>
              <li>IP address and general location information</li>
              <li>Pages visited and time spent on pages</li>
              <li>Referring website addresses</li>
              <li>Device identifiers and characteristics</li>
              <li>Search queries and interactions with our Services</li>
            </ul>

            <h3 className="text-xl font-semibold mb-4">2.3 Chrome Extension Data</h3>
            <p className="text-muted mb-4">
              If you use our Chrome extensions, we may collect:
            </p>
            <ul className="text-muted mb-6 list-disc pl-6 space-y-2">
              <li>Browser settings and preferences relevant to extension functionality</li>
              <li>Usage patterns and feature interactions</li>
              <li>Error logs and performance data</li>
              <li>Extension configuration and customization data</li>
            </ul>

            <h3 className="text-xl font-semibold mb-4">2.4 Cookies and Tracking Technologies</h3>
            <p className="text-muted mb-4">
              We use cookies, web beacons, and similar tracking technologies to:
            </p>
            <ul className="text-muted mb-6 list-disc pl-6 space-y-2">
              <li>Remember your preferences and settings</li>
              <li>Analyze usage patterns and improve our Services</li>
              <li>Provide personalized content and advertisements</li>
              <li>Ensure security and prevent fraud</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold tracking-tighter mb-6">3. How We Use Your Information</h2>
            <p className="text-muted mb-4">
              We use the information we collect for the following purposes:
            </p>

            <h3 className="text-xl font-semibold mb-4">3.1 Service Provision</h3>
            <ul className="text-muted mb-6 list-disc pl-6 space-y-2">
              <li>Provide, maintain, and improve our Services</li>
              <li>Process transactions and manage your account</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Send you technical notices and security alerts</li>
            </ul>

            <h3 className="text-xl font-semibold mb-4">3.2 Business Operations</h3>
            <ul className="text-muted mb-6 list-disc pl-6 space-y-2">
              <li>Analyze usage patterns to improve our Services</li>
              <li>Develop new features and functionality</li>
              <li>Conduct research and analytics</li>
              <li>Ensure security and prevent fraud</li>
            </ul>

            <h3 className="text-xl font-semibold mb-4">3.3 Communications</h3>
            <ul className="text-muted mb-6 list-disc pl-6 space-y-2">
              <li>Send you newsletters, marketing communications, and promotional materials</li>
              <li>Notify you about changes to our Services or policies</li>
              <li>Provide you with information about our consultancy services</li>
            </ul>

            <h3 className="text-xl font-semibold mb-4">3.4 Legal Compliance</h3>
            <ul className="text-muted mb-6 list-disc pl-6 space-y-2">
              <li>Comply with applicable laws and regulations</li>
              <li>Protect our rights and interests</li>
              <li>Respond to legal requests and prevent illegal activities</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold tracking-tighter mb-6">4. Third-Party Services and Advertising</h2>
            
            <h3 className="text-xl font-semibold mb-4">4.1 Google AdSense</h3>
            <p className="text-muted mb-4">
              We use Google AdSense to display advertisements on our website. Google AdSense uses cookies and other tracking technologies to:
            </p>
            <ul className="text-muted mb-4 list-disc pl-6 space-y-2">
              <li>Show you personalized ads based on your interests</li>
              <li>Measure ad performance and effectiveness</li>
              <li>Prevent fraud and abuse</li>
            </ul>
            <p className="text-muted mb-6">
              Google's use of advertising cookies enables it and its partners to serve ads based on your visit to our site and other sites on the Internet. You can opt out of personalized advertising by visiting <a href="https://adssettings.google.com/" className="text-accent hover:underline">Google's Ad Settings</a> or <a href="http://www.aboutads.info/" className="text-accent hover:underline">www.aboutads.info</a>.
            </p>

            <h3 className="text-xl font-semibold mb-4">4.2 Analytics Services</h3>
            <p className="text-muted mb-4">
              We use Google Analytics and other analytics services to understand how our Services are used. These services may collect information such as:
            </p>
            <ul className="text-muted mb-6 list-disc pl-6 space-y-2">
              <li>How often users visit our Services</li>
              <li>What pages they visit and for how long</li>
              <li>What other sites they used prior to visiting our Services</li>
            </ul>

            <h3 className="text-xl font-semibold mb-4">4.3 Other Third-Party Services</h3>
            <p className="text-muted mb-4">
              We may integrate with other third-party services for:
            </p>
            <ul className="text-muted mb-6 list-disc pl-6 space-y-2">
              <li>Payment processing</li>
              <li>Email marketing</li>
              <li>Customer support</li>
              <li>Social media integration</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold tracking-tighter mb-6">5. Chrome Extension Specific Practices</h2>
            
            <h3 className="text-xl font-semibold mb-4">5.1 Permissions</h3>
            <p className="text-muted mb-6">
              Our Chrome extensions request only the minimum permissions necessary for functionality. We clearly explain why each permission is needed.
            </p>

            <h3 className="text-xl font-semibold mb-4">5.2 Data Handling</h3>
            <ul className="text-muted mb-6 list-disc pl-6 space-y-2">
              <li>We do not access or collect data beyond what is necessary for the extension's stated purpose</li>
              <li>We do not sell, rent, or share personal data collected through our extensions with third parties for their own use</li>
              <li>We implement appropriate security measures to protect extension data</li>
            </ul>

            <h3 className="text-xl font-semibold mb-4">5.3 User Control</h3>
            <p className="text-muted mb-4">You can:</p>
            <ul className="text-muted mb-6 list-disc pl-6 space-y-2">
              <li>Disable or uninstall our extensions at any time</li>
              <li>Review and modify extension permissions through Chrome's settings</li>
              <li>Contact us to request deletion of extension-related data</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold tracking-tighter mb-6">6. Data Sharing and Disclosure</h2>
            <p className="text-muted mb-6">
              We do not sell, trade, or rent your personal information to third parties. We may share your information in the following circumstances:
            </p>

            <h3 className="text-xl font-semibold mb-4">6.1 Service Providers</h3>
            <p className="text-muted mb-4">
              We may share information with trusted third-party service providers who assist us in operating our Services, including:
            </p>
            <ul className="text-muted mb-6 list-disc pl-6 space-y-2">
              <li>Web hosting providers</li>
              <li>Payment processors</li>
              <li>Email service providers</li>
              <li>Analytics providers</li>
            </ul>

            <h3 className="text-xl font-semibold mb-4">6.2 Legal Requirements</h3>
            <p className="text-muted mb-4">
              We may disclose information if required by law or in response to:
            </p>
            <ul className="text-muted mb-6 list-disc pl-6 space-y-2">
              <li>Court orders or legal process</li>
              <li>Government requests</li>
              <li>Protection of our rights and safety</li>
              <li>Investigation of fraud or illegal activities</li>
            </ul>

            <h3 className="text-xl font-semibold mb-4">6.3 Business Transfers</h3>
            <p className="text-muted mb-6">
              In the event of a merger, acquisition, or sale of assets, your information may be transferred to the new owner.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold tracking-tighter mb-6">7. Data Security</h2>
            <p className="text-muted mb-4">
              We implement appropriate technical and organizational measures to protect your information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure.
            </p>
            <p className="text-muted mb-4">Security measures include:</p>
            <ul className="text-muted mb-6 list-disc pl-6 space-y-2">
              <li>Encryption of sensitive data</li>
              <li>Regular security audits</li>
              <li>Access controls and authentication</li>
              <li>Secure data storage practices</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold tracking-tighter mb-6">8. International Data Transfers</h2>
            <p className="text-muted mb-6">
              Your information may be transferred to and processed in countries other than your own. We ensure that such transfers comply with applicable data protection laws and implement appropriate safeguards.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold tracking-tighter mb-6">9. Data Retention</h2>
            <p className="text-muted mb-4">
              We retain your information for as long as necessary to:
            </p>
            <ul className="text-muted mb-4 list-disc pl-6 space-y-2">
              <li>Provide our Services</li>
              <li>Comply with legal obligations</li>
              <li>Resolve disputes</li>
              <li>Enforce our agreements</li>
            </ul>
            <p className="text-muted mb-6">
              When we no longer need your information, we will securely delete or anonymize it.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold tracking-tighter mb-6">10. Your Rights and Choices</h2>
            <p className="text-muted mb-6">
              Depending on your location, you may have the following rights:
            </p>

            <h3 className="text-xl font-semibold mb-4">10.1 Access and Portability</h3>
            <ul className="text-muted mb-6 list-disc pl-6 space-y-2">
              <li>Request access to your personal information</li>
              <li>Receive a copy of your data in a portable format</li>
            </ul>

            <h3 className="text-xl font-semibold mb-4">10.2 Correction and Deletion</h3>
            <ul className="text-muted mb-6 list-disc pl-6 space-y-2">
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your personal information</li>
            </ul>

            <h3 className="text-xl font-semibold mb-4">10.3 Consent and Objection</h3>
            <ul className="text-muted mb-6 list-disc pl-6 space-y-2">
              <li>Withdraw consent for data processing</li>
              <li>Object to certain types of processing</li>
            </ul>

            <h3 className="text-xl font-semibold mb-4">10.4 Marketing Communications</h3>
            <ul className="text-muted mb-6 list-disc pl-6 space-y-2">
              <li>Opt out of marketing emails by clicking the unsubscribe link</li>
              <li>Manage your communication preferences in your account settings</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold tracking-tighter mb-6">11. Children's Privacy</h2>
            <p className="text-muted mb-6">
              Our Services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold tracking-tighter mb-6">12. California Privacy Rights</h2>
            <p className="text-muted mb-4">
              California residents may have additional rights under the California Consumer Privacy Act (CCPA):
            </p>
            <ul className="text-muted mb-6 list-disc pl-6 space-y-2">
              <li>Right to know what personal information is collected</li>
              <li>Right to delete personal information</li>
              <li>Right to opt-out of the sale of personal information</li>
              <li>Right to non-discrimination for exercising privacy rights</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold tracking-tighter mb-6">13. European Union Rights</h2>
            <p className="text-muted mb-4">
              If you are located in the European Union, you may have additional rights under the General Data Protection Regulation (GDPR):
            </p>
            <ul className="text-muted mb-6 list-disc pl-6 space-y-2">
              <li>Right to access your data</li>
              <li>Right to rectify inaccurate data</li>
              <li>Right to erase your data</li>
              <li>Right to restrict processing</li>
              <li>Right to data portability</li>
              <li>Right to object to processing</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold tracking-tighter mb-6">14. Changes to This Privacy Policy</h2>
            <p className="text-muted mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by:
            </p>
            <ul className="text-muted mb-6 list-disc pl-6 space-y-2">
              <li>Posting the updated policy on our website</li>
              <li>Sending you an email notification</li>
              <li>Providing notice through our Services</li>
            </ul>
            <p className="text-muted mb-6">
              Your continued use of our Services after any changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold tracking-tighter mb-6">15. Contact Information</h2>
            <p className="text-muted mb-4">
              If you have any questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <div className="bg-light/5 p-6 rounded-xl border border-light/10 mb-6">
              <p className="text-muted mb-2">
                <strong>Marcus and Muse</strong><br />
                Email: <a href="mailto:aaron@marcusandmuse.com" className="text-accent hover:underline">aaron@marcusandmuse.com</a><br />
                Address: Ottawa, Ontario, Canada<br />
                Phone: 514-449-5275
              </p>
            </div>
            <p className="text-muted">
              For Chrome extension-related privacy questions, please include "Chrome Extension Privacy" in your subject line.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold tracking-tighter mb-6">16. Effective Date</h2>
            <p className="text-muted">
              This Privacy Policy is effective as of July 10, 2025 and will remain in effect except with respect to any changes in its provisions in the future, which will be in effect immediately after being posted on this page.
            </p>
          </section>

          <div className="border-t border-light/10 pt-8 mt-12">
            <p className="text-sm text-muted italic">
              This privacy policy template is provided for informational purposes only and should be reviewed by legal counsel before implementation.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default PrivacyPolicy; 