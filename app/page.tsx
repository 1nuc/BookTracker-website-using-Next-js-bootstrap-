"use client"

import { useEffect, useState, useCallback, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

type Book = {
  id: string
  title: string
  author: string
  status: string
  created_at: string
  user_id?: string
}

// Separate component that uses useSearchParams
function DashboardContent() {
  const [books, setBooks] = useState<Book[]>([])
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [status, setStatus] = useState('reading')
  const [search, setSearch] = useState('')
  const [token, setToken] = useState('')
  const [userId, setUserId] = useState('')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const getToken = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push('/auth')
        return
      }

      const accessToken = session.access_token
      const uid = session.user.id

      setToken(accessToken)
      setUserId(uid)
      
      // Get initial filter from URL params
      const initialFilter = searchParams?.get('status') || 'all'
      setFilter(initialFilter)
      fetchBooks(accessToken, uid, initialFilter)

      const channel = supabase
        .channel('realtime-books')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'books' },
          () => {
            // Use the current filter value when realtime updates occur
            const currentFilter = searchParams?.get('status') || filter
            fetchBooks(accessToken, uid, currentFilter)
          }
        )
        .subscribe()

      // 🔁 Cleanup channel
      return () => {
        supabase.removeChannel(channel)
      }
    }

    getToken()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push('/auth')
      } else {
        const accessToken = session.access_token
        const uid = session.user.id

        setToken(accessToken)
        setUserId(uid)
        const currentFilter = searchParams?.get('status') || filter
        fetchBooks(accessToken, uid, currentFilter)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router]) // Removed searchParams and filter from dependencies

  // Updated fetchBooks to accept filter as parameter
  const fetchBooks = useCallback(async (access_token: string, uid: string, currentFilter: string = filter) => {
    try {
      console.log('Fetching books with status:', currentFilter)
      const query = currentFilter !== 'all' ? `?status=${currentFilter}` : ''
      const res = await fetch(`/api/books${query}`, {
        headers: { Authorization: `Bearer ${access_token}` },
      })
      const data = await res.json()
      setBooks(data.filter((b: Book) => b.user_id === uid))
    } catch (err) {
      console.error('Failed to fetch books:', err)
    }
  }, [filter])
  
  // Fixed handleFilterChange to pass the new filter value immediately
  const handleFilterChange = (newFilter: string) => {
    console.log('Changing filter to:', newFilter)
    setFilter(newFilter)
    // Pass the new filter value directly to fetchBooks
    fetchBooks(token, userId, newFilter)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, author, status }),
      })
      const newBook = await res.json()
      setBooks([newBook, ...books])
      setTitle('')
      setAuthor('')
      setStatus('reading')
    } catch (err) {
      console.error('Failed to add book:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/books/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      setBooks(books.filter((b) => b.id !== id))
    } catch (err) {
      console.error('Failed to delete book:', err)
    }
  }

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/books/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const errorText = await res.text()
        console.error("Failed to update status:", errorText)
        return
      }
      const updated = await res.json()
      setBooks((prev) => prev.map((b) => (b.id === id ? updated : b)))
    } catch (err) {
      console.error('Failed to update status:', err)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  // Apply search only (filter is handled server-side)
  const filteredBooks = books.filter((b) => 
    b.title.toLowerCase().includes(search.toLowerCase())
  )

  const statusColor = (status: string) => {
    switch (status) {
      case 'reading':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'wishlist':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case 'reading':
        return '📖'
      case 'completed':
        return '✅'
      case 'wishlist':
        return '⭐'
      default:
        return '📚'
    }
  }

  const getStats = () => {
    const reading = books.filter(b => b.status === 'reading').length
    const completed = books.filter(b => b.status === 'completed').length
    const wishlist = books.filter(b => b.status === 'wishlist').length
    return { reading, completed, wishlist, total: books.length }
  }

  const stats = getStats()

  return (
    <div className="min-vh-100 bg-light">
      <div className="bg-white border-bottom sticky-top shadow-sm">
        <div className="container py-3 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <div className="rounded bg-primary text-dark d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
              <span>📚</span>
            </div>
            <div>
              <h1 className="h5 fw-bold text-dark mb-0">BookTracker</h1>
              <p className="text-muted small mb-0">Organize your reading journey</p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-outline-secondary btn-sm">Sign Out</button>
        </div>
      </div>

      <div className="container py-4">
        <div className="d-flex mb-4 align-items-center justify-content-between">
          <input
            type="text"
            className="form-control w-50"
            placeholder="Search books..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="d-flex justify-content-end mb-3">
            <label className="form-label me-2 mb-0 mt-1 text-dark">Filter:</label>
            <select
              className="form-select w-auto"
              value={filter}
              onChange={(e) => handleFilterChange(e.target.value)}
              >
              <option value="all">All</option>
              <option value="reading">Reading</option>
              <option value="completed">Completed</option>
              <option value="wishlist">Wishlist</option>
            </select>
          </div>
        </div>
        
        <div className="row g-4 mb-4">
          {[{ label: "Total Books", count: stats.total, icon: "📚", color: "secondary" }, { label: "Currently Reading", count: stats.reading, icon: "📖", color: "primary" }, { label: "Completed", count: stats.completed, icon: "✅", color: "success" }, { label: "Wishlist", count: stats.wishlist, icon: "⭐", color: "warning" }].map(({ label, count, icon, color }, i) => (
            <div className="col-md-3" key={i}>
              <div className="card h-100 shadow-sm border-0">
                <div className="card-body d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted small mb-1">{label}</p>
                    <h3 className={`text-${color}`}>{count}</h3>
                  </div>
                  <div className={`rounded-circle bg-light d-flex align-items-center justify-content-center`} style={{ width: '48px', height: '48px' }}>
                    <span className="fs-4">{icon}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="row g-5">
          <div className="col-lg-4">
            <div className="card sticky-top shadow-sm border-0" style={{ top: '100px' }}>
              <div className="card-body">
                <div className="d-flex align-items-center mb-4 gap-2">
                  <div className="rounded bg-success text-white d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                    <span>➕</span>
                  </div>
                  <h5 className="mb-0">Add New Book</h5>
                </div>
                <form onSubmit={handleAdd}>
                  <div className="mb-3">
                    <label className="form-label">Book Title</label>
                    <input type="text" className="form-control" value={title} onChange={(e) => setTitle(e.target.value)} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Author</label>
                    <input type="text" className="form-control" value={author} onChange={(e) => setAuthor(e.target.value)} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                      <option value="reading">📖 Currently Reading</option>
                      <option value="completed">✅ Completed</option>
                      <option value="wishlist">⭐ Wishlist</option>
                    </select>
                  </div>
                  <button type="submit" disabled={loading} className="btn btn-primary w-100 position-relative">
                    {loading && <div className="spinner-border spinner-border-sm text-light position-absolute top-50 start-50 translate-middle"></div>}
                    <span className={loading ? "invisible" : ""}>Add Book</span>
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="col-lg-8">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="mb-0 text-dark">Your Books</h4>
              <p className="text-muted mb-0">{filteredBooks.length} {filteredBooks.length === 1 ? "book" : "books"}</p>
            </div>

            {filteredBooks.length === 0 ? (
              <div className="card text-center border-0 shadow-sm p-5">
                <div className="mb-3">
                  <div className="rounded bg-light mx-auto d-flex align-items-center justify-content-center" style={{ width: '64px', height: '64px' }}>
                    <span className="fs-3">📚</span>
                  </div>
                </div>
                <h5 className="mb-2">No books yet</h5>
                <p className="text-muted">Add your first book to get started with tracking your reading journey!</p>
              </div>
            ) : (
              <div className="vstack gap-3">
                <AnimatePresence>
                  {filteredBooks.map((book) => (
                    <motion.div
                      key={book.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="card shadow-sm border-0 position-relative"
                    >
                      <div className="card-body d-flex justify-content-between align-items-start">
                        <div>
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <h5 className="mb-0">{book.title}</h5>
                            <span className={`badge text-bg-light border ${statusColor(book.status)}`}>
                              {statusIcon(book.status)} {book.status}
                            </span>
                          </div>
                          <p className="mb-1 text-muted">by {book.author}</p>
                          <small className="text-muted">Added {new Date(book.created_at).toLocaleDateString()}</small>
                        </div>
                        <div className="d-flex flex-column gap-2 align-items-end">
                          <select
                            className="form-select form-select-sm"
                            value={book.status}
                            onChange={(e) => handleUpdateStatus(book.id, e.target.value)}
                          >
                            <option value="reading">Reading</option>
                            <option value="completed">Completed</option>
                            <option value="wishlist">Wishlist</option>
                          </select>
                          <button onClick={() => handleDelete(book.id)} className="btn btn-sm btn-outline-danger">🗑️</button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Loading fallback component
function DashboardLoading() {
  return (
    <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
      <div className="text-center">
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-muted">Loading your books...</p>
      </div>
    </div>
  )
}

// Main component with Suspense wrapper
export default function Dashboard() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  )
}