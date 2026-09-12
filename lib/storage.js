import { supabase } from "@/lib/supabaseClient";

// Faz upload de um arquivo para o bucket "arquivos", dentro da pasta do usuário.
// Retorna { path, signedUrl, name } ou lança erro.
export async function uploadArquivo(userId, file) {
  const ext = file.name.split(".").pop();
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("arquivos").upload(path, file, { contentType: file.type });
  if (error) throw error;
  const signedUrl = await getSignedUrl(path);
  return { path, signedUrl, name: file.name };
}

export async function getSignedUrl(path) {
  if (!path) return null;
  const { data, error } = await supabase.storage.from("arquivos").createSignedUrl(path, 60 * 60); // 1 hora
  if (error) return null;
  return data.signedUrl;
}

export async function removeArquivo(path) {
  if (!path) return;
  await supabase.storage.from("arquivos").remove([path]);
}
