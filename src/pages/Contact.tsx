import { useState } from 'react'
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react'
import Footer from '../components/Footer'

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      alert('Please fill in all fields')
      return
    }

    try {
      // Here you would typically send the form data to your backend
      // For now, we'll just show a success message
      console.log('Form submitted:', formData)
      setSubmitted(true)
      setFormData({ name: '', email: '', subject: '', message: '' })
      
      // Reset success message after 5 seconds
      setTimeout(() => setSubmitted(false), 5000)
    } catch (err) {
      console.error('Error submitting form:', err)
      alert('Error submitting form. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Main Content */}
      <main className="flex-1">
      {/* Header */}
      <section className="site-container pt-12 pb-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-display font-bold text-4xl sm:text-5xl mb-4">Get in Touch</h1>
          <p className="text-slate-400 text-lg">We're here to help. Send us a message and we'll respond as soon as possible.</p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="site-container pb-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="card text-center">
            <div className="w-12 h-12 bg-brand-500/15 rounded-lg flex items-center justify-center mx-auto mb-3 animate-float-slow">
              <Mail size={24} className="text-brand-400" />
            </div>
            <h3 className="font-display font-semibold mb-1">Email</h3>
            <a href="mailto:support@partfinder.com" className="text-brand-400 hover:text-brand-300 text-sm transition-colors">
              support@partfinder.com
            </a>
          </div>

          <div className="card text-center">
            <div className="w-12 h-12 bg-brand-500/15 rounded-lg flex items-center justify-center mx-auto mb-3 animate-float-slow">
              <Phone size={24} className="text-brand-400" />
            </div>
            <h3 className="font-display font-semibold mb-1">Phone</h3>
            <a href="tel:+918888888888" className="text-brand-400 hover:text-brand-300 text-sm transition-colors">
              +91 8888 888 888
            </a>
          </div>

          <div className="card text-center">
            <div className="w-12 h-12 bg-brand-500/15 rounded-lg flex items-center justify-center mx-auto mb-3 animate-float-slow">
              <MapPin size={24} className="text-brand-400" />
            </div>
            <h3 className="font-display font-semibold mb-1">Location</h3>
            <p className="text-slate-400 text-sm">India-Wide Service</p>
          </div>

          <div className="card text-center">
            <div className="w-12 h-12 bg-brand-500/15 rounded-lg flex items-center justify-center mx-auto mb-3 animate-float-slow">
              <Clock size={24} className="text-brand-400" />
            </div>
            <h3 className="font-display font-semibold mb-1">Support Hours</h3>
            <p className="text-slate-400 text-sm">24/7 Support Available</p>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="site-container pb-24">
        <div className="max-w-2xl mx-auto">
          <div className="card">
            <h2 className="font-display font-bold text-2xl mb-6">Send us a Message</h2>

            {submitted && (
              <div className="mb-6 p-4 bg-green-500/20 border border-green-500/40 rounded-lg text-green-400">
                ✓ Thank you! Your message has been sent successfully. We'll get back to you soon.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">Subject</label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:border-brand-500 focus:outline-none transition-colors"
                  required
                >
                  <option value="">Select a subject</option>
                  <option value="general">General Inquiry</option>
                  <option value="support">Technical Support</option>
                  <option value="vendor">Vendor Related</option>
                  <option value="feedback">Feedback</option>
                  <option value="partnership">Partnership</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us more about your inquiry..."
                  rows={6}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none transition-colors resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-primary w-full flex items-center justify-center gap-2 py-3"
              >
                <Send size={18} />
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* FAQ CTA */}
      <section className="site-container pb-24">
        <div className="card bg-gradient-to-r from-brand-500/10 to-blue-500/10 border-brand-500/30 text-center py-12">
          <h2 className="font-display font-bold text-2xl mb-3">Looking for quick answers?</h2>
          <p className="text-slate-400 mb-6">Check out our FAQ section for common questions.</p>
          <a href="/faq" className="btn-primary inline-block">
            Visit FAQ
          </a>
        </div>
      </section>
      </main>

      <Footer />
    </div>
  )
}
