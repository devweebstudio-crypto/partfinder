import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Plus, X, ChevronDown, ChevronUp, Phone, MapPin, Building2, Clock, ExternalLink, XCircle } from 'lucide-react'

interface Response {
  id: string
  vendor_id: string
  status: string
  created_at: string
  profiles: {
    full_name: string
    business_name: string | null
    phone: string | null
    city: string | null
    category: string | null
    latitude: number | null
    longitude: number | null
    authorized_dealer: boolean
    companies: string[]
  }
}

interface Request {
  id: string
  part_name: string
  category: string
  description: string
  image_url: string | null
  preferred_company: string | null
  area_city: string | null
  area_radius: number | null
  status: string
  created_at: string
  responses: Response[]
}

const MAIN_CATEGORIES: Record<string, string[]> = {
  Automobile: [
    'Engine Parts',
    'Transmission',
    'Brakes',
    'Suspension',
    'Electrical',
    'Body Parts',
    'Tyres & Wheels',
    'Exhaust',
    'Cooling',
    'Fuel System',
    'AC & Heating',
    'Filters & Fluids',
    'Batteries',
    'Accessories'
  ],
  Electronics: [
    'Car Electronics',
    'Dashboard & Infotainment',
    'Audio Systems',
    'Lighting'
  ],
  'Lubricants & Fluids': [
    'Engine Oil',
    'Coolant',
    'Transmission Fluid',
    'Brake Fluid'
  ]
}

const getMainCategory = (subcategory: string | null) => {
  if (!subcategory) return 'Other'
  const entry = Object.entries(MAIN_CATEGORIES).find(([, subs]) => subs.includes(subcategory))
  return entry ? entry[0] : 'Other'
}

