import { NextRequest, NextResponse } from 'next/server'
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.headers.get('authorization')?.split(' ')[1]
  const bookId = (await params).id

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 401 })
  }

  try {
    const user = await getUserFromToken(token)

    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', bookId)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('DELETE /api/books/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { id } = params
  const { status } = await req.json()

  const { data, error } = await supabase
    .from('books')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { id } = params
  const { title, author, status } = await req.json()

  if (!title || !author || !['reading', 'completed', 'wishlist'].includes(status)) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  try {
    const user = await getUserFromToken(req.headers.get('authorization')?.split(' ')[1] || '')
    const { data, error } = await supabase
      .from('books')
      .update({ title, author, status })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error('PATCH /api/books/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update book' }, { status: 500 })
  }
}