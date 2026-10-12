"use client";
import { useState, useEffect } from "react";
import { getApiKeys, createApiKey, revokeApiKey } from "@/lib/api";
import { Key, Plus, Trash2, Copy, Check } from "lucide-react";

export default function KeysPage() {
  const [keys, setKeys] = useState<any[]>([]);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => { load(); }, []);
  async function load() { setKeys(await getApiKeys()); }

  async function handleCreate() {
    if (!name.trim()) return;
    const k = await createApiKey(name);
    setNewKey(k.key);
    setName("");
    load();
  }

  async function handleRevoke(id: string) {
    if (!confirm("سيتوقف العمل بهذا المفتاح، هل أنت متأكد؟")) return;
    await revokeApiKey(id);
    load();
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-xl font-bold">مفاتيح API</h1>
      <p className="text-slate-400 text-sm">استخدم هذه المفاتيح في VS Code Extension للاتصال بالأيجنت مباشرة.</p>

      {newKey && (
        <div className="card border-green-500/30 bg-green-500/5 space-y-2">
          <p className="text-green-400 text-sm font-medium">✅ تم إنشاء المفتاح — احفظه الآن، لن يظهر مرة أخرى!</p>
          <div className="flex gap-2 items-center">
            <code className="flex-1 bg-black/30 px-3 py-2 rounded-lg text-xs font-mono text-green-300 break-all">{newKey}</code>
            <button onClick={() => copy(newKey)} className="p-2 rounded-lg bg-green-500/20 text-green-400 shrink-0">
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
          <button onClick={() => setNewKey(null)} className="text-slate-500 text-xs hover:text-white">إخفاء</button>
        </div>
      )}

      <div className="card space-y-3">
        <h2 className="font-medium flex items-center gap-2"><Key size={16} /> إنشاء مفتاح جديد</h2>
        <div className="flex gap-2">
          <input className="input" placeholder="اسم المفتاح (مثال: VS Code Work)" value={name} onChange={(e) => setName(e.target.value)} />
          <button onClick={handleCreate} className="btn-primary flex items-center gap-2 shrink-0">
            <Plus size={16} /> إنشاء
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {keys.map((k) => (
          <div key={k.id} className="card flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{k.name}</p>
              <p className="text-slate-500 text-xs">
                {k.isActive ? "نشط" : "ملغي"} ·
                {k.lastUsedAt ? ` آخر استخدام: ${new Date(k.lastUsedAt).toLocaleDateString("ar")}` : " لم يُستخدم بعد"}
              </p>
            </div>
            <button onClick={() => handleRevoke(k.id)} className="text-red-400 hover:text-red-300 p-2">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        {keys.length === 0 && <p className="text-slate-500 text-sm text-center py-8">لا توجد مفاتيح بعد</p>}
      </div>
    </div>
  );
}
