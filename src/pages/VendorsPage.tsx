import { useState, useEffect } from 'react'
import { Search, Phone, MapPin, Tag, X, Home } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import VendorsMap from '../components/VendorsMap'
import Footer from '../components/Footer'

export default function VendorsPage() {
  const [vendors, setVendors] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedVendor, setSelectedVendor] = useState<any>(null)
  const [filterCategory, setFilterCategory] = useState('')
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    loadVendors()
  }, [])

  const loadVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'vendor')
        .not('city', 'is', null)

      if (error) throw error

      const uniqueCategories = [...new Set((data || []).map((v: any) => v.category).filter(Boolean))]
      setCategories(uniqueCategories as string[])
      setVendors(data || [])
      setFiltered(data || [])
    } catch (err) {
      console.error('Error loading vendors:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let result = vendors

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(v =>
        (v.business_name || '').toLowerCase().includes(q) ||
        (v.full_name || '').toLowerCase().includes(q) ||
        (v.city || '').toLowerCase().includes(q) ||
        (v.state || '').toLowerCase().includes(q) ||
        (v.phone || '').includes(q)
      )
    }

    if (filterCategory) {
      result = result.filter(v => v.category === filterCategory)
    }

    setFiltered(result)
  }, [search, filterCategory, vendors])

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navigation Header */}
      <div className="border-b border-slate-800 py-4">
        <div className="site-container">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <Home size={16} /> Back to Home
          </Link>
        </div>
      </div>

      {/* Header */}
      <div className="border-b border-slate-800 py-8">
        <div className="site-container">
          <h1 className="font-display font-bold text-3xl sm:text-4xl mb-3">Browse Vendors</h1>
          <p className="text-slate-400">Explore auto part vendors near you</p>
        </div>
      </div>

      <div className="site-container py-8">
        {/* Map Section */}
        <div className="mb-12">
          <h2 className="font-display font-semibold text-2xl mb-4">Vendors Map</h2>
          <VendorsMap 
            vendors={filtered.length > 0 ? filtered : vendors}
            onVendorClick={setSelectedVendor}
          />
        </div>

        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, location, or phone..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {(search || filterCategory) && (
            <div className="flex gap-2">
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 rounded-lg px-3 py-1 text-sm transition-colors"
                >
                  Search: "{search}" <X size={14} />
                </button>
              )}
              {filterCategory && (
                <button
                  onClick={() => setFilterCategory('')}
                  className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 rounded-lg px-3 py-1 text-sm transition-colors"
                >
                  Category: {filterCategory} <X size={14} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="mb-6 text-slate-400 text-sm">
              Found <span className="text-white font-semibold">{filtered.length}</span> vendor{filtered.length !== 1 ? 's' : ''}
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400 mb-4">No vendors found matching your search</p>
                <button
                  onClick={() => {
                    setSearch('')
                    setFilterCategory('')
                  }}
                  className="text-brand-400 hover:text-brand-300 text-sm"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {filtered.map(vendor => (
                  <div
                    key={vendor.id}
                    onClick={() => setSelectedVendor(vendor)}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-brand-500/50 hover:bg-slate-800/50 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-display font-semibold text-lg">{vendor.business_name || vendor.full_name}</h3>
                        <p className="text-brand-400 text-sm flex items-center gap-1 mt-1">
                          <Tag size={14} /> {vendor.category}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-slate-400">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-brand-500" />
                        <span>{vendor.city}, {vendor.state}</span>
                      </div>
                      {vendor.phone && (
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-brand-500" />
                          <span>{vendor.phone}</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedVendor(vendor)}
                      className="w-full mt-4 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Vendor Detail Modal */}
      {selectedVendor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 sticky top-0 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <h2 className="font-display font-bold text-2xl">Vendor Details</h2>
              <button
                onClick={() => setSelectedVendor(null)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="font-display font-semibold text-xl mb-2">{selectedVendor.business_name || selectedVendor.full_name}</h3>
                <div className="flex flex-wrap gap-3">
                  <span className="bg-brand-500/20 text-brand-400 px-3 py-1 rounded-full text-sm font-semibold">
                    {selectedVendor.category}
                  </span>
                  {selectedVendor.authorized_dealer && (
                    <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-semibold">
                      ✓ Authorized Dealer
                    </span>
                  )}
                </div>
              </div>

              {/* Contact Details */}
              <div className="border-t border-slate-800 pt-6">
                <h4 className="font-semibold text-lg mb-3 text-brand-400">Contact Information</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-slate-400">Name:</span> <span className="text-white">{selectedVendor.full_name}</span></p>
                  <p><span className="text-slate-400">Email:</span> <span className="text-white">{selectedVendor.email}</span></p>
                  {selectedVendor.phone && (
                    <p className="flex items-center gap-2">
                      <Phone size={14} className="text-brand-500" />
                      <span className="text-white">{selectedVendor.phone}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="border-t border-slate-800 pt-6">
                <h4 className="font-semibold text-lg mb-3 text-brand-400">Location</h4>
                <div className="space-y-3">
                  <p className="flex items-center gap-2 text-sm text-slate-300">
                    <MapPin size={14} className="text-brand-500" />
                    <span>{selectedVendor.city}, {selectedVendor.state}</span>
                  </p>
                  {selectedVendor.latitude && selectedVendor.longitude && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${selectedVendor.latitude},${selectedVendor.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold py-2 rounded-lg transition-colors block text-center"
                    >
                      View on Google Maps
                    </a>
                  )}
                </div>
              </div>

              {/* Companies */}
              {selectedVendor.companies && selectedVendor.companies.length > 0 && (
                <div className="border-t border-slate-800 pt-6">
                  <h4 className="font-semibold text-lg mb-3 text-brand-400">Companies</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedVendor.companies.map((company: string, i: number) => (
                      <span key={i} className="bg-slate-800 px-3 py-1 rounded-full text-xs text-slate-300">
                        {company}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={() => setSelectedVendor(null)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  )
}
