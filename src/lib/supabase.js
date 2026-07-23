import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL || 'https://ygzrdnntrqociawmbygv.supabase.co'
const key = import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_9Mcbx-WVMphP8vIoO9-yaA_6IKK03Gh'

export const supabase = createClient(url, key)
