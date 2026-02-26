import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import Footer from '../components/Footer'

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      question: 'How do I post a request?',
      answer: 'To post a request, sign up as a client, fill in the part details, select your location radius, and submit. Nearby vendors will receive your request within minutes.'
    },
    {
      question: 'How much does it cost to use PartFinder?',
      answer: 'PartFinder is completely free for both clients and vendors. We make money through optional premium features and partnerships, not by charging users for posting or responding to requests.'
    },
    {
      question: 'How do I become a vendor?',
      answer: 'Sign up as a vendor, complete your profile with business details and location, verify your category expertise, and you\'re ready to receive requests from clients in your area.'
    },
    {
      question: 'What payment methods do vendors accept?',
      answer: 'Payment methods are negotiated directly between you and the vendor. Common methods include cash, bank transfer, and digital wallets. PartFinder doesn\'t handle payments.'
    },
    {
      question: 'Can I cancel a request after posting?',
      answer: 'Yes, you can cancel an open request anytime from your dashboard. Once you\'ve accepted a vendor\'s offer, contact them directly to discuss cancellation.'
    },
    {
      question: 'How are vendors verified?',
      answer: 'Vendors go through a verification process including business details check, category expertise verification, and community ratings. Look for the verified badge on vendor profiles.'
    },
    {
      question: 'What if I have an issue with a vendor?',
      answer: 'Contact our support team with details. We review disputes, take feedback seriously, and may suspend vendors who consistently violate our standards.'
    },
    {
      question: 'How long does it take to get responses?',
      answer: 'Most vendors respond within 30 minutes. The response time depends on how many vendors are in your area and current demand. Average response time is around 12 minutes.'
    },
    {
      question: 'Is my contact information safe?',
      answer: 'Yes, your contact details are only shared with vendors you\'ve accepted offers from. Vendors in your area see your request but not your contact info until you approve their offer.'
    },
    {
      question: 'Can I rate vendors?',
      answer: 'Yes! After closing a request, you can rate the vendor and leave feedback. This helps other clients and vendors improve their services.'
    }
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Main Content */}
      <main className="flex-1">
      {/* Header */}
      <section className="site-container pt-12 pb-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-display font-bold text-4xl sm:text-5xl mb-4">Frequently Asked Questions</h1>
          <p className="text-slate-400 text-lg">Find answers to common questions about PartFinder</p>
        </div>
      </section>

      {/* FAQ Items */}
      <section className="site-container pb-24">
        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <div key={index} className="mb-4">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full card hover:border-slate-700 transition-all text-left flex items-center justify-between"
              >
                <h3 className="font-display font-semibold text-lg">{faq.question}</h3>
                <ChevronDown
                  size={20}
                  className={`text-brand-400 flex-shrink-0 transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="card border-t-0 rounded-t-none">
                  <p className="text-slate-300 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="site-container pb-24">
        <div className="card bg-gradient-to-r from-brand-500/10 to-blue-500/10 border-brand-500/30 text-center py-12">
          <h2 className="font-display font-bold text-2xl mb-4">Still have questions?</h2>
          <p className="text-slate-400 mb-6">Our support team is here to help. Reach out anytime.</p>
          <a href="mailto:support@partfinder.com" className="btn-primary inline-block">
            Contact Support
          </a>
        </div>
      </section>
      </main>

      <Footer />
    </div>
  )
}