export default function ClientDashboard() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [closing, setClosing] = useState<string | null>(null)
  const [tab, setTab] = useState<'open' | 'accepted' | 'closed' | 'completed' | 'all'>('open')
  const [searchQuery, setSearchQuery] = useState('')
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const fetchRequests = async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('requests')
      .select(`
        *,
        responses:request_responses(
          id, vendor_id, status, created_at,
          profiles:vendor_id(full_name, business_name, phone, city, category, latitude, longitude, authorized_dealer, companies)
        )
      `)
      .eq('client_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) setRequests(data as any)
    setLoading(false)
  }

  useEffect(() => { fetchRequests() }, [user])

  const closeRequest = async (id: string) => {
    setClosing(id)
    try {
      // First, find all vendors who accepted this request
      const { data: acceptedResponses, error: fetchError } = await supabase
        .from('request_responses')
        .select('vendor_id')
        .eq('request_id', id)
        .eq('status', 'accepted')
      
      // Close the request with timestamp
      const { error: updateError } = await supabase
        .from('requests')
        .update({ status: 'closed', closed_at: new Date().toISOString() })
        .eq('id', id)
      
      if (!updateError && acceptedResponses && acceptedResponses.length > 0) {
        // Notify all vendors who accepted this request
        try {
          const notificationsToInsert = acceptedResponses.map((resp: any) => ({
            vendor_id: resp.vendor_id,
            client_id: null,
            request_id: id
          }))
          console.log('📤 Inserting closure notifications (client→vendors):', notificationsToInsert)
          const { data, error: notifyError } = await supabase
            .from('notifications')
            .insert(notificationsToInsert)
            .select()
          if (notifyError) {
            console.error('❌ Failed to notify vendors of request closure:', notifyError)
          } else {
            console.log(`✅ Notified ${acceptedResponses.length} vendors that request was closed`, data)
          }
        } catch (err) {
          console.error('Error sending closure notifications:', err)
        }
      }
    } catch (err) {
      console.error('Error closing request:', err)
    }
    await fetchRequests()
    setClosing(null)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="site-container py-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display font-bold text-3xl text-white">My Requests</h1>
          <p className="text-slate-400 mt-1">{requests.length} total · {requests.filter(r => r.status === 'open').length} open</p>
        </div>
        <Link to="/request/new" className="btn-primary flex items-center gap-2 w-full md:w-auto justify-center">
          <Plus size={18} /> New Request
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by part name, category, or description..."
          className="input w-full max-w-md"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/50 p-1 rounded-xl mb-6 w-full sm:w-fit overflow-x-auto">
        {([['open', 'Open'], ['accepted', 'Accepted'], ['completed', 'Completed'], ['closed', 'Closed'], ['all', 'All']] as const).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setTab(val)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${tab === val ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {requests.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">🔧</div>
          <h3 className="font-display font-semibold text-white text-xl mb-2">No requests yet</h3>
          <p className="text-slate-400 mb-6">Post your first request and get responses from local vendors.</p>
          <Link to="/request/new" className="btn-primary inline-flex items-center gap-2">
            <Plus size={16} /> Create Request
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.filter(r => {
            // Tab filtering
            let tabMatch = false
            if (tab === 'open') tabMatch = r.status === 'open'
            else if (tab === 'accepted') tabMatch = r.responses?.some(resp => resp.status === 'accepted')
            else if (tab === 'completed') tabMatch = r.responses?.some(resp => resp.status === 'completed')
            else if (tab === 'closed') tabMatch = r.status === 'closed'
            else tabMatch = true // 'all' tab
            
            if (!tabMatch) return false
            
            // Search filtering
            if (!searchQuery.trim()) return true
            const query = searchQuery.toLowerCase().trim()
            return r.part_name.toLowerCase().includes(query) || 
                   r.category.toLowerCase().includes(query) ||
                   r.description.toLowerCase().includes(query)
          }).map(req => {
            const acceptedResponses = req.responses?.filter(r => r.status === 'accepted') || []
            const completedResponses = req.responses?.filter(r => r.status === 'completed') || []
            const isExpanded = expanded === req.id
            const mainCategory = getMainCategory(req.category)
            const locationLabel = req.area_city || 'All India'
            const radiusLabel = req.area_radius ? ` (${req.area_radius}km radius)` : ''

            return (
              <div key={req.id} className="card hover:border-slate-700 transition-colors animate-slide-up">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2 text-xs text-slate-400">
                      <span className={req.status === 'open' ? 'badge-open' : 'badge-closed'}>
                        {req.status}
                      </span>
                      <span className="text-slate-600">|</span>
                      <span className="text-slate-300 font-semibold">Category</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 border border-slate-700 font-semibold">
                        {mainCategory}
                      </span>
                      <span className="text-slate-600">|</span>
                      <span className="text-slate-300 font-semibold">Sub Category</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 border border-slate-700 font-semibold">
                        {req.category}
                      </span>
                      <span className="text-slate-600">|</span>
                      <span className="text-slate-300 font-semibold">Request Date:</span>
                      <span className="text-slate-200">{new Date(req.created_at).toLocaleDateString()}</span>
                      {acceptedResponses.length > 0 && (
                        <span className="text-xs text-green-400 font-medium bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                          {acceptedResponses.length} accepted
                        </span>
                      )}
                      {completedResponses.length > 0 && (
                        <span className="text-xs text-blue-400 font-medium bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                          {completedResponses.length} completed
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">Title:</div>
                    <h3 className="font-display font-semibold text-white text-lg">{req.part_name}</h3>
                    {req.preferred_company && (
                      <div className="mt-2 text-sm text-brand-300 font-semibold">
                        <span className="text-slate-300">Preferred Brand:</span>{' '}
                        <span className="text-brand-300 bg-brand-500/10 border border-brand-500/30 px-2 py-0.5 rounded-full">
                          {req.preferred_company}
                        </span>
                      </div>
                    )}
                    <div className="text-xs text-slate-400 mt-2">Description:</div>
                    <p className="text-slate-400 text-sm mt-1 line-clamp-2">{req.description}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                      <MapPin size={12} /> Location: {locationLabel}{radiusLabel}
                    </div>
                  </div>
                  {req.image_url && (
                    <img
                      src={req.image_url}
                      alt={req.part_name}
                      className="w-16 h-16 rounded-xl object-cover flex-shrink-0 cursor-pointer"
                      onClick={() => setPreviewImage(req.image_url)}
                    />
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-800">
                  {(acceptedResponses.length > 0 || completedResponses.length > 0) && (
                    <button
                      onClick={() => setExpanded(isExpanded ? null : req.id)}
                      className="flex items-center gap-1.5 text-sm text-brand-400 hover:text-brand-300 transition-colors"
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      View {acceptedResponses.length + completedResponses.length} vendor{acceptedResponses.length + completedResponses.length > 1 ? 's' : ''}
                    </button>
                  )}
                  <div className="flex-1" />
                  {req.status === 'open' && (
                    <button
                      onClick={() => closeRequest(req.id)}
                      disabled={closing === req.id}
                      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 transition-colors bg-slate-800 hover:bg-red-500/10 border border-slate-700 hover:border-red-500/30 px-3 py-1.5 rounded-lg w-full sm:w-auto justify-center"
                    >
                      <X size={14} /> Close Request
                    </button>
                  )}
                </div>

                {/* Accepted vendors */}
                {isExpanded && (acceptedResponses.length > 0 || completedResponses.length > 0) && (
                  <div className="mt-4 space-y-3">
                    {[...acceptedResponses, ...completedResponses].map(resp => (
                      <div key={resp.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Building2 size={14} className={resp.status === 'completed' ? 'text-blue-400' : 'text-brand-400'} />
                              <span className="font-semibold text-white">{resp.profiles?.business_name || resp.profiles?.full_name}</span>
                              {resp.profiles?.authorized_dealer && (
                                <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">Authorized Dealer</span>
                              )}
                              {resp.status === 'completed' && (
                                <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">Completed</span>
                              )}
                            </div>
                            <p className="text-slate-400 text-sm">{resp.profiles?.full_name}</p>
                            {resp.profiles?.category && (
                              <span className="text-xs text-slate-500">{resp.profiles.category}</span>
                            )}
                            {resp.profiles?.companies && resp.profiles.companies.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {resp.profiles.companies.map((company, idx) => (
                                  <span key={idx} className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">{company}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="text-right space-y-1">
                            {resp.profiles?.phone && (
                              <a href={`tel:${resp.profiles.phone}`} className="flex items-center justify-end gap-1.5 text-sm text-brand-400 hover:text-brand-300">
                                <Phone size={14} /> {resp.profiles.phone}
                              </a>
                            )}
                            {resp.profiles?.city && (
                              <p className="text-xs text-slate-500 flex items-center justify-end gap-1">
                                <MapPin size={11} /> {resp.profiles.city}
                              </p>
                            )}
                            {resp.profiles?.latitude && resp.profiles?.longitude && (
                              <a
                                href={`https://www.google.com/maps?q=${resp.profiles.latitude},${resp.profiles.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-end gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                              >
                                <ExternalLink size={12} /> View on Maps
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {req.status === 'closed' && (
                      <p className="text-center text-xs text-slate-500 py-1">This request has been closed</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button
            type="button"
            aria-label="Close image preview"
            className="absolute top-5 right-5 text-slate-200 hover:text-white"
            onClick={() => setPreviewImage(null)}
          >
            <XCircle size={28} />
          </button>
          <img
            src={previewImage}
            alt="Request"
            className="max-h-[85vh] max-w-[95vw] rounded-2xl border border-slate-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
