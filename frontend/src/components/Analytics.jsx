import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import api from "../api";
import { useTheme } from "../context/ThemeContext";

export default function Analytics() {
  const [data, setData] = useState([]);
  const { dark } = useTheme();

  useEffect(() => {
    api.get("/analytics/completion-rate").then((res) => setData(res.data)).catch(console.error);
  }, []);

  const chartColor = dark ? "#FFFFFF" : "#000000";
  const gridColor = dark ? "#333333" : "#E5E5E5";

  return (
    <div className="mt-12 card p-6">
      <h3 className="text-lg font-bold uppercase tracking-widest mb-6">7-Day Completion</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis
              dataKey="date"
              tickFormatter={(d) => d.slice(5)}
              tick={{ fill: chartColor, fontSize: 11 }}
              axisLine={{ stroke: gridColor }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: chartColor, fontSize: 11 }}
              axisLine={{ stroke: gridColor }}
              tickLine={false}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <Bar dataKey="rate" radius={[0, 0, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={index} fill={chartColor} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
