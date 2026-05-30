import { supabase } from './supabase'

export interface MerchantProduct {
  id: string
  merchant_partner_id: string
  name: string
  description: string | null
  points: number
  stock: number | null
  image_url: string | null
  category: string | null
  is_active: boolean
  created_at: string
}

export async function getMerchantProducts(merchantPartnerId: string) {
  return supabase
    .from('merchant_products')
    .select('*')
    .eq('merchant_partner_id', merchantPartnerId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
}

export async function addMerchantProduct(data: Omit<MerchantProduct, 'id' | 'created_at'>) {
  return supabase.from('merchant_products').insert(data).select().single()
}

export async function updateMerchantProduct(
  id: string,
  data: Partial<Omit<MerchantProduct, 'id' | 'created_at'>>,
) {
  return supabase.from('merchant_products').update(data).eq('id', id)
}

export async function removeMerchantProduct(id: string) {
  return supabase.from('merchant_products').update({ is_active: false }).eq('id', id)
}

export async function updateMerchantPartner(
  id: string,
  data: Record<string, unknown>,
) {
  return supabase.from('merchant_partners').update(data).eq('id', id)
}
