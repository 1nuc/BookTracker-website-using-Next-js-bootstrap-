"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showRegister, setShowRegister] = useState(false)

  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/')
      }
    }

    checkAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.push('/')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      if (data.user) router.push('/')
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage(error.message)
      } else {
        setMessage('An unknown error occurred.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (error) throw error
      if (data.session) {
        router.push('/')
      } else {
        setMessage('Please check your email to confirm your account.')
      }
    } catch (error: unknown) {
        if (error instanceof Error) {
          setMessage(error.message)
        } else {
          setMessage('An unknown error occurred.')
        }
      } finally {
        setLoading(false)
      }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-3">
      <div className="container" style={{ maxWidth: '460px' }}>
        <div className="card shadow border-0">
          <div className="card-body">
            <div className="text-center mb-4">
              <div className="bg-primary text-dark rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '60px', height: '60px' }}>
                📚
              </div>
              <h2 className="h4 fw-bold mb-1">Welcome to BookTracker</h2>
              <p className="text-muted small">Track your reading journey effortlessly</p>
            </div>

            {message && (
              <div className={`alert ${message.toLowerCase().includes('error') || message.toLowerCase().includes('invalid') ? 'alert-danger' : 'alert-info'} text-center`} role="alert">
                {message}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin}>
              <h5 className="mb-3">Login</h5>
              <div className="mb-3">
                <input
                  type="email"
                  className="form-control"
                  placeholder="Email address"
                  value={email}
                  required
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <input
                  type="password"
                  className="form-control"
                  placeholder="Password"
                  value={password}
                  required
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary w-100 mb-3 position-relative"
                disabled={loading}
              >
                {loading && (
                  <div className="spinner-border spinner-border-sm position-absolute top-50 start-50 translate-middle" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                )}
                <span className={loading ? 'invisible' : ''}>Sign In</span>
              </button>
            </form>

            <div className="text-center mb-3">
              <button
                type="button"
                className="btn btn-link text-decoration-none p-0"
                onClick={() => {
                  setShowRegister(!showRegister)
                  setMessage('')
                }}
              >
                {showRegister ? 'Close registration form' : 'Create a new account'}
              </button>
            </div>

            {/* Register Form (conditionally visible) */}
            {showRegister && (
              <form onSubmit={handleRegister}>
                <h5 className="mb-3">Register</h5>
                <div className="mb-3">
                  <input
                    type="email"
                    className="form-control"
                    placeholder="Email address"
                    value={email}
                    required
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Password"
                    value={password}
                    required
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-success w-100 position-relative"
                  disabled={loading}
                >
                  {loading && (
                    <div className="spinner-border spinner-border-sm position-absolute top-50 start-50 translate-middle" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  )}
                  <span className={loading ? 'invisible' : ''}>Register</span>
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-muted small mt-4">
          Secure authentication powered by Supabase
        </p>
      </div>
    </div>
  )
}
