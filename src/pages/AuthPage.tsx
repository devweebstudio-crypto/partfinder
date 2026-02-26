import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Eye, EyeOff } from 'lucide-react'
import Footer from '../components/Footer'

const CATEGORIES = [
  'Automobile',
  'Engine Parts', 'Transmission', 'Brakes', 'Suspension', 'Electrical',
  'Body Parts', 'Tyres & Wheels', 'Exhaust', 'Cooling', 'Fuel System',
  'AC & Heating', 'Filters & Fluids', 'Accessories', 'Other'
]

export default function AuthPage() {
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState<'login' | 'signup'>(searchParams.get('mode') === 'vendor' ? 'signup' : 'login')
  const [role, setRole] = useState<'client' | 'vendor'>(searchParams.get('mode') === 'vendor' ? 'vendor' : 'client')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    email: '', password: '', full_name: '', phone: '',
    business_name: '', category: CATEGORIES[0], city: ''
  })

  useEffect(() => {
    if (user && profile) navigate('/dashboard', { replace: true })
  }, [user, profile])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Basic client-side validation
      if (!form.email || !form.password) throw new Error('Email and password are required')
      if (!form.email.includes('@')) throw new Error('Please enter a valid email')
      if (form.password.length < 6) throw new Error('Password must be at least 6 characters')

      if (mode === 'login') {
        const res = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
        if (res.error) {
          console.error('signInWithPassword error:', res)
          throw res.error
        }
        navigate('/dashboard')
      } else {
        const signUpRes = await supabase.auth.signUp({ email: form.email, password: form.password })
        if (signUpRes.error) {
          console.error('signUp error:', signUpRes)
          // If user already registered, switch to login mode and inform user
          const msg = signUpRes.error.message || ''
          if (msg.toLowerCase().includes('already registered') || signUpRes.error.status === 422) {
            setMode('login')
            setError('Email already registered — try logging in or reset your password')
            setLoading(false)
            return
          }
          throw signUpRes.error
        }

        // If signup does not yield an authenticated user (email confirmation required),
        // inform the user and skip auto-signin to avoid token errors.
        let user = signUpRes.data.user
        let session = (signUpRes.data as any).session

        if (!user) {
          setError('Signup successful — please check your email to confirm your account before signing in.')
          setLoading(false)
          return
        }

        // If signUp returned a user but no session, try signing in to obtain a session
        if (user && !session) {
          const signInRes = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
          if (signInRes.error) {
            console.error('post-signup signIn error:', signInRes)
            throw signInRes.error
          }
          user = signInRes.data.user
          session = (signInRes.data as any).session
        }

        if (user) {
          const { error: profileError } = await supabase.from('profiles').insert({
            id: user.id,
            email: form.email,
            full_name: form.full_name,
            phone: form.phone || null,
            role,
            business_name: role === 'vendor' ? form.business_name : null,
            category: role === 'vendor' ? form.category : null,
            city: form.city || null,
          })
          if (profileError) throw profileError
          navigate('/dashboard')
        }
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-slate-950 flex flex-col lg:flex-row">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 to-slate-950 border-r border-slate-800 flex-col justify-between p-12">
        <div>
          <h2 className="font-display font-bold text-4xl text-white mb-4">
            Your local auto<br />parts network
          </h2>
          <p className="text-slate-400 text-lg">Connect with vendors, find parts, close requests faster.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[['500+', 'Vendors'], ['2k+', 'Requests Closed'], ['50+', 'Cities'], ['4.9★', 'Rating']].map(([val, label]) => (
            <div key={label} className="bg-slate-800/50 rounded-xl p-4">
              <div className="font-display font-bold text-2xl text-brand-400">{val}</div>
              <div className="text-slate-500 text-sm">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md animate-slide-up">
          <h1 className="font-display font-bold text-3xl text-white mb-2">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-slate-400 mb-8">
            {mode === 'login' ? "Don't have an account? " : 'Already registered? '}
            <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="text-brand-400 hover:text-brand-300">
              {mode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </p>

          {mode === 'signup' && (
            <div className="flex gap-2 mb-6 bg-slate-800/50 p-1 rounded-xl">
              {(['client', 'vendor'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all capitalize ${role === r ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  {r === 'client' ? '🔍 I need parts' : '🔧 I sell parts'}
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="label">Full Name *</label>
                <input className="input" required value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="John Doe" />
              </div>
            )}

            <div>
              <label className="label">Email *</label>
              <input className="input" type="email" required value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" />
            </div>

            <div>
              <label className="label">Password *</label>
              <div className="relative">
                <input className="input pr-12" type={showPass ? 'text' : 'password'} required value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 6 characters" minLength={6} />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <>
                <div>
                  <label className="label">Phone</label>
                  <input className="input" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label className="label">City</label>
                  <input className="input" value={form.city} onChange={e => set('city', e.target.value)} placeholder="Mumbai" />
                </div>
                {role === 'vendor' && (
                  <>
                    <div>
                      <label className="label">Business Name *</label>
                      <input className="input" required value={form.business_name} onChange={e => set('business_name', e.target.value)} placeholder="Sharma Auto Parts" />
                    </div>
                    <div>
                      <label className="label">Category *</label>
                      <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </>
                )}
              </>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 mt-2">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  )
}
