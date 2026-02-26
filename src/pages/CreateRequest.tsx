import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { MapPin, Upload, X, Loader, LogIn, Users } from 'lucide-react'
import MapPicker from '../components/MapPicker'

const MAIN_CATEGORIES = {
  'Automobile': [
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
  'Electronics': [
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

const DEFAULT_MAIN = 'Automobile'
const DEFAULT_CATEGORY = 'Engine Parts'

const RADIUS_OPTIONS = [
  { label: '5 km', value: 5 },
  { label: '10 km', value: 10 },
  { label: '50 km', value: 50 },
  { label: 'City', value: 0 },
  { label: 'In State', value: 'state' },
  { label: 'All India', value: 'india' },
]

export default function CreateRequest() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [locating, setLocating] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  
  // Quick login modal state
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [pendingSubmit, setPendingSubmit] = useState(false)
  const [showRegisterOption, setShowRegisterOption] = useState(false)
  const [loginRole, setLoginRole] = useState<'client' | 'vendor'>('client')

  const [form, setForm] = useState({
    main_category: DEFAULT_MAIN,
    category: DEFAULT_CATEGORY,
    part_name: '',
    description: '',
    preferred_company: '',
    radius: 10 as number | 'state' | 'india' | 0,
    area_city: '',
    area_state: '',
    latitude: null as number | null,
    longitude: null as number | null,
    vendor_preference: 'all' as 'all' | 'authorised' | 'local'
  })

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const [vendorCount, setVendorCount] = useState<number | null>(null)
  const [vendorCounts, setVendorCounts] = useState({ all: 0, authorised: 0, local: 0 })
  const [showConfirmation, setShowConfirmation] = useState(false)

  // When a place is selected on the map, set city/state automatically
  const onMapPlace = (place: { display_name?: string; city?: string; state?: string } | undefined) => {
    if (!place) {
      console.log('onMapPlace called with undefined/null place')
      return
    }
    console.log('onMapPlace received:', place)
    if (place.city) {
      console.log('Setting area_city to:', place.city)
      set('area_city', place.city)
    }
    if (place.state) {
      console.log('Setting area_state to:', place.state)
      set('area_state', place.state)
    }
  }

  const computeNearby = async () => {
    try {
      // Get vendors and exclude those without location
      const { data: vendors } = await supabase.from('profiles').select('id, latitude, longitude, city, state, authorized_dealer').eq('role', 'vendor')
      if (!vendors) { 
        setVendorCount(0)
        setVendorCounts({ all: 0, authorised: 0, local: 0 })
        return 
      }
      
      // Filter out vendors without location (latitude/longitude must be set)
      let vendorsWithLocation = vendors.filter((v: any) => v.latitude && v.longitude)
      
      // Filter vendors based on location
      let locationFilteredVendors = vendorsWithLocation
      
      if (form.radius === 0 && form.area_city) {
        const searchCity = form.area_city.toLowerCase().trim()
        locationFilteredVendors = vendorsWithLocation.filter((v: any) => {
          if (!v.city) return false
          const vendorCity = v.city.toLowerCase().trim()
          return vendorCity.includes(searchCity) || searchCity.includes(vendorCity)
        })
      } else if (form.radius === 'state' && form.area_state) {
        const searchState = form.area_state.toLowerCase().trim()
        locationFilteredVendors = vendorsWithLocation.filter((v: any) => {
          if (!v.state) return false
          const vendorState = v.state.toLowerCase().trim()
          return vendorState.includes(searchState) || searchState.includes(vendorState)
        })
      } else if (form.radius === 'india') {
        locationFilteredVendors = vendorsWithLocation
      } else if (form.latitude && form.longitude && typeof form.radius === 'number' && form.radius > 0) {
        const toRad = (v: number) => v * Math.PI / 180
        const R = 6371
        const lat = form.latitude
        const lng = form.longitude
        const rad = form.radius
        locationFilteredVendors = vendors.filter((v: any) => {
          if (!v.latitude || !v.longitude) return false
          const dLat = toRad(v.latitude - lat)
          const dLon = toRad(v.longitude - lng)
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
                    Math.cos(toRad(lat)) * Math.cos(toRad(v.latitude)) * 
                    Math.sin(dLon/2) * Math.sin(dLon/2)
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
          const dist = R * c
          return dist <= rad
        })
      } else {
        locationFilteredVendors = []
      }
      
      // Calculate counts for each vendor preference
      const allCount = locationFilteredVendors.length
      const authorisedCount = locationFilteredVendors.filter((v: any) => v.authorized_dealer).length
      const localCount = locationFilteredVendors.filter((v: any) => !v.authorized_dealer).length
      
      setVendorCount(allCount)
      setVendorCounts({
        all: allCount,
        authorised: authorisedCount,
        local: localCount
      })
    } catch (e) { 
      setVendorCount(null)
      setVendorCounts({ all: 0, authorised: 0, local: 0 })
    }
  }

  // Recompute when relevant fields change
  useEffect(() => { computeNearby() }, [form.latitude, form.longitude, form.radius, form.area_city, form.area_state])

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const getLocation = () => {
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        set('latitude', pos.coords.latitude)
        set('longitude', pos.coords.longitude)
        setLocating(false)
      },
      () => {
        setError('Location access denied. Please enter city instead.')
        setLocating(false)
      }
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // If not logged in, show quick login modal
    if (!user) {
      setShowLoginModal(true)
      setPendingSubmit(true)
      return
    }
    
    // Check if vendor count is 0 and show confirmation
    if (vendorCount === 0) {
      setShowConfirmation(true)
      return
    }

    // Proceed with submission
    await proceedSubmit()
  }

  const handleQuickLogin = async () => {
    setLoginLoading(true)
    setLoginError('')
    setShowRegisterOption(false)
    
    // Validate inputs
    if (!loginEmail || !loginEmail.includes('@')) {
      setLoginError('Please enter a valid email address.')
      setLoginLoading(false)
      return
    }
    
    if (!loginPassword || loginPassword.length < 6) {
      setLoginError('Password must be at least 6 characters long.')
      setLoginLoading(false)
      return
    }
    
    try {
      // Sign in with email and password
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword,
      })
      
      if (signInError) {
        // If user not found, show registration option
        if (signInError.message.includes('Invalid login credentials') || 
            signInError.message.includes('Email not confirmed') ||
            signInError.message.includes('Invalid email or password')) {
          setLoginError('User not found with these credentials. Register below to continue.')
          setShowRegisterOption(true)
          setLoginLoading(false)
          return
        }
        throw signInError
      }
      
      // Wait for auth context to update
      await new Promise(resolve => setTimeout(resolve, 300))
      await refreshProfile()
      
      // Close login modal
      setShowLoginModal(false)
      setLoginLoading(false)
      
      // If this was triggered by a pending submit, proceed with submission
      if (pendingSubmit) {
        setPendingSubmit(false)
        // Small delay to ensure context is ready
        setTimeout(async () => {
          // Check vendor count again before submitting
          if (vendorCount === 0) {
            setShowConfirmation(true)
          } else {
            await proceedSubmit()
          }
        }, 200)
      }
    } catch (err: any) {
      console.error('Login error:', err)
      setLoginError(err.message || 'Login failed. Please check your credentials.')
      setLoginLoading(false)
    }
  }
  
  const handleQuickRegister = async () => {
    setLoginLoading(true)
    setLoginError('')
    
    // Validate inputs
    if (!loginEmail || !loginEmail.includes('@')) {
      setLoginError('Please enter a valid email address.')
      setLoginLoading(false)
      return
    }
    
    if (!loginPassword || loginPassword.length < 6) {
      setLoginError('Password must be at least 6 characters long.')
      setLoginLoading(false)
      return
    }
    
    try {
      // Sign up with email and password
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: loginEmail.trim(),
        password: loginPassword,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            role: loginRole
          }
        }
      })
      
      if (signUpError) throw signUpError
      
      if (!authData.user) {
        throw new Error('Registration failed. Please try again.')
      }
      
      // Create profile with selected role
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        email: loginEmail.trim(),
        role: loginRole,
        full_name: loginEmail.split('@')[0], // Default name from email
      })
      
      if (profileError) {
        console.error('Profile creation error:', profileError)
        // Continue anyway as the trigger might have created it
      }
      
      // Wait for auth context to update
      await new Promise(resolve => setTimeout(resolve, 500))
      await refreshProfile()
      
      // Close login modal
      setShowLoginModal(false)
      setShowRegisterOption(false)
      setLoginLoading(false)
      
      // If this was triggered by a pending submit, proceed with submission
      if (pendingSubmit) {
        setPendingSubmit(false)
        // Ensure user is properly set before submitting
        setTimeout(async () => {
          try {
            console.log('✅ Registration successful, now submitting request...')
            // Check vendor count again before submitting
            if (vendorCount === 0) {
              setShowConfirmation(true)
            } else {
              await proceedSubmit()
            }
          } catch (submitErr) {
            console.error('Submit error after registration:', submitErr)
            // Even if submit fails, redirect to dashboard
            navigate('/dashboard')
          }
        }, 1000)
      } else {
        // If not submitting, just redirect to dashboard
        console.log('✅ Registration successful, redirecting to dashboard...')
        setTimeout(() => {
          navigate('/dashboard')
        }, 800)
      }
    } catch (err: any) {
      console.error('Registration error:', err)
      setLoginError(err.message || 'Registration failed. Please try again.')
      setLoginLoading(false)
    }
  }
  
  const proceedSubmit = async () => {
    setShowConfirmation(false)
    setLoading(true)
    setError('')

    // Get current user from session (more reliable than hook during registration)
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    
    if (!currentUser && !user) {
      setError('Please sign in to submit a request.')
      setLoading(false)
      return
    }
    
    const userId = currentUser?.id || user?.id

    try {
      let image_url = null

      if (imageFile) {
        const ext = imageFile.name.split('.').pop()
        const path = `requests/${userId}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('request-images')
          .upload(path, imageFile)
        if (uploadError) throw uploadError
        const { data } = supabase.storage.from('request-images').getPublicUrl(path)
        image_url = data.publicUrl
      }

      const { error: insertError } = await supabase.from('requests').insert({
        client_id: userId,
        category: form.category,
        part_name: form.part_name,
        description: form.description,
        image_url,
        preferred_company: form.preferred_company || null,
        area_radius: typeof form.radius === 'number' ? form.radius : null,
        area_city: form.area_city || null,
        area_state: form.area_state || null,
        latitude: form.latitude,
        longitude: form.longitude,
        vendor_preference: form.vendor_preference,
        status: 'open',
      })

      if (insertError) throw insertError

      // Notify vendors nearby using the request's location (form.latitude, form.longitude)
      try {
        const { data: lastReq } = await supabase.from('requests').select('id').order('created_at', { ascending: false }).limit(1)
        const reqId = lastReq?.[0]?.id
        if (reqId) {
          let vendorIds: string[] = []
          if (form.radius === 0 && form.area_city) {
            const { data: vendors } = await supabase.from('profiles').select('id, latitude, longitude, authorized_dealer').eq('role', 'vendor').ilike('city', `%${form.area_city}%`)
            let filtered = (vendors || []).filter((v: any) => v.latitude && v.longitude)
            if (form.vendor_preference === 'authorised') {
              filtered = filtered.filter((v: any) => v.authorized_dealer)
            } else if (form.vendor_preference === 'local') {
              filtered = filtered.filter((v: any) => !v.authorized_dealer)
            }
            vendorIds = filtered.map((v: any) => v.id)
          } else if (form.radius === 'state' && form.area_state) {
            const { data: vendors } = await supabase.from('profiles').select('id, latitude, longitude, authorized_dealer').eq('role', 'vendor').ilike('state', `%${form.area_state}%`)
            let filtered = (vendors || []).filter((v: any) => v.latitude && v.longitude)
            if (form.vendor_preference === 'authorised') {
              filtered = filtered.filter((v: any) => v.authorized_dealer)
            } else if (form.vendor_preference === 'local') {
              filtered = filtered.filter((v: any) => !v.authorized_dealer)
            }
            vendorIds = filtered.map((v: any) => v.id)
          } else if (form.radius === 'india') {
            const { data: vendors } = await supabase.from('profiles').select('id, latitude, longitude, authorized_dealer').eq('role', 'vendor')
            let filtered = (vendors || []).filter((v: any) => v.latitude && v.longitude)
            if (form.vendor_preference === 'authorised') {
              filtered = filtered.filter((v: any) => v.authorized_dealer)
            } else if (form.vendor_preference === 'local') {
              filtered = filtered.filter((v: any) => !v.authorized_dealer)
            }
            vendorIds = filtered.map((v: any) => v.id)
          } else if (form.latitude && form.longitude && typeof form.radius === 'number' && form.radius > 0) {
            const { data: vendors } = await supabase.from('profiles').select('id, latitude, longitude, authorized_dealer').eq('role', 'vendor').not('latitude', 'is', null).not('longitude', 'is', null)
            const toRad = (v: number) => v * Math.PI / 180
            const R = 6371
            let filtered = []
            for (const v of (vendors || [])) {
              const dLat = toRad(v.latitude - form.latitude)
              const dLon = toRad(v.longitude - form.longitude)
              const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(form.latitude)) * Math.cos(toRad(v.latitude)) * Math.sin(dLon/2) * Math.sin(dLon/2)
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
              const dist = R * c
              if (dist <= form.radius) filtered.push(v)
            }
            if (form.vendor_preference === 'authorised') {
              filtered = filtered.filter((v: any) => v.authorized_dealer)
            } else if (form.vendor_preference === 'local') {
              filtered = filtered.filter((v: any) => !v.authorized_dealer)
            }
            vendorIds = filtered.map((v: any) => v.id)
          }
          if (vendorIds.length) {
            try {
              const notificationsToInsert = vendorIds.map((id: string) => ({
                vendor_id: id,
                client_id: null,
                request_id: reqId
              }))
              console.log('📤 Inserting notifications (client→vendors):', notificationsToInsert)
              const { data, error: notifyError } = await supabase.from('notifications').insert(notificationsToInsert).select()
              if (notifyError) {
                console.error('❌ Notification insert error:', notifyError)
              } else {
                console.log(`✅ Notified ${vendorIds.length} vendors for request ${reqId}`, data)
              }
            } catch (err) {
              console.error('Error inserting notifications:', err)
            }
          }
        }
      } catch (notifyErr) {
        console.warn('Notification error', notifyErr)
      }

      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to submit request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="site-container py-10">
        <div className="mb-8">
          <h1 className="font-display font-bold text-3xl text-white mb-1">New Part Request</h1>
          <p className="text-slate-400">Fill in the details and nearby vendors will respond. {!user && <span className="text-brand-400">Login required only when submitting.</span>}</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 mb-6 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card space-y-5">
          <h2 className="font-display font-semibold text-white">Part Details</h2>

          <div>
            <label className="label">Main Category *</label>
            <select 
              className="input" 
              value={form.main_category} 
              onChange={e => {
                set('main_category', e.target.value)
                const subs = MAIN_CATEGORIES[e.target.value as keyof typeof MAIN_CATEGORIES] || []
                set('category', subs[0] || '')
              }}
            >
              {Object.keys(MAIN_CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Sub Category *</label>
            <select 
              className="input" 
              value={form.category} 
              onChange={e => set('category', e.target.value)}
            >
              {(MAIN_CATEGORIES[form.main_category as keyof typeof MAIN_CATEGORIES] || []).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Required Part Name *</label>
            <input className="input" required value={form.part_name} onChange={e => set('part_name', e.target.value)} placeholder="e.g. Clutch Plate for Honda City 2019" />
          </div>

          <div>
            <label className="label">Description *</label>
            <textarea className="input resize-none" required rows={4} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Provide details about the condition, specifications, urgency, etc." />
          </div>

          <div>
            <label className="label">Preferred Company / Brand</label>
            <input className="input" value={form.preferred_company} onChange={e => set('preferred_company', e.target.value)} placeholder="e.g. Bosch, Minda, OEM..." />
          </div>

          {/* Image upload */}
          <div>
            <label className="label">Image (Optional)</label>
            {imagePreview ? (
              <div className="relative inline-block">
                <img src={imagePreview} alt="Preview" className="h-40 rounded-xl object-cover border border-slate-700" />
                <button type="button" onClick={() => { setImageFile(null); setImagePreview('') }} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <X size={12} className="text-white" />
                </button>
              </div>
            ) : (
              <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-slate-700 hover:border-slate-600 rounded-xl p-8 cursor-pointer text-center transition-colors">
                <Upload size={24} className="text-slate-500 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">Click to upload image</p>
                <p className="text-slate-600 text-xs mt-1">PNG, JPG up to 5MB</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
          </div>
        </div>

        {/* Location */}
        <div className="card space-y-5">
          <h2 className="font-display font-semibold text-white">Search Area</h2>

          <div>
            <label className="label">Your Location</label>
            <div className="relative" style={{ maxWidth: '100%' }}>
              <MapPicker latitude={form.latitude} longitude={form.longitude} onChange={(lat, lng) => { set('latitude', lat); set('longitude', lng) }} onPlace={onMapPlace} height={320} />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-3">
              <button type="button" onClick={getLocation} disabled={locating} className="btn-secondary flex items-center gap-2 text-sm py-2.5 w-full justify-center">
                {locating ? <Loader size={16} className="animate-spin" /> : <MapPin size={16} />}
                {form.latitude ? `📍 ${form.latitude.toFixed(4)}, ${form.longitude?.toFixed(4)}` : 'Detect My Location'}
              </button>
              <button type="button" onClick={() => { set('latitude', null); set('longitude', null); set('area_city', ''); set('area_state', '') }} className="btn-secondary w-full sm:w-24">Clear</button>
            </div>
            <p className="text-slate-600 text-xs mt-2">Use the search box (top-left) to find your location and auto-populate city/state. You can also manually type city/state or click to pin coordinates only.</p>
          </div>

          <div>
            <label className="label">Vendor Search Radius</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {RADIUS_OPTIONS.map(opt => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => set('radius', opt.value)}
                  className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${form.radius === opt.value ? 'bg-brand-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {vendorCount !== null && (
              <div className="text-slate-400 text-sm mt-2">Vendors found: <span className="font-semibold text-white">{vendorCount}</span></div>
            )}
          </div>

          <div>
            <label className="label mb-4">Vendor Type Preference</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => set('vendor_preference', 'all')}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  form.vendor_preference === 'all'
                    ? 'border-brand-500 bg-brand-500/10'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Users size={20} className={form.vendor_preference === 'all' ? 'text-brand-400' : 'text-slate-400'} />
                  <span className="font-semibold text-white">All</span>
                </div>
                <div className={`text-sm ${form.vendor_preference === 'all' ? 'text-brand-300' : 'text-slate-400'}`}>
                  All vendors in area
                </div>
                <div className="mt-2 text-xs font-bold text-white bg-slate-900/60 px-2 py-1 rounded inline-block">
                  {vendorCounts.all} vendors
                </div>
              </button>

              <button
                type="button"
                onClick={() => set('vendor_preference', 'authorised')}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  form.vendor_preference === 'authorised'
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Users size={20} className={form.vendor_preference === 'authorised' ? 'text-green-400' : 'text-slate-400'} />
                  <span className="font-semibold text-white">Authorised</span>
                </div>
                <div className={`text-sm ${form.vendor_preference === 'authorised' ? 'text-green-300' : 'text-slate-400'}`}>
                  Certified dealers only
                </div>
                <div className="mt-2 text-xs font-bold text-white bg-slate-900/60 px-2 py-1 rounded inline-block">
                  {vendorCounts.authorised} vendors
                </div>
              </button>

              <button
                type="button"
                onClick={() => set('vendor_preference', 'local')}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  form.vendor_preference === 'local'
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Users size={20} className={form.vendor_preference === 'local' ? 'text-purple-400' : 'text-slate-400'} />
                  <span className="font-semibold text-white">Local</span>
                </div>
                <div className={`text-sm ${form.vendor_preference === 'local' ? 'text-purple-300' : 'text-slate-400'}`}>
                  All local vendors in area
                </div>
                <div className="mt-2 text-xs font-bold text-white bg-slate-900/60 px-2 py-1 rounded inline-block">
                  {vendorCounts.local} vendors
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="label">Area / City</label>
            <input className="input" value={form.area_city} onChange={e => set('area_city', e.target.value)} placeholder="e.g. Mumbai, Pune, Delhi..." />
            <input className="input mt-2" value={form.area_state} onChange={e => set('area_state', e.target.value)} placeholder="State (e.g. Maharashtra, Karnataka)" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary flex-1 py-3.5">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 py-3.5 flex items-center justify-center gap-2">
            {loading ? <Loader size={18} className="animate-spin" /> : 'Submit Request'}
          </button>
        </div>
      </form>

      {/* Quick Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-brand-500/20 rounded-lg flex items-center justify-center">
                <LogIn size={20} className="text-brand-400" />
              </div>
              <h2 className="font-display font-semibold text-xl text-white">Quick Login to Continue</h2>
            </div>
            <p className="text-slate-400 mb-6 text-sm">
              {showRegisterOption ? 'Select your role and register to continue.' : 'Sign in to submit your part request. Your form data will be preserved.'}
            </p>
            
            {loginError && (
              <div className={`border rounded-xl px-4 py-3 mb-4 text-sm ${
                showRegisterOption 
                  ? 'bg-brand-500/10 border-brand-500/30 text-brand-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}>
                {loginError}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  disabled={loginLoading}
                />
              </div>
              
              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  className="input"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder={showRegisterOption ? 'Create a password (min 6 characters)' : 'Enter your password'}
                  required
                  disabled={loginLoading}
                />
              </div>
              
              {showRegisterOption && (
                <div>
                  <label className="label">Register as</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setLoginRole('client')}
                      disabled={loginLoading}
                      className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        loginRole === 'client'
                          ? 'bg-brand-500 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                      }`}
                    >
                      Client
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoginRole('vendor')}
                      disabled={loginLoading}
                      className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        loginRole === 'vendor'
                          ? 'bg-brand-500 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                      }`}
                    >
                      Vendor
                    </button>
                  </div>
                  <p className="text-slate-500 text-xs mt-2">
                    Select Client to post part requests. Select Vendor to respond to requests.
                  </p>
                </div>
              )}
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowLoginModal(false)
                    setPendingSubmit(false)
                    setLoginError('')
                    setShowRegisterOption(false)
                  }}
                  className="btn-secondary flex-1"
                  disabled={loginLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={showRegisterOption ? handleQuickRegister : handleQuickLogin}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                  disabled={loginLoading || !loginEmail || !loginPassword || (showRegisterOption && loginPassword.length < 6)}
                >
                  {loginLoading ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      {showRegisterOption ? (pendingSubmit ? 'Registering & Submitting...' : 'Registering...') : 'Signing In...'}
                    </>
                  ) : (
                    showRegisterOption ? 'Accept & Continue' : 'Sign In'
                  )}
                </button>
              </div>
              
              {!showRegisterOption && (
                <p className="text-slate-500 text-xs text-center mt-3">
                  Don't have an account? Enter your details and click Sign In to register.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* No Vendors Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 max-w-sm">
            <h2 className="font-display font-semibold text-xl text-white mb-2">No Vendors in Selected Area</h2>
            <p className="text-slate-400 mb-6">There are currently no vendors in your selected radius/area. Do you still want to post this request? Vendors may accept it if they update their location later.</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmation(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => proceedSubmit()}
                className="btn-primary flex-1"
                disabled={loading}
              >
                {loading ? <Loader size={16} className="animate-spin" /> : 'Post Anyway'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
