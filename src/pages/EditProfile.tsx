import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import MapPicker from '../components/MapPicker'
import { X, Plus, Upload as UploadIcon } from 'lucide-react'

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

const COMPANY_DATABASE: { [key: string]: string[] } = {
  'Engine Parts': ['Bosch', 'Minda', 'Denso', 'Maruti Genuine', 'Hyundai Genuine'],
  'Transmission': ['Allison', 'Getrag', 'ZF', 'Maruti Factory', 'Hyundai Factory'],
  'Brakes': ['Brembo', 'Bosch', 'Girling', 'Delphi', 'Akebono'],
  'Suspension': ['Moog', 'Gabriel', 'Skoda Genuine', 'Toyota Genuine', 'Mahindra Genuine'],
  'Electrical': ['Robert Bosch', 'Delphi', 'Valeo', 'Denso', 'ZF'],
  'Body Parts': ['OEM Genuine', 'Aftermarket', 'Fiberglass', 'Steel Genuine', 'Plastic'],
  'Tyres & Wheels': ['Apollo', 'MRF', 'CEAT', 'JK', 'Michelin', 'Bridgestone', 'Goodyear'],
  'Exhaust': ['Bosch', 'Eberspacher', 'Faurecia', 'Tenneco', 'OEM Factory'],
  'Cooling': ['Luber Finer', 'Mann Filter', 'Bosch', 'Valeo', 'Denso'],
  'Fuel System': ['Bosch', 'Delphi', 'Stanadyne', 'Continental', 'Valeo'],
  'AC & Heating': ['Denso', 'Valeo', 'Bosch', 'Sanden', 'HVAC OEM'],
  'Filters & Fluids': ['Bosch', 'Mahle', 'Mann Filter', 'Luber Finer', 'Shell', 'Mobil'],
  'Batteries': ['Exide', 'Amaron', 'Luminous', 'AMP', 'Easterlys'],
  'Accessories': ['Various Brands', 'Aftermarket', 'Custom', 'OEM Compatible'],
  'Car Electronics': ['Bosch', 'Alpine', 'Sony', 'Kenwood', 'Clarion'],
  'Dashboard & Infotainment': ['Apeman', 'Pioneer', 'Blaupunkt', 'JBL', 'Alpine'],
  'Audio Systems': ['Sony', 'JBL', 'Hertz', 'Alpine', 'Blaupunkt'],
  'Lighting': ['Philips', 'Osram', 'Sirius', 'Hella', 'Bosch'],
  'Engine Oil': ['Shell', 'Mobil', 'Castrol', 'BP', 'Havoline'],
  'Coolant': ['Castrol', 'Shell', 'Mobil', 'Valvoline', 'Prestone'],
  'Transmission Fluid': ['Shell', 'Castrol', 'Mobil', 'BP', 'Pennzoil'],
  'Brake Fluid': ['Bosch', 'Castrol', 'Shell', 'Valvoline', 'Liqui Moly']
}

export default function EditProfile() {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()

  // Show client form if user is a client, vendor form if vendor
  if (profile?.role === 'client') {
    return <ClientEditProfile user={user} profile={profile} refreshProfile={refreshProfile} navigate={navigate} />
  }

  return <VendorEditProfile user={user} profile={profile} refreshProfile={refreshProfile} navigate={navigate} />
}

