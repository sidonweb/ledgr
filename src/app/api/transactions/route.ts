import { NextResponse, type NextRequest } from 'next/server'
import { handleApi, requireAuth } from '@/lib/server/api'
import { getState, listTransactionsPage, upsertTransaction } from '@/lib/server/store'

export const runtime = 'nodejs'

export function GET(request: NextRequest) {
  return handleApi(async () => {
    const { user } = await requireAuth(request)
    const params = request.nextUrl.searchParams
    const limit = Math.min(Math.max(Number(params.get('limit')) || 10, 1), 100)
    const offset = Math.max(Number(params.get('offset')) || 0, 0)
    const search = params.get('search')?.trim() || null
    const categoryIdsParam = params.get('categoryIds')
    const categoryIds = categoryIdsParam ? categoryIdsParam.split(',').filter(Boolean) : null

    const { transactions, total } = await listTransactionsPage(user.id, { limit, offset, search, categoryIds })
    return NextResponse.json({
      transactions,
      pageInfo: { total, limit, offset, hasMore: offset + transactions.length < total },
    })
  })
}

export function POST(request: NextRequest) {
  return handleApi(async () => {
    const { user } = await requireAuth(request)
    await upsertTransaction(user.id, await request.json())
    return NextResponse.json(await getState(user.id), { status: 201 })
  })
}
