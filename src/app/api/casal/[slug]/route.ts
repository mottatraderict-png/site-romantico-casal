import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { data: casal, error } = await supabaseAdmin
    .from('casais')
    .select('*')
    .eq('slug', params.slug)
    .eq('status', 'publicado')
    .single()

  if (error || !casal) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  const { data: fotos } = await supabaseAdmin
    .from('fotos')
    .select('*')
    .eq('casal_id', casal.id)
    .order('ordem')

  const { data: marcos } = await supabaseAdmin
    .from('marcos')
    .select('*')
    .eq('casal_id', casal.id)
    .order('ordem')

  return NextResponse.json({ ...casal, fotos: fotos ?? [], marcos: marcos ?? [] })
}
