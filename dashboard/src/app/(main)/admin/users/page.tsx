"use client";
import { useState, useEffect } from "react";
import { getUsers, toggleUser, updateLimit, createUser } from "@/lib/api";
import { UserPlus, Power, Edit2 } from "lucide-react";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", monthlyTokenLimit: 500000 });
  const [editLimit, setEditLimit] = useState<{ id: string; limit: number } | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const data = await getUsers();
    setUsers(data);
  }

  async function handleAdd() {
    await createUser(form);
    setShowAdd(false);
    setForm({ name: "", email: "", password: "", monthlyTokenLimit: 500000 });
    load();
  }

  async function handleToggle(id: string, current: boolean) {
    await toggleUser(id, !current);
    load();
  }

  async function handleLimit() {
    if (!editLimit) return;
    await updateLimit(editLimit.id, editLimit.limit);
    setEditLimit(null);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">إدارة المبرمجين</h1>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
          <UserPlus size={16} /> إضافة مبرمج
        </button>
      </div>

      {showAdd && (
        <div className="card space-y-3">
          <h2 className="font-semibold">إضافة مبرمج جديد</h2>
          <div className="grid grid-cols-2 gap-3">
            <input className="input" placeholder="الاسم" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="input" placeholder="البريد الإلكتروني" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input type="password" className="input" placeholder="كلمة المرور" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <input type="number" className="input" placeholder="الحد الشهري (توكن)" value={form.monthlyTokenLimit}
              onChange={(e) => setForm({ ...form, monthlyTokenLimit: +e.target.value })} />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="btn-primary">حفظ</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg bg-surface-border text-slate-300 hover:text-white">إلغاء</button>
          </div>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border text-slate-400 text-right">
              <th className="px-4 py-3">المبرمج</th>
              <th className="px-4 py-3">الصلاحية</th>
              <th className="px-4 py-3">الاستهلاك / الحد</th>
              <th className="px-4 py-3">الحالة</th>
              <th className="px-4 py-3">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-surface-border last:border-0 hover:bg-surface-border/30">
                <td className="px-4 py-3">
                  <p className="font-medium text-white">{u.name}</p>
                  <p className="text-slate-500 text-xs">{u.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === "admin" ? "bg-purple-500/20 text-purple-300" : "bg-slate-700 text-slate-300"}`}>
                    {u.role === "admin" ? "أدمن" : "مبرمج"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="text-xs">
                    <span className="text-white">{(u.tokensUsedThisMonth || 0).toLocaleString()}</span>
                    <span className="text-slate-500"> / {(u.monthlyTokenLimit || 0).toLocaleString()}</span>
                  </div>
                  <div className="w-32 h-1.5 bg-surface-border rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-primary rounded-full"
                      style={{ width: `${Math.min(100, ((u.tokensUsedThisMonth || 0) / (u.monthlyTokenLimit || 1)) * 100)}%` }} />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${u.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                    {u.isActive ? "نشط" : "موقوف"}
                  </span>
                </td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => handleToggle(u.id, u.isActive)}
                    className={`p-1.5 rounded hover:opacity-80 ${u.isActive ? "text-red-400" : "text-green-400"}`}>
                    <Power size={14} />
                  </button>
                  <button onClick={() => setEditLimit({ id: u.id, limit: u.monthlyTokenLimit })}
                    className="p-1.5 rounded text-blue-400 hover:opacity-80">
                    <Edit2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editLimit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="card w-80 space-y-3">
            <h2 className="font-semibold">تعديل الحد الشهري</h2>
            <input type="number" className="input"
              value={editLimit.limit} onChange={(e) => setEditLimit({ ...editLimit, limit: +e.target.value })} />
            <div className="flex gap-2">
              <button onClick={handleLimit} className="btn-primary flex-1">حفظ</button>
              <button onClick={() => setEditLimit(null)} className="px-4 py-2 rounded-lg bg-surface-border text-slate-300 flex-1">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
