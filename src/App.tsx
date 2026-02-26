import { useEffect, Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { useNotificationListener } from './hooks/useNotificationListener'
const LandingPage = lazy(() => import('./pages/LandingPage'))
const AuthPage = lazy(() => import('./pages/AuthPage'))
const ClientDashboard = lazy(() => import('./pages/ClientDashboard'))
const VendorDashboard = lazy(() => import('./pages/VendorDashboard'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const CreateRequest = lazy(() => import('./pages/CreateRequest'))
const VendorRequest = lazy(() => import('./pages/VendorRequest'))
const EditProfile = lazy(() => import('./pages/EditProfile'))
const VendorsPage = lazy(() => import('./pages/VendorsPage'))
const FAQ = lazy(() => import('./pages/FAQ'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const TermsOfService = lazy(() => import('./pages/TermsOfService'))
const Contact = lazy(() => import('./pages/Contact'))
import Navbar from './components/Navbar'
import { ToastContainer } from './components/Toast'
import NotificationPermissionBanner from './components/NotificationPermissionBanner'
import SEO from './components/SEO.tsx'

const PageFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
  </div>
)

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: string }) {
  const { user, profile, loading } = useAuth()
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!user) return <Navigate to="/auth" replace />
  if (role && profile?.role !== role) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function DashboardRouter() {
  const { profile } = useAuth()
  if (!profile) return null
  if (profile.role === 'vendor') return <VendorDashboard />
  if (profile.role === 'admin') return <AdminDashboard />
  return <ClientDashboard />
}

function AppContent() {
  // Initialize notification listener
  useNotificationListener()

  // Initialize audio context on first user interaction
  useEffect(() => {
    const initAudio = () => {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext
        if (AudioContext) {
          const ctx = new AudioContext()
          if (ctx.state === 'suspended') {
            ctx.resume().then(() => {
              console.log('🔊 Audio context initialized and ready')
            })
          }
        }
      } catch (err) {
        console.warn('Could not initialize audio context:', err)
      }
      // Remove listener after first interaction
      document.removeEventListener('click', initAudio)
      document.removeEventListener('touchstart', initAudio)
    }
    
    document.addEventListener('click', initAudio, { once: true })
    document.addEventListener('touchstart', initAudio, { once: true })
    
    return () => {
      document.removeEventListener('click', initAudio)
      document.removeEventListener('touchstart', initAudio)
    }
  }, [])

  return (
    <>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <SEO />
        <div className="min-h-screen bg-slate-950">
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/vendors" element={<VendorsPage />} />
              <Route path="/auth" element={
                <div className="pt-24">
                  <Navbar />
                  <AuthPage />
                </div>
              } />
              <Route path="/faq" element={
                <div className="pt-24">
                  <Navbar />
                  <FAQ />
                </div>
              } />
              <Route path="/privacy" element={
                <div className="pt-24">
                  <Navbar />
                  <PrivacyPolicy />
                </div>
              } />
              <Route path="/terms" element={
                <div className="pt-24">
                  <Navbar />
                  <TermsOfService />
                </div>
              } />
              <Route path="/contact" element={
                <div className="pt-24">
                  <Navbar />
                  <Contact />
                </div>
              } />
              <Route path="/create-request" element={
                <div className="pt-24">
                  <Navbar />
                  <CreateRequest />
                </div>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <div className="pt-24">
                    <Navbar />
                    <DashboardRouter />
                  </div>
                </ProtectedRoute>
              } />
              <Route path="/request/new" element={
                <ProtectedRoute role="client">
                  <div className="pt-24">
                    <Navbar />
                    <CreateRequest />
                  </div>
                </ProtectedRoute>
              } />
              <Route path="/vendor/request" element={
                <ProtectedRoute role="vendor">
                  <div className="pt-24">
                    <Navbar />
                    <VendorRequest />
                  </div>
                </ProtectedRoute>
              } />
              <Route path="/profile/edit" element={
                <ProtectedRoute>
                  <div className="pt-24">
                    <Navbar />
                    <EditProfile />
                  </div>
                </ProtectedRoute>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </BrowserRouter>
      <NotificationPermissionBanner />
      <ToastContainer />
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
