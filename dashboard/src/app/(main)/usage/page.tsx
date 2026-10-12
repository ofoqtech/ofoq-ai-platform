"use client";
import { useEffect, useState } from "react";
import { getMyUsage } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Zap, Brain, DollarSign, TrendingUp } from "lucide-react";

export default function UsagePage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    getMyUsage().then(setData);
  }, []);

  if (!data) return <div className="text-slate-500">جارٍ التحميل...</div>;

  const { thisMonth } = data;
  const chartData = Object.entries(thisMonth.byProvider || {}).map(([provider, tokens]) => ({
    name: provider === "ollama" ? "Ollama (محلي)" : "Claude API",
    tokens,
    fill: provider === "ollama" ? "#3b82f6" : "#8b5cf6",
  }));

  const savings = (thisMonth.byProvider?.ollama || 0) * 0.000003;

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-xl font-bold">استهلاكي هذا الشهر</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "إجمالي التوكن", value: thisMonth.totalTokens.toLocaleString(), icon: TrendingUp, color: "text-blue-400" },
          { label: "Ollama (مجاني)", value: (thisMonth.byProvider?.ollama || 0).toLocaleString(), icon: Zap, color: "text-green-400" },
          { label: "Claude API", value: (thisMonth.byProvider?.claude || 0).toLocaleString(), icon: Brain, color: "text-purple-400" },
          { label: "التكلفة الفعلية", value: `$${thisMonth.totalCostUsd.toFixed(4)}`, icon: DollarSign, color: "text-yellow-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card text-center">
            <Icon size={20} className={`${color} mx-auto mb-2`} />
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-slate-500 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {savings > 0 && (
        <div className="card bg-green-500/5 border-green-500/20">
          <p className="text-green-400 text-sm">
            💰 وفّرت <strong>${savings.toFixed(4)}</strong> هذا الشهر باستخدام Ollama بدل Claude لهذه المهام
          </p>
        </div>
      )}

      {chartData.length > 0 && (
        <div className="card">
          <h2 className="font-medium mb-4">التوزيع بين النماذج</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
                labelStyle={{ color: "#f1f5f9" }}
              />
              <Bar dataKey="tokens" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
