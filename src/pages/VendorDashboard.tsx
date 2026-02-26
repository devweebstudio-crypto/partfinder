import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { CheckCircle, XCircle, MapPin, Building2, Clock, Tag, ExternalLink, Plus, AlertCircle, X } from 'lucide-react'

interface Request {
  id: string
  client_id: string | null
  vendor_id: string | null
  part_name: string
  category: string
  description: string
  image_url: string | null
  preferred_company: string | null
  area_city: string | null
  area_state: string | null
  area_radius: number | null
  latitude: number | null
  longitude: number | null
  status: string
  created_at: string
  closed_at: string | null
  my_response?: { status: string } | null
  responses?: Array<{ request_id: string; vendor_id: string; status: string }>
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

export default function VendorDashboard() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [requests, setRequests] = useState<Request[]>([])
  const [myCreatedRequests, setMyCreatedRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)
  const [showLocationBar, setShowLocationBar] = useState(true)
  const [mainTab, setMainTab] = useState<'client' | 'my'>('client')
  const [clientTab, setClientTab] = useState<'new' | 'accepted' | 'closed' | 'completed' | 'rejected' | 'all'>('new')
  const [myTab, setMyTab] = useState<'open' | 'accepted' | 'completed' | 'closed' | 'all'>('open')
  const [searchQuery, setSearchQuery] = useState('')
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [showPhoneModal, setShowPhoneModal] = useState(false)
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null)
  const [phoneInput, setPhoneInput] = useState('')

  const fetchRequests = async () => {
    if (!user) return
    // Get all requests + check if vendor already responded
    const { data: allRequests } = await supabase
      .from('requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (!allRequests) { setLoading(false); return }


    // Get MY responses to OTHER people's requests (for Client Requests tab)
    const { data: myResponses } = await supabase
      .from('request_responses')
      .select('request_id, status')
      .eq('vendor_id', user.id)

    const responseMap = new Map(myResponses?.map(r => [r.request_id, r]) || [])

    // Get ALL responses to MY requests (for My Requests tab)
    const myRequestIds = allRequests.filter((r: any) => r.vendor_id === user.id).map((r: any) => r.id)
    const { data: responsesToMyRequests } = myRequestIds.length > 0 ? await supabase
      .from('request_responses')
      .select('request_id, vendor_id, status')
      .in('request_id', myRequestIds) : { data: [] }

    // Group responses by request_id
    const myRequestResponsesMap = new Map()
    responsesToMyRequests?.forEach(res => {
      if (!myRequestResponsesMap.has(res.request_id)) {
        myRequestResponsesMap.set(res.request_id, [])
      }
      myRequestResponsesMap.get(res.request_id).push(res)
    })

    const enriched = allRequests.map(r => ({
      ...r,
      my_response: responseMap.get(r.id) || null,
      responses: myRequestResponsesMap.get(r.id) || []
    }))

    // Separate CLIENT requests from VENDOR's OWN created requests
    const clientRequests = enriched.filter((r: any) => r.client_id !== null && r.vendor_id === null)
    const myCreatedRequests = enriched.filter((r: any) => r.vendor_id === user.id)


    // Filter client requests based on vendor location
    const vendorLat = profile?.latitude
    const vendorLng = profile?.longitude
    const vendorCity = profile?.city
    const vendorState = profile?.state


    // Filter client requests based on location matching
    const visibleRequests = clientRequests.filter(req => {
      // Radius takes priority if set and coordinates exist
      if (req.area_radius && req.area_radius > 0) {
        if (vendorLat && vendorLng && req.latitude && req.longitude) {
          const toRad = (v: number) => v * Math.PI / 180
          const R = 6371 // Earth radius in km
          const dLat = toRad(req.latitude - vendorLat)
          const dLon = toRad(req.longitude - vendorLng)
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
                    Math.cos(toRad(vendorLat)) * Math.cos(toRad(req.latitude)) * 
                    Math.sin(dLon/2) * Math.sin(dLon/2)
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
          const dist = R * c
          return dist <= req.area_radius
        }
        // If coordinates missing, fall through to city/state matching
      }

      const vendorCityNorm = vendorCity?.toLowerCase().trim()
      const vendorStateNorm = vendorState?.toLowerCase().trim()
      const reqCityNorm = req.area_city?.toLowerCase().trim()
      const reqStateNorm = req.area_state?.toLowerCase().trim()

      const cityMatch = !!(vendorCityNorm && reqCityNorm && (
        vendorCityNorm === reqCityNorm ||
        vendorCityNorm.includes(reqCityNorm) ||
        reqCityNorm.includes(vendorCityNorm)
      ))

      const stateMatch = !!(vendorStateNorm && reqStateNorm && (
        vendorStateNorm === reqStateNorm ||
        vendorStateNorm.includes(reqStateNorm) ||
        reqStateNorm.includes(vendorStateNorm)
      ))

      // If any location fields are set, accept city OR state match
      if (reqCityNorm || reqStateNorm) {
        return cityMatch || stateMatch
      }

      // No location restriction = "All India" - show to everyone
      return true
    })


    setRequests(visibleRequests)
    setMyCreatedRequests(myCreatedRequests)
    setLoading(false)
  }

  useEffect(() => { fetchRequests() }, [user, profile])

  const respond = async (requestId: string, status: 'accepted' | 'rejected' | 'completed') => {
    if (!user) return
    
    // If accepting and no phone, show modal instead
    if (status === 'accepted' && !profile?.phone) {
      setPendingRequestId(requestId)
      setPhoneInput('')
      setShowPhoneModal(true)
      return
    }

    setActing(requestId)
    
    try {
      // Check if already responded
      const existing = requests.find(r => r.id === requestId)?.my_response
      if (existing) {
        await supabase.from('request_responses')
          .update({ status })
          .eq('request_id', requestId)
          .eq('vendor_id', user.id)
      } else {
        await supabase.from('request_responses').insert({
          request_id: requestId,
          vendor_id: user.id,
          status
        })
      }

      // Notify client for accepted, rejected, or completed actions
      if (status === 'accepted' || status === 'rejected' || status === 'completed') {
        const request = requests.find(r => r.id === requestId)
        if (request?.client_id) {
          try {
            const notificationData = {
              vendor_id: user.id,
              client_id: request.client_id,
              request_id: requestId
            }
            console.log('📤 Inserting notification (vendor→client):', notificationData)
            const { data, error: notifyError } = await supabase.from('notifications').insert(notificationData).select()
            if (notifyError) {
              console.error('❌ Notification insert error:', notifyError)
            } else {
              console.log(`✅ Client notified of vendor ${status} action`, data)
            }
          } catch (err) {
            console.error('Error inserting notification:', err)
          }
        }
      }

      await fetchRequests()
      setActing(null)
    } catch (err) {
      console.error('Error in respond:', err)
      setActing(null)
    }
  }

  const handlePhoneSubmit = async () => {
    if (!phoneInput.trim() || !user || !pendingRequestId) return
    
    setActing(pendingRequestId)
    try {
      // Update phone in profile
      const { error: updateError } = await supabase.from('profiles')
        .update({ phone: phoneInput.trim() })
        .eq('id', user.id)
      
      if (updateError) throw updateError
      
      // Now proceed with accepting the request
      const existing = requests.find(r => r.id === pendingRequestId)?.my_response
      if (existing) {
        await supabase.from('request_responses')
          .update({ status: 'accepted' })
          .eq('request_id', pendingRequestId)
          .eq('vendor_id', user.id)
      } else {
        await supabase.from('request_responses').insert({
          request_id: pendingRequestId,
          vendor_id: user.id,
          status: 'accepted'
        })
      }

      // Notify client
      const request = requests.find(r => r.id === pendingRequestId)
      if (request?.client_id) {
        try {
          const notificationData = {
            vendor_id: user.id,
            client_id: request.client_id,
            request_id: pendingRequestId
          }
          await supabase.from('notifications').insert(notificationData)
        } catch (err) {
          console.error('Error inserting notification:', err)
        }
      }

      setShowPhoneModal(false)
      setPendingRequestId(null)
      setPhoneInput('')
      await fetchRequests()
      setActing(null)
    } catch (err) {
      console.error('Error:', err)
      setActing(null)
    }
  }

  const closeRequest = async (requestId: string) => {
    if (!user) return
    setActing(requestId)
    
    try {
      const { error } = await supabase
        .from('requests')
        .update({ status: 'closed', closed_at: new Date().toISOString() })
        .eq('id', requestId)
        .eq('vendor_id', user.id)

      if (error) throw error

      await fetchRequests()
      setActing(null)
    } catch (err) {
      console.error('Error closing request:', err)
      setActing(null)
    }
  }

  const filtered = (() => {
    const isMyRequests = mainTab === 'my'
    const requestList = isMyRequests ? myCreatedRequests : requests
    
    return requestList.filter(r => {
      let tabMatch = false
      if (!isMyRequests) {
        // Client Requests tab - shows requests from clients
        const responseStatus = r.my_response?.status
        const hasKnownResponse = responseStatus === 'accepted' || responseStatus === 'rejected' || responseStatus === 'completed'

        if (clientTab === 'new') tabMatch = r.status === 'open' && !hasKnownResponse
        else if (clientTab === 'accepted') tabMatch = responseStatus === 'accepted'
        else if (clientTab === 'completed') tabMatch = responseStatus === 'completed'
        else if (clientTab === 'rejected') tabMatch = responseStatus === 'rejected'
        else if (clientTab === 'closed') tabMatch = r.status === 'closed'
        else tabMatch = true // 'all' tab
      } else {
        // My Requests tab - shows requests created by this vendor
        const hasAccepted = !!(r.responses?.some((res: any) => res.status === 'accepted'))
        const hasCompleted = !!(r.responses?.some((res: any) => res.status === 'completed'))
        
        if (myTab === 'open') tabMatch = r.status === 'open' && !hasAccepted && !hasCompleted
        else if (myTab === 'accepted') tabMatch = r.status === 'open' && hasAccepted
        else if (myTab === 'completed') tabMatch = r.status === 'open' && hasCompleted
        else if (myTab === 'closed') tabMatch = r.status === 'closed'
        else tabMatch = true // 'all' tab
      }

      if (!tabMatch) return false

      // Search filtering
      if (!searchQuery.trim()) return true
      const query = searchQuery.toLowerCase().trim()
      return r.part_name.toLowerCase().includes(query) || 
             r.category.toLowerCase().includes(query) ||
             r.description.toLowerCase().includes(query)
    })
  })()

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="site-container py-10">
      {/* Location & Business Details Validation Banner */}
      {showLocationBar && (!profile?.latitude || !profile?.longitude || !profile?.business_name || !profile?.category || !profile?.city) && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-4 mb-8 flex items-start gap-4">
          <AlertCircle className="text-amber-400 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <h3 className="font-semibold text-amber-300 mb-1">Location & Business Details Incomplete</h3>
            <p className="text-amber-200/80 text-sm mb-3">
              Please complete your business profile with location, business name, category, and city details. This helps clients find you and improves your visibility in their search results.
            </p>
            <button 
              onClick={() => navigate('/profile/edit')}
              className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              Complete Profile
            </button>
          </div>
          <button 
            onClick={() => setShowLocationBar(false)}
            className="text-amber-400 hover:text-amber-300 flex-shrink-0 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display font-bold text-3xl text-white">{profile?.business_name || 'Vendor Dashboard'}</h1>
          <p className="text-slate-400 mt-1">{profile?.category} · {profile?.city}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <button onClick={() => window.location.href = '/vendor/request'} className="btn-primary flex items-center gap-2 text-sm px-4 py-2 w-full sm:w-auto justify-center">
            <Plus size={16} /> Request Part
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'New Requests', value: requests.filter(r => r.status === 'open' && !r.my_response).length, color: 'text-brand-400' },
          { label: 'Accepted', value: requests.filter(r => r.my_response?.status === 'accepted' || r.my_response?.status === 'completed').length, color: 'text-green-400' },
          { label: 'Closed', value: requests.filter(r => r.status === 'closed').length, color: 'text-slate-400' },
          { label: 'My Requests', value: myCreatedRequests.length, color: 'text-purple-400' },
          { label: 'Total Requests', value: requests.length, color: 'text-blue-400' },
        ].map(stat => (
          <div key={stat.label} className="card text-center">
            <div className={`font-display font-bold text-3xl ${stat.color}`}>{stat.value}</div>
            <div className="text-slate-500 text-sm mt-1">{stat.label}</div>
          </div>
        ))}
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
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {([
          ['client', 'Client Requests'],
          ['my', 'My Requests']
        ] as const).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setMainTab(val)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${mainTab === val ? 'bg-brand-500 text-white' : 'bg-slate-800/50 text-slate-400 hover:text-white'}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex gap-1 bg-slate-800/50 p-1 rounded-xl mb-6 w-full sm:w-fit overflow-x-auto">
        {mainTab === 'client' ? (
          [
            ['new', 'New'],
            ['accepted', 'Accepted'],
            ['completed', 'Completed'],
            ['closed', 'Closed'],
            ['rejected', 'Rejected'],
            ['all', 'All']
          ] as const
        ).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setClientTab(val)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${clientTab === val ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            {label}
          </button>
        )) : (
          [
            ['open', 'Open'],
            ['accepted', 'Accepted'],
            ['completed', 'Completed'],
            ['closed', 'Closed'],
            ['all', 'All']
          ] as const
        ).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setMyTab(val)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${myTab === val ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="font-display font-semibold text-white text-xl mb-2">No requests here</h3>
          <p className="text-slate-400">
            {mainTab === 'client' && clientTab === 'new' ? 'No new requests at the moment. Check back soon!' :
             mainTab === 'my' && myTab === 'open' ? 'You haven\'t created any open part requests yet. Click "Request Part" to get started!' :
             'Nothing to show in this tab.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(req => {
            const mainCategory = getMainCategory(req.category)
            const locationLabel = req.area_city || req.area_state || 'All India'
            const radiusLabel = req.area_radius ? ` (${req.area_radius}km radius)` : ''

            return (
            <div key={req.id} className="card hover:border-slate-700 transition-all animate-slide-up">
              <div className="flex gap-4">
                {req.image_url && (
                  <img
                    src={req.image_url}
                    alt={req.part_name}
                    className="w-20 h-20 rounded-xl object-cover flex-shrink-0 cursor-pointer"
                    onClick={() => setPreviewImage(req.image_url)}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2 text-xs text-slate-400">
                    <span className={req.status === 'open' ? 'badge-open' : 'badge-closed'}>{req.status}</span>
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
                    {req.my_response?.status === 'accepted' && (
                      <span className="text-xs text-green-400 font-medium bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">You Accepted</span>
                    )}
                    {req.my_response?.status === 'rejected' && (
                      <span className="text-xs text-red-400 font-medium bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">You Rejected</span>
                    )}
                    {req.my_response?.status === 'completed' && (
                      <span className="text-xs text-blue-400 font-medium bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">Completed</span>
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
                  <p className="text-slate-400 text-sm mt-1">{req.description}</p>

                  <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><MapPin size={12} /> Location: {locationLabel}{radiusLabel}</span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> Request Date: {new Date(req.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {req.latitude && req.longitude && (
                    <a
                      href={`https://www.google.com/maps?q=${req.latitude},${req.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <ExternalLink size={12} /> View Request Location on Map
                    </a>
                  )}
                </div>
              </div>

              {/* Action buttons - only for client requests */}
              {mainTab === 'client' && req.status === 'open' && !req.my_response?.status && (
                <div className="flex gap-3 mt-4 pt-4 border-t border-slate-800">
                  <button
                    onClick={() => respond(req.id, 'accepted')}
                    disabled={acting === req.id}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 hover:border-green-500/40"
                  >
                    <CheckCircle size={16} /> Accept
                  </button>
                  <button
                    onClick={() => respond(req.id, 'rejected')}
                    disabled={acting === req.id}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all bg-slate-800 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/30"
                  >
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              )}
              {mainTab === 'client' && req.status === 'open' && req.my_response?.status === 'accepted' && (
                <div className="flex gap-3 mt-4 pt-4 border-t border-slate-800">
                  <button
                    onClick={() => respond(req.id, 'completed')}
                    disabled={acting === req.id}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 hover:border-blue-500/40"
                  >
                    <CheckCircle size={16} /> Mark Completed
                  </button>
                  <button
                    onClick={() => respond(req.id, 'rejected')}
                    disabled={acting === req.id}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all bg-slate-800 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/30"
                  >
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              )}

              {/* Action buttons - for vendor's own requests */}
              {mainTab === 'my' && req.status === 'open' && (
                <div className="flex gap-3 mt-4 pt-4 border-t border-slate-800">
                  <button
                    onClick={() => closeRequest(req.id)}
                    disabled={acting === req.id}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40"
                  >
                    <XCircle size={16} /> Close Request
                  </button>
                </div>
              )}

              {/* Show vendor responses for My Requests */}
              {mainTab === 'my' && req.responses && req.responses.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <h4 className="text-sm font-semibold text-slate-300 mb-2">Vendor Responses ({req.responses.length})</h4>
                  <div className="space-y-2">
                    {req.responses.map((response: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-800/30 p-2 rounded-lg">
                        <span className="text-sm text-slate-400">Vendor #{idx + 1}</span>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          response.status === 'accepted' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                          response.status === 'completed' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {response.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {req.status === 'closed' && (
                <div className="text-center text-xs text-slate-600 mt-3 pt-3 border-t border-slate-800">
                  <p>{mainTab === 'client' ? 'This request has been closed by the client' : 'This request is closed'}</p>
                  {req.closed_at && (
                    <p className="text-slate-700 mt-1">
                      Closed on {new Date(req.closed_at).toLocaleDateString('en-IN', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                </div>
              )}
            </div>
          )})}
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

      {/* Phone Number Modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl max-w-md w-full p-6">
            <h2 className="font-display font-semibold text-white text-lg mb-2">Phone Number Required</h2>
            <p className="text-slate-400 text-sm mb-4">We need your mobile number to accept this request. This will be saved to your profile.</p>
            
            <div className="space-y-4">
              <input
                type="tel"
                value={phoneInput}
                onChange={e => setPhoneInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handlePhoneSubmit()}
                placeholder="Enter your mobile number"
                className="input"
                autoFocus
              />
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPhoneModal(false)
                    setPendingRequestId(null)
                    setPhoneInput('')
                    setActing(null)
                  }}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePhoneSubmit}
                  disabled={!phoneInput.trim()}
                  className="flex-1 btn-primary"
                >
                  Save & Accept
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
