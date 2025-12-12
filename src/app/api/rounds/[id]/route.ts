import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { roundService } from '@/services'

// ============================================
// GET /api/rounds/[id] - Get single round with full details
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { id } = await params
    
    const result = await roundService.getRound(id, session.user.id)
    
    if (!result.success) {
      const status = result.error === 'Round not found' ? 404 
        : result.error === 'Access denied' ? 403 : 400
      return NextResponse.json({ error: result.error }, { status })
    }
    
    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error('Error fetching round:', error)
    return NextResponse.json({ error: 'Failed to fetch round' }, { status: 500 })
  }
}

// ============================================
// PATCH /api/rounds/[id] - Update round (complete, abandon, etc.)
// ============================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { id } = await params
    const body = await request.json()
    
    let result
    
    // Handle status changes
    if (body.status === 'COMPLETED') {
      result = await roundService.completeRound(id, session.user.id)
    } else if (body.status === 'ABANDONED') {
      result = await roundService.abandonRound(id, session.user.id)
    } else {
      // Handle other updates (notes, weather)
      result = await roundService.updateRound(id, session.user.id, {
        notes: body.notes,
        weather: body.weather,
      })
    }
    
    if (!result.success) {
      const status = result.error === 'Round not found' ? 404 
        : result.error === 'Not your round' ? 403 : 400
      return NextResponse.json({ error: result.error }, { status })
    }
    
    return NextResponse.json({
      success: true,
      data: result.round,
    })
  } catch (error) {
    console.error('Error updating round:', error)
    return NextResponse.json({ error: 'Failed to update round' }, { status: 500 })
  }
}

// ============================================
// DELETE /api/rounds/[id] - Delete a round
// ============================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { id } = await params
    
    const result = await roundService.deleteRound(id, session.user.id)
    
    if (!result.success) {
      const status = result.error === 'Round not found' ? 404 
        : result.error === 'Not your round' ? 403 : 400
      return NextResponse.json({ error: result.error }, { status })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Round deleted',
    })
  } catch (error) {
    console.error('Error deleting round:', error)
    return NextResponse.json({ error: 'Failed to delete round' }, { status: 500 })
  }
}
