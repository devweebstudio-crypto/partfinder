import Footer from '../components/Footer'

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Main Content */}
      <main className="flex-1">
      {/* Header */}
      <section className="site-container pt-12 pb-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-display font-bold text-4xl sm:text-5xl mb-4">Terms of Service</h1>
          <p className="text-slate-400">Last updated: February 2026</p>
        </div>
      </section>

      {/* Content */}
      <section className="site-container pb-24">
        <div className="max-w-3xl mx-auto space-y-8 text-slate-300">
          
          <div>
            <h2 className="font-display font-bold text-2xl text-white mb-4">1. Agreement to Terms</h2>
            <p>By accessing and using PartFinder, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.</p>
          </div>

          <div>
            <h2 className="font-display font-bold text-2xl text-white mb-4">2. User Eligibility</h2>
            <p>You must be at least 18 years old to use PartFinder. By using this platform, you represent and warrant that you are 18 or older and have the legal capacity to enter into this agreement. If you are under 18, you may only use PartFinder with parental consent.</p>
          </div>

          <div>
            <h2 className="font-display font-bold text-2xl text-white mb-4">3. User Account</h2>
            <div className="space-y-3">
              <p>You are responsible for:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Creating accurate and complete account information</li>
                <li>Maintaining the confidentiality of your password</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of unauthorized access</li>
              </ul>
              <p className="mt-3">We reserve the right to suspend or terminate accounts that provide false information or violate our policies.</p>
            </div>
          </div>

          <div>
            <h2 className="font-display font-bold text-2xl text-white mb-4">4. User Conduct</h2>
            <p className="mb-3">You agree not to use PartFinder for any unlawful purposes or in any way that could damage or impair the platform. Prohibited activities include but are not limited to:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Posting false or misleading information</li>
              <li>Harassment, threats, or abusive behavior</li>
              <li>Fraudulent requests or offers</li>
              <li>Spam or unsolicited communications</li>
              <li>Attempting to hack or compromise platform security</li>
              <li>Posting illegal or copyrighted content</li>
              <li>Using automated tools to scrape or access the platform</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display font-bold text-2xl text-white mb-4">5. Payments and Transactions</h2>
            <p className="mb-3">PartFinder is a free platform that facilitates connections between clients and vendors. We clarify that:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>PartFinder does not process, handle, or manage payments between users</li>
              <li>All financial transactions are between the client and vendor directly</li>
              <li>Users are responsible for negotiating terms and prices</li>
              <li>PartFinder is not liable for payment disputes or transaction issues</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display font-bold text-2xl text-white mb-4">6. Vendor Verification</h2>
            <p>While we verify vendors through available information, PartFinder is not liable for vendor credentials, quality of service, or any issues arising from vendor-client transactions. Clients should exercise due diligence when selecting vendors.</p>
          </div>

          <div>
            <h2 className="font-display font-bold text-2xl text-white mb-4">7. Intellectual Property Rights</h2>
            <p className="mb-3">PartFinder and its content, including text, graphics, logos, images, and software, are the property of PartFinder or its content suppliers and are protected by international copyright laws. You may not reproduce, sell, or distribute any part of PartFinder without our permission.</p>
          </div>

          <div>
            <h2 className="font-display font-bold text-2xl text-white mb-4">8. Limitation of Liability</h2>
            <p className="mb-3">To the extent permitted by law, PartFinder and its officers, directors, and employees shall not be liable for:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Any indirect, incidental, special, consequential damages</li>
              <li>Loss of profit, data, or business opportunities</li>
              <li>Issues arising from vendor-client transactions</li>
              <li>Third-party actions or content</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display font-bold text-2xl text-white mb-4">9. Warranty Disclaimer</h2>
            <p>PartFinder is provided "as is" without warranties of any kind. We disclaim all warranties, express or implied, including merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the platform will be uninterrupted or error-free.</p>
          </div>

          <div>
            <h2 className="font-display font-bold text-2xl text-white mb-4">10. Indemnification</h2>
            <p>You agree to indemnify and hold harmless PartFinder and its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your use of the platform or violation of these terms.</p>
          </div>

          <div>
            <h2 className="font-display font-bold text-2xl text-white mb-4">11. Termination</h2>
            <p>PartFinder reserves the right to terminate or suspend your account at any time for violations of these terms or for any reason, with or without notice. Upon termination, your right to use the platform immediately ceases.</p>
          </div>

          <div>
            <h2 className="font-display font-bold text-2xl text-white mb-4">12. Governing Law</h2>
            <p>These terms and conditions are governed by and construed in accordance with the laws of India, and you irrevocably submit to the exclusive jurisdiction of the courts in India.</p>
          </div>

          <div>
            <h2 className="font-display font-bold text-2xl text-white mb-4">13. Changes to Terms</h2>
            <p>PartFinder reserves the right to modify these terms at any time. We will notify users of material changes via email or prominent notice. Your continued use of the platform constitutes acceptance of updated terms.</p>
          </div>

          <div>
            <h2 className="font-display font-bold text-2xl text-white mb-4">14. Contact Information</h2>
            <p>If you have questions about these Terms of Service, please contact us at:</p>
            <div className="mt-4 p-4 bg-slate-900/50 rounded-lg border border-slate-800">
              <p className="font-semibold text-white mb-2">PartFinder Legal Team</p>
              <p className="text-sm">Email: legal@partfinder.com</p>
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
