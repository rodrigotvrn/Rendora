"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [modo, setModo] = useState("login");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [nome, setNome] = useState("");
    const [empresa, setEmpresa] = useState("");
    const [erro, setErro] = useState("");
    const [carregando, setCarregando] = useState(false);

  async function handleLogin(e) {
        e.preventDefault();
        setErro("");
        setCarregando(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) { setErro("Email ou senha incorretos"); setCarregando(false); return; }
        router.push("/");
  }

  async function handleCadastro(e) {
        e.preventDefault();
        setErro("");
        setCarregando(true);
        const { data: authData, error: authError } = await supabase.auth.signUp({ email, password: senha });
        if (authError) { setErro(authError.message); setCarregando(false); return; }
        const userId = authData.user.id;
        const { data: emp } = await supabase.from("empresas").insert({ nome: empresa }).select().single();
        await supabase.from("perfis").insert({ id: userId, empresa_id: emp.id, nome, email, perfil_tipo: "admin" });
        router.push("/");
  }

  const sContainer = { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0f1c" };
    const sCard = { background: "#131927", borderRadius: 16, padding: 40, width: 400, boxShadow: "0 8px 32px rgba(0,0,0,0.4)" };
    const sTitle = { color: "#fff", fontSize: 28, fontWeight: 700, marginBottom: 8, textAlign: "center" };
    const sSub = { color: "#8892a4", fontSize: 14, textAlign: "center", marginBottom: 24 };
    const sLabel = { color: "#c0c8d8", fontSize: 13, marginBottom: 4, display: "block" };
    const sInput = { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #2a3348", background: "#0d1220", color: "#fff", fontSize: 14, marginBottom: 16, boxSizing: "border-box" };
    const sBtn = { width: "100%", padding: "12px", borderRadius: 8, border: "none", background: "#3b82f6", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer" };
    const sLink = { color: "#3b82f6", cursor: "pointer", background: "none", border: "none", fontSize: 13 };
    const sErro = { color: "#ef4444", fontSize: 13, marginBottom: 12, textAlign: "center" };

  return (
        <div style={sContainer}>
          <div style={sCard}>
            <div style={sTitle}>RENDORA</div>
          <div style={sSub}>{modo === "login" ? "Acesse sua conta" : "Crie sua conta e empresa"}</div>
          <form onSubmit={modo === "login" ? handleLogin : handleCadastro}>
  {modo === "cadastro" && (<div><label style={sLabel}>Seu nome</label><input style={sInput} value={nome} onChange={function(e){setNome(e.target.value)}} placeholder="Nome completo" required /></div>)}
   {modo === "cadastro" && (<div><label style={sLabel}>Nome da empresa</label><input style={sInput} value={empresa} onChange={function(e){setEmpresa(e.target.value)}} placeholder="Ex: Restaurante Sabor" required /></div>)}
              <label style={sLabel}>Email</label>
              <input style={sInput} type="email" value={email} onChange={function(e){setEmail(e.target.value)}} placeholder="seu@email.com" required />
               <label style={sLabel}>Senha</label>
              <input style={sInput} type="password" value={senha} onChange={function(e){setSenha(e.target.value)}} placeholder="Sua senha" required minLength={6} />
   {erro && <div style={sErro}>{erro}</div>}
              <button style={sBtn} type="submit" disabled={carregando}>{carregando ? "Aguarde..." : modo === "login" ? "Entrar" : "Criar conta"}</button>
     </form>
            <div style={{ textAlign: "center", marginTop: 16 }}>
   {modo === "login" ? (<span style={{ color: "#8892a4", fontSize: 13 }}>Nao tem conta? <button style={sLink} onClick={function(){setModo("cadastro");setErro("");}}>Cadastre-se</button></span>) : (<span style={{ color: "#8892a4", fontSize: 13 }}>Ja tem conta? <button style={sLink} onClick={function(){setModo("login");setErro("");}}>Fazer login</button></span>)}
     </div>
     </div>
     </div>
     );
  }
