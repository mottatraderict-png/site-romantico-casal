export type StatusCasal = 'pendente' | 'pago' | 'publicado'

export interface Casal {
  id: string
  slug: string
  token?: string
  nome1: string
  nome2: string
  apelido1?: string
  apelido2?: string
  data_inicio: string
  frase_favorita?: string
  carta_para?: string
  carta_texto?: string
  carta_ass?: string
  musica_nome?: string
  musica_artista?: string
  spotify_track_id?: string
  email_cliente?: string
  payment_id?: string
  status: StatusCasal
  criado_em: string
}

export interface Foto {
  id: string
  casal_id: string
  url: string
  caption?: string
  ordem: number
}

export interface Marco {
  id: string
  casal_id: string
  data_texto?: string
  titulo: string
  descricao?: string
  foto_url?: string
  ordem: number
}

export interface CasalCompleto extends Casal {
  fotos: Foto[]
  marcos: Marco[]
}
