import { supabase } from './supabase';

export async function fetchClients() {
  const { data, error } = await supabase.from('clients').select('*').order('next_review_date', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchClientData(clientId) {
  const { data, error } = await supabase
    .from('client_data')
    .select('*')
    .eq('client_id', clientId);
  if (error) throw error;
  return data ?? [];
}

export async function fetchLatestParsedDoc(clientId) {
  const { data, error } = await supabase
    .from('parsed_documents')
    .select('*')
    .eq('client_id', clientId)
    .order('upload_date', { ascending: false })
    .limit(1);
  if (error) throw error;
  return data?.[0] || null;
}
