import { Link } from 'react-router-dom'
import { appName } from '../lib/appConfig'
import { Mail, Phone, MapPin } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-slate-800 bg-slate-950/60 relative z-10 mt-20">
      <div className="site-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img src="/VWpartlogo.png" alt={appName} className="w-10 h-10 object-contain" />
              <span className="font-display font-bold text-lg text-white">{appName}</span>
            </div>
            <p className="text-slate-400 text-sm mb-4">Connecting automobile parts seekers with trusted local vendors.</p>
            <div className="text-slate-500 text-xs">© {currentYear} {appName}. All rights reserved.</div>
          </div>

          {/* Info */}
          <div>
            <h3 className="font-display font-semibold text-white mb-4">Info</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/" className="hover:text-brand-400 transition-colors">Home</Link></li>
              <li><Link to="/vendors" className="hover:text-brand-400 transition-colors">Browse Vendors</Link></li>
              <li><a href="#about" className="hover:text-brand-400 transition-colors">About Us</a></li>
              <li><a href="#how-it-works" className="hover:text-brand-400 transition-colors">How It Works</a></li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-display font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/auth" className="hover:text-brand-400 transition-colors">Post Request</Link></li>
              <li><Link to="/auth?mode=vendor" className="hover:text-brand-400 transition-colors">Become Vendor</Link></li>
              <li><Link to="/faq" className="hover:text-brand-400 transition-colors">FAQ</Link></li>
              <li><Link to="/contact" className="hover:text-brand-400 transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Contact Us */}
          <div>
            <h3 className="font-display font-semibold text-white mb-4">Contact Us</h3>
            <div className="space-y-3 text-sm text-slate-400">
              <div className="flex items-start gap-2">
                <Mail size={16} className="text-brand-400 flex-shrink-0 mt-0.5" />
                <a href="mailto:support@partfinder.com" className="hover:text-brand-400 transition-colors">support@partfinder.com</a>
              </div>
              <div className="flex items-start gap-2">
                <Phone size={16} className="text-brand-400 flex-shrink-0 mt-0.5" />
                <a href="tel:+918888888888" className="hover:text-brand-400 transition-colors">+91 8888 888 888</a>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={16} className="text-brand-400 flex-shrink-0 mt-0.5" />
                <span>India-Wide Service</span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-xs text-center md:text-left">
            Made with <span className="text-brand-500">♥</span> for the automotive community
          </p>
          <div className="flex gap-6 text-slate-500 text-xs">
            <Link to="/terms" className="hover:text-brand-400 transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-brand-400 transition-colors">Privacy Policy</Link>
            <Link to="/contact" className="hover:text-brand-400 transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
