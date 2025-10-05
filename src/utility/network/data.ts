import { supabaseClient as supabase } from '../supabaseClient';

export async function getEnumValues(enumType: string) {
  const { data, error } = await supabase.rpc('get_enum_values', { enum_name: enumType });
  if (error) throw error;
  return data;
}
