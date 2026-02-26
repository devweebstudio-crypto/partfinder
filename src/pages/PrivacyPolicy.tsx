import Footer from '../components/Footer'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Main Content */}
      <main className="flex-1">
      {/* Header */}
      <section className="site-container pt-12 pb-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-display font-bold text-4xl sm:text-5xl mb-4">Privacy Policy</h1>
          <p className="text-slate-400">Last updated: February 2026</p>
        </div>
      </section>

      {/* Content */}
      <section className="site-container pb-24">
        <div className="max-w-3xl mx-auto space-y-8 text-slate-300">
          
          <div>
            <h2 className="font-display font-bold text-2xl text-white mb-4">1. Introduction</h2>
            <p>Welcome to PartFinder ("we," "us," "our"). We are committed to protecting your privacy and ensuring you have a positive experience on our platform. This Privacy Policy explains how we collect, use, disclose, and otherwise process your personal information.</p>
          </div>

          <div>
            <h2 className="font-display font-bold text-2xl text-white mb-4">2. Information We Collect</h2>
            <div className="space-y-3">
              <div>
                <h3 className="text-brand-400 font-semibold mb-2">Account Information</h3>
                <p>When you create an account, we collect your name, email, phone number, location, and profile details.</p>
              </div>
              <div>
                <h3 className="text-brand-400 font-semibold mb-2">Request Information</h3>
                <p>When you post a request, we collect details about the parts you're looking for, location radius, and any additional specifications.</p>
              </div>
              <div>
                <h3 className="text-brand-400 font-semibold mb-2">Device Information</h3>
                <p>We collect information about the device you use to access PartFinder, including IP address, browser type, and operating system.</p>
              </div>
              <div>
                <h3 className="text-brand-400 font-semibold mb-2">Usage Information</h3>
                <p>We track how you interact with PartFinder, including features used, pages visited, and time spent on the platform.</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="font-display font-bold text-2xl text-white mb-4">3. How We Use Your Information</h2>
            <p className="mb-3">We use your information to:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Provide and improve our platform and services</li>
              <li>Match clients with relevant vendors in their area</li>
              <li>Send notifications about requests and responses</li>
              <li>Process transactions and prevent fraud</li>
              <li>Verify vendor credentials and maintain platform safety</li>
              <li>Respond to customer support inquiries</li>
              <li>Analyze usage patterns to improve user experience</li>
              <li>Comply with legal obligations</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display font-bold text-2xl text-white mb-4">4. Information Sharing</h2>
            <p className="mb-3">We share your information only when necessary:</p>
            <div className="space-y-3">
              <div>
                <h3 className="text-brand-400 font-semibold mb-2">With Vendors</h3>
                <p>Vendors in your area can see your request details (parts needed, location radius) but not your contact information until you accept their offer.</p>
              </div>
              <div>
                <h3 className="text-brand-400 font-semibold mb-2">With Service Providers</h3>
                <p>We share necessary information with third-party vendors who help us deliver services (payment processors, email providers, hosting services).</p>
              </div>
              <div>
                <h3 className="text-brand-400 font-semibold mb-2">Legal Requirements</h3>
                <p>We may share information if required by law or to protect the rights and safety of our users and the public.</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="font-display font-bold text-2xl text-white mb-4">5. Data Security</h2>
            <p>We implement industry-standard security measures to protect your personal information. We use encryption, secure servers, and regular security audits. However, no online platform is 100% secure, and we cannot guarantee absolute security.</p>
          </div>

          <div>
            <h2 className="font-display font-bold text-2xl text-white mb-4">6. Your Rights</h2>
            <p className="mb-3">You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of certain communications</li>
              <li>Export your data in common formats</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display font-bold text-2xl text-white mb-4">7. Cookies and Tracking</h2>
            <p>We use cookies and similar technologies to remember your preferences, understand how you use PartFinder, and improve our platform. You can control cookie settings through your browser, but some features may not work properly without them.</p>
          </div>

          <div>
            <h2 className="font-display font-bold text-2xl text-white mb-4">8. Children's Privacy</h2>
            <p>PartFinder is not intended for children under 18. We do not knowingly collect information from children. If we discover we have collected information from a child, we will delete it immediately.</p>
          </div>

          <div>
            <h2 className="font-display font-bold text-2xl text-white mb-4">9. Policy Changes</h2>
            <p>We may update this Privacy Policy periodically. We will notify you of material changes via email or through prominent notice on our website. Continued use of PartFinder constitutes your acceptance of the updated policy.</p>
          </div>

          <div>
            <h2 className="font-display font-bold text-2xl text-white mb-4">10. Contact Us</h2>
            <p>If you have questions about this Privacy Policy or our privacy practices, please contact us at:</p>
            <div className="mt-4 p-4 bg-slate-900/50 rounded-lg border border-slate-800">
              <p className="font-semibold text-white mb-2">PartFinder Privacy Team</p>
              <p className="text-sm">Email: privacy@partfinder.com</p>
              <p className="text-sm">Phone: +91 8888 888 888</p>
            </div>
          </div>

        </div>
      </section>
      </main>

      <Footer />
    </div>
  )
}