function ClientEditProfile({ user, profile, refreshProfile, navigate }: any) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({})
  const fieldRefs = { full_name: useRef<HTMLInputElement>(null), email: useRef<HTMLInputElement>(null), phone: useRef<HTMLInputElement>(null) }
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: ''
  })
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || ''
      })
    }
  }, [profile])

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')
    if (!password.trim()) { setPasswordError('Current password is required'); return }
    if (!newPassword.trim()) { setPasswordError('New password is required'); return }
    if (newPassword.length < 6) { setPasswordError('Password must be at least 6 characters'); return }
    if (newPassword !== confirmPassword) { setPasswordError('Passwords do not match'); return }
    
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) throw updateError
      setPasswordSuccess('Password updated successfully')
      setPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    
    // Validate all required fields
    const errors: {[key: string]: string} = {}
    if (!form.full_name?.trim()) errors.full_name = 'Full name is required'
    if (!form.email?.trim()) errors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Invalid email format'
    if (!form.phone?.trim()) errors.phone = 'Phone number is required'
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setError('Please fill in all required fields')
      // Scroll to first error field
      const firstErrorField = Object.keys(errors)[0] as keyof typeof fieldRefs
      if (fieldRefs[firstErrorField]?.current) {
        setTimeout(() => {
          fieldRefs[firstErrorField]?.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 100)
      }
      return
    }
    
    setFieldErrors({})
    setLoading(true)
    setError('')
    try {
      const { error: updateError } = await supabase.from('profiles').update({
        full_name: form.full_name || null,
        phone: form.phone || null
      }).eq('id', user.id)
      if (updateError) throw updateError
      await refreshProfile()
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="site-container py-10">
        <h1 className="font-display font-bold text-3xl text-white mb-4">Edit Profile</h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 mb-6 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card space-y-4">
            <h2 className="font-display font-semibold text-white">Personal Information</h2>
            <div>
              <label className="label">Full Name *</label>
              <input ref={fieldRefs.full_name} className={`input ${fieldErrors.full_name ? 'border-red-500 bg-red-500/5' : ''}`} value={form.full_name} onChange={e => { set('full_name', e.target.value); if (fieldErrors.full_name) setFieldErrors(f => ({...f, full_name: ''})) }} />
              {fieldErrors.full_name && <p className="text-xs text-red-400 mt-1">{fieldErrors.full_name}</p>}
            </div>
            <div>
              <label className="label">Email *</label>
              <input ref={fieldRefs.email} className={`input ${fieldErrors.email ? 'border-red-500 bg-red-500/5' : ''}`} type="email" value={form.email} onChange={e => { set('email', e.target.value); if (fieldErrors.email) setFieldErrors(f => ({...f, email: ''})) }} />
              {fieldErrors.email && <p className="text-xs text-red-400 mt-1">{fieldErrors.email}</p>}
              <p className="text-xs text-slate-500 mt-1">Update your email address</p>
            </div>
            <div>
              <label className="label">Phone *</label>
              <input ref={fieldRefs.phone} className={`input ${fieldErrors.phone ? 'border-red-500 bg-red-500/5' : ''}`} value={form.phone} onChange={e => { set('phone', e.target.value); if (fieldErrors.phone) setFieldErrors(f => ({...f, phone: ''})) }} />
              {fieldErrors.phone && <p className="text-xs text-red-400 mt-1">{fieldErrors.phone}</p>}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Saving...' : 'Save Profile'}</button>
          </div>
        </form>

        {/* Password Change Section */}
        <div className="mt-12 border-t border-slate-800 pt-12">
          <h2 className="font-display font-semibold text-white text-2xl mb-6">Change Password</h2>
          
          {passwordError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 mb-6 text-sm">{passwordError}</div>
          )}
          {passwordSuccess && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl px-4 py-3 mb-6 text-sm">{passwordSuccess}</div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="label">Current Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">New Password</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="input" />
            </div>
            <button type="submit" className="btn-primary w-full">Update Password</button>
          </form>
        </div>
      </div>
    </div>
  )
}

