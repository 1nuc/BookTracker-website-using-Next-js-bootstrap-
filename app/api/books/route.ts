import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getUserFromToken(token: string) {
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) throw new Error('Invalid token')
  return user
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const token = req.headers.get('authorization')?.split(' ')[1]
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 401 })

  try {
    const user = await getUserFromToken(token)
    
    // Get the status query parameter from the URL
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    
    // Start building the query
    let query = supabase
      .from('books')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Add status filter if provided and not 'all'
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) throw error
    return NextResponse.json(data || [])
  } catch (error) {
    console.error('GET /api/books error:', error)
    return NextResponse.json({ error: 'Failed to fetch books' }, { status: 401 })
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const token = req.headers.get('authorization')?.split(' ')[1]
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 401 })

  try {
    const { title, author, status } = await req.json()

    if (!title || !author || !['reading', 'completed', 'wishlist'].includes(status)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const user = await getUserFromToken(token)
    const { data, error } = await supabase
      .from('books')
      .insert([{ title, author, status, user_id: user.id }])
      .select()

    if (error) throw error
    return NextResponse.json(data?.[0], { status: 201 })
  } catch (error) {
    console.error('POST /api/books error:', error)
    return NextResponse.json({ error: 'Failed to add book' }, { status: 500 })
  }
}
