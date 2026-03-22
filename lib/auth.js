import { supabase } from "./supabase";

export async function getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session;
}

export async function getUser() {
    const { data } = await supabase.auth.getUser();
    return data.user;
}

export async function getPerfil() {
    const user = await getUser();
    if (!user) return null;
    const { data } = await supabase
      .from("perfis")
      .select("*, empresas(id, nome)")
      .eq("id", user.id)
      .single();
    return data;
}

export async function logout() {
    await supabase.auth.signOut();
}