function VendorEditProfile({ user, profile, refreshProfile, navigate }: any) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({})
  const fieldRefs = { business_name: useRef<HTMLInputElement>(null), phone: useRef<HTMLInputElement>(null), main_category: useRef<HTMLSelectElement>(null), category: useRef<HTMLSelectElement>(null), city: useRef<HTMLInputElement>(null), state: useRef<HTMLInputElement>(null), location: useRef<HTMLDivElement>(null) }
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [form, setForm] = useState({
    business_name: '',
    phone: '',
    main_category: '',
    category: '',
    city: '',
    state: '',
    latitude: null as number | null,
    longitude: null as number | null,
    authorized_dealer: false,
    companies: [] as string[]
  })
  const [newCompany, setNewCompany] = useState('')
  const [bulkInput, setBulkInput] = useState('')

  useEffect(() => {
    if (profile) {
      // Try to extract main_category from category (reverse lookup)
      let main = ''
      for (const [mainCat, subs] of Object.entries(MAIN_CATEGORIES)) {
        if (subs.includes(profile.category)) {
          main = mainCat
          break
        }
      }
      setForm({
        business_name: profile.business_name || '',
        phone: profile.phone || '',
        main_category: main,
        category: profile.category || '',
        city: profile.city || '',
        state: profile.state || '',
        latitude: profile.latitude || null,
        longitude: profile.longitude || null,
        authorized_dealer: profile.authorized_dealer || false,
        companies: profile.companies || []
      })
    }
  }, [profile])

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const onProfilePlace = (place: { display_name?: string; city?: string; state?: string } | undefined) => {
    if (!place) return
    if (place.city) set('city', place.city)
    if (place.state) set('state', place.state)
  }

  const addCompany = () => {
    if (!newCompany.trim()) return
    if (!form.companies.includes(newCompany.trim())) {
      set('companies', [...form.companies, newCompany.trim()])
    }
    setNewCompany('')
  }

  const addCompanyDirect = (company: string) => {
    const trimmed = company.trim()
    if (!trimmed) return
    if (!form.companies.includes(trimmed)) {
      set('companies', [...form.companies, trimmed])
    }
  }

  const bulkAddCompanies = () => {
    if (!bulkInput.trim()) return
    const companies = bulkInput.split(',').map(c => c.trim()).filter(c => c && !form.companies.includes(c))
    set('companies', [...form.companies, ...companies])
    setBulkInput('')
  }

  const removeCompany = (company: string) => {
    set('companies', form.companies.filter(c => c !== company))
  }

  const suggestedCompanies = form.category ? COMPANY_DATABASE[form.category] || [] : []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    
    // Validate all required fields
    const errors: {[key: string]: string} = {}
    if (!form.business_name?.trim()) errors.business_name = 'Business name is required'
    if (!form.phone?.trim()) errors.phone = 'Phone number is required'
    if (!form.main_category?.trim()) errors.main_category = 'Main category is required'
    if (!form.category?.trim()) errors.category = 'Sub category is required'
    if (!form.city?.trim()) errors.city = 'City is required'
    if (!form.state?.trim()) errors.state = 'State is required'
    if (!form.latitude || !form.longitude) errors.location = 'Location pin is required'
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setError('Please fill in all required fields')
      // Scroll to first error field
      const firstErrorField = Object.keys(errors)[0] as keyof typeof fieldRefs
      if (fieldRefs[firstErrorField]?.current) {
        setTimeout(() => {
          fieldRefs[firstErrorField]?.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 100)
      }
      return
    }
    
    setFieldErrors({})
    setLoading(true)
    setError('')
    try {
      const { error: updateError } = await supabase.from('profiles').update({
        business_name: form.business_name || null,
        phone: form.phone || null,
        category: form.category || null,
        city: form.city || null,
        state: form.state || null,
        latitude: form.latitude,
        longitude: form.longitude,
        authorized_dealer: form.authorized_dealer,
        companies: form.companies
      }).eq('id', user.id)
      if (updateError) throw updateError
      await refreshProfile()
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')
    if (!password.trim()) { setPasswordError('Current password is required'); return }
    if (!newPassword.trim()) { setPasswordError('New password is required'); return }
    if (newPassword.length < 6) { setPasswordError('Password must be at least 6 characters'); return }
    if (newPassword !== confirmPassword) { setPasswordError('Passwords do not match'); return }
    
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) throw updateError
      setPasswordSuccess('Password updated successfully')
      setPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="site-container py-10">
        <h1 className="font-display font-bold text-3xl text-white mb-4">Edit Profile</h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 mb-6 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category & Dealer Status */}
          <div className="card space-y-4">
            <h2 className="font-display font-semibold text-white">Business Type</h2>
            <div>
              <label className="label">Main Category *</label>
              <select 
                ref={fieldRefs.main_category}
                className={`input ${fieldErrors.main_category ? 'border-red-500 bg-red-500/5' : ''}`} 
                value={form.main_category} 
                onChange={e => {
                  set('main_category', e.target.value)
                  set('category', '') // Reset subcategory
                  if (fieldErrors.main_category) setFieldErrors(f => ({...f, main_category: ''}))
                }}
                required
              >
                <option value="">Select a main category</option>
                {Object.keys(MAIN_CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {fieldErrors.main_category && <p className="text-xs text-red-400 mt-1">{fieldErrors.main_category}</p>}
            </div>
            {form.main_category && (
              <div>
                <label className="label">Sub Category *</label>
                <select 
                  ref={fieldRefs.category}
                  className={`input ${fieldErrors.category ? 'border-red-500 bg-red-500/5' : ''}`} 
                  value={form.category} 
                  onChange={e => { set('category', e.target.value); if (fieldErrors.category) setFieldErrors(f => ({...f, category: ''})) }}
                  required
                >
                  <option value="">Select a subcategory</option>
                  {(MAIN_CATEGORIES[form.main_category as keyof typeof MAIN_CATEGORIES] || []).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {fieldErrors.category && <p className="text-xs text-red-400 mt-1">{fieldErrors.category}</p>}
              </div>
            )}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.authorized_dealer}
                onChange={e => set('authorized_dealer', e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 cursor-pointer"
              />
              <span className="text-sm text-slate-300">Mark as Authorized Dealer</span>
            </label>
          </div>

          {/* Companies Management */}
          {form.category && form.authorized_dealer && (
            <div className="card space-y-4">
              <h2 className="font-display font-semibold text-white">Authorized Brands & Companies</h2>

              {/* Quick Add Suggested */}
              {suggestedCompanies.length > 0 && (
                <div>
                  <label className="label text-xs">Suggested Companies for {form.category}</label>
                  <div className="flex flex-wrap gap-2">
                    {suggestedCompanies.map(company => (
                      <button
                        key={company}
                        type="button"
                        onClick={() => !form.companies.includes(company) && addCompanyDirect(company)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          form.companies.includes(company)
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        {company}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Add One by One */}
              <div>
                <label className="label text-xs">Add Company Manually</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newCompany}
                    onChange={e => setNewCompany(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && addCompany()}
                    placeholder="Type company name..."
                    className="input flex-1"
                  />
                  <button
                    type="button"
                    onClick={addCompany}
                    className="btn-primary px-4 flex items-center gap-2 justify-center"
                  >
                    <Plus size={16} /> Add
                  </button>
                </div>
              </div>

              {/* Bulk Import */}
              <div>
                <label className="label text-xs">Bulk Import (Comma-Separated)</label>
                <textarea
                  value={bulkInput}
                  onChange={e => setBulkInput(e.target.value)}
                  placeholder="Paste multiple companies: Company1, Company2, Company3"
                  className="input resize-none"
                  rows={3}
                />
                <button
                  type="button"
                  onClick={bulkAddCompanies}
                  className="btn-secondary py-2 px-3 text-sm flex items-center gap-2 mt-2"
                >
                  <UploadIcon size={14} /> Import
                </button>
              </div>

              {/* Added Companies */}
              {form.companies.length > 0 && (
                <div>
                  <label className="label text-xs">Added Companies ({form.companies.length})</label>
                  <div className="flex flex-wrap gap-2">
                    {form.companies.map(company => (
                      <div
                        key={company}
                        className="bg-brand-500/20 border border-brand-500/30 text-brand-300 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2"
                      >
                        {company}
                        <button
                          type="button"
                          onClick={() => removeCompany(company)}
                          className="hover:text-brand-100 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Location */}
          <div className="card space-y-4">
            <h2 className="font-display font-semibold text-white">Location</h2>
            <div>
              <label className="label">City *</label>
              <input ref={fieldRefs.city} className={`input ${fieldErrors.city ? 'border-red-500 bg-red-500/5' : ''}`} value={form.city} onChange={e => { set('city', e.target.value); if (fieldErrors.city) setFieldErrors(f => ({...f, city: ''})) }} />
              {fieldErrors.city && <p className="text-xs text-red-400 mt-1">{fieldErrors.city}</p>}
            </div>
            <div>
              <label className="label">State *</label>
              <input ref={fieldRefs.state} className={`input ${fieldErrors.state ? 'border-red-500 bg-red-500/5' : ''}`} value={form.state} onChange={e => { set('state', e.target.value); if (fieldErrors.state) setFieldErrors(f => ({...f, state: ''})) }} placeholder="State (auto-filled when pinning)" />
              {fieldErrors.state && <p className="text-xs text-red-400 mt-1">{fieldErrors.state}</p>}
            </div>
            <div>
              <label className="label">Pin Location on Map *</label>
              <div ref={fieldRefs.location} className={`relative ${fieldErrors.location ? 'border-2 border-red-500 rounded-xl overflow-hidden' : ''}`} style={{ maxWidth: '100%' }}>
                <MapPicker latitude={form.latitude} longitude={form.longitude} onChange={(lat, lng) => { set('latitude', lat); set('longitude', lng); if (fieldErrors.location) setFieldErrors(f => ({...f, location: ''})) }} onPlace={onProfilePlace} height={300} />
              </div>
              {fieldErrors.location && <p className="text-xs text-red-400 mt-1">{fieldErrors.location}</p>}
              <div className="flex flex-col sm:flex-row gap-2 mt-3">
                <button type="button" onClick={() => { set('latitude', null); set('longitude', null) }} className="btn-secondary w-full sm:w-24">Clear</button>
              </div>
              <p className="text-slate-600 text-xs mt-2">Click to pin your location. Search box finds places in India only. City/State auto-fill.</p>
            </div>
          </div>

          {/* Personal Information */}
          <div className="card space-y-4">
            <h2 className="font-display font-semibold text-white">Personal Information</h2>
            <div>
              <label className="label">Business Name *</label>
              <input ref={fieldRefs.business_name} className={`input ${fieldErrors.business_name ? 'border-red-500 bg-red-500/5' : ''}`} value={form.business_name} onChange={e => { set('business_name', e.target.value); if (fieldErrors.business_name) setFieldErrors(f => ({...f, business_name: ''})) }} />
              {fieldErrors.business_name && <p className="text-xs text-red-400 mt-1">{fieldErrors.business_name}</p>}
            </div>
            <div>
              <label className="label">Phone *</label>
              <input ref={fieldRefs.phone} className={`input ${fieldErrors.phone ? 'border-red-500 bg-red-500/5' : ''}`} value={form.phone} onChange={e => { set('phone', e.target.value); if (fieldErrors.phone) setFieldErrors(f => ({...f, phone: ''})) }} />
              {fieldErrors.phone && <p className="text-xs text-red-400 mt-1">{fieldErrors.phone}</p>}
            </div>
          </div>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Saving...' : 'Save Profile'}</button>
          </div>
        </form>

        {/* Password Change Section */}
        <div className="mt-12 border-t border-slate-800 pt-12">
          <h2 className="font-display font-semibold text-white text-2xl mb-6">Change Password</h2>
          
          {passwordError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 mb-6 text-sm">{passwordError}</div>
          )}
          {passwordSuccess && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl px-4 py-3 mb-6 text-sm">{passwordSuccess}</div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="label">Current Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">New Password</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="input" />
            </div>
            <button type="submit" className="btn-primary w-full">Update Password</button>
          </form>
        </div>
      </div>
    </div>
  )
}
