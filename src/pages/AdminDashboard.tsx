import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Users, FileText, CheckCircle, Building2 } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ clients: 0, vendors: 0, requests: 0, closed: 0 })
  const [vendors, setVendors] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'overview' | 'vendors' | 'requests'>('overview')

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: profiles }, { data: reqs }] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('requests').select('*, profiles:client_id(full_name, email)').order('created_at', { ascending: false })
      ])

      const clients = profiles?.filter(p => p.role === 'client').length || 0
      const vendorList = profiles?.filter(p => p.role === 'vendor') || []
      const closed = reqs?.filter(r => r.status === 'closed').length || 0

      setStats({ clients, vendors: vendorList.length, requests: reqs?.length || 0, closed })
      setVendors(vendorList)
      setRequests(reqs || [])
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="site-container py-10">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl text-white">Admin Panel</h1>
        <p className="text-slate-400 mt-1">Platform overview and management</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Users, label: 'Clients', value: stats.clients, color: 'text-blue-400 bg-blue-500/10' },
          { icon: Building2, label: 'Vendors', value: stats.vendors, color: 'text-brand-400 bg-brand-500/10' },
          { icon: FileText, label: 'Requests', value: stats.requests, color: 'text-purple-400 bg-purple-500/10' },
          { icon: CheckCircle, label: 'Closed', value: stats.closed, color: 'text-green-400 bg-green-500/10' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
              <Icon size={22} className={color.split(' ')[0]} />
            </div>
            <div>
              <div className="font-display font-bold text-2xl text-white">{value}</div>
              <div className="text-slate-500 text-sm">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/50 p-1 rounded-xl mb-6 w-full sm:w-fit overflow-x-auto">
        {(['overview', 'vendors', 'requests'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${tab === t ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'vendors' && (
        <div className="space-y-3">
          {vendors.map(v => (
            <div key={v.id} className="card flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-10 h-10 bg-brand-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 size={18} className="text-brand-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white">{v.business_name || v.full_name}</p>
                <p className="text-slate-400 text-sm">{v.email}</p>
              </div>
              <div className="text-right">
                <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-full">{v.category}</span>
                {v.city && <p className="text-xs text-slate-600 mt-1">{v.city}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'requests' && (
        <div className="space-y-3">
          {requests.map(r => (
            <div key={r.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={r.status === 'open' ? 'badge-open' : 'badge-closed'}>{r.status}</span>
                    <span className="text-xs text-slate-500 font-mono">{r.category}</span>
                  </div>
                  <h3 className="font-semibold text-white">{r.part_name}</h3>
                  <p className="text-slate-400 text-sm mt-1">{r.description?.slice(0, 100)}{r.description?.length > 100 ? '...' : ''}</p>
                  <p className="text-slate-600 text-xs mt-2">By: {r.profiles?.full_name} ({r.profiles?.email})</p>
                </div>
                {r.image_url && <img src={r.image_url} alt="" className="w-14 h-14 rounded-lg object-cover" />}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'overview' && (
        <div className="card">
          <h3 className="font-display font-semibold text-white mb-4">Platform Health</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">Request Close Rate</span>
                <span className="text-white font-mono">{stats.requests > 0 ? Math.round((stats.closed / stats.requests) * 100) : 0}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full">
                <div className="h-2 bg-brand-500 rounded-full transition-all" style={{ width: `${stats.requests > 0 ? (stats.closed / stats.requests) * 100 : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">Vendor to Client Ratio</span>
                <span className="text-white font-mono">{stats.clients > 0 ? (stats.vendors / stats.clients).toFixed(2) : '—'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
