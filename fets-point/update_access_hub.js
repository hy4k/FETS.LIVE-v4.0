import fs from 'fs';

const file = 'src/components/AccessHub.tsx';
let content = fs.readFileSync(file, 'utf8');

// Update Props interface
content = content.replace(/variant\?: "default" \| "emerald";/, 'variant?: "default" | "emerald" | "yellow";');

// Update containerClass logic
content = content.replace(
  /const containerClass =[\s\S]*?variant === "emerald"[\s\S]*?bg-gradient-to-br from-\[#F0FDF4\] to-\[#ECFDF5\][\s\S]*?: "bg-\[var\(--dashboard-bg, #EEF2F9\)\][^;]+;/,
  `const containerClass = variant === "emerald" 
    ? "bg-gradient-to-br from-[#10B981] to-[#047857] shadow-lg text-white" 
    : variant === "yellow" 
    ? "bg-[#1A1D24]/90 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-[#353A47]"
    : "bg-[#0D0E11] rounded-[2rem] shadow-[0_4px_15px_rgba(0,0,0,0.5)] border border-[#353A47]";`
);

// We need a safer replace for the rest:
content = content.replace('variant === "emerald" ? "text-emerald-900" : "text-slate-800"', 'variant === "yellow" ? "text-white" : "text-white"');
content = content.replace('variant === "emerald" ? "text-emerald-600/70" : "text-slate-400"', 'variant === "yellow" ? "text-[#F59E0B]" : "text-slate-400"');
content = content.replace('variant === "emerald" ? "bg-emerald-100 text-emerald-600 shadow-emerald-200/50" : "bg-gradient-to-br from-slate-700 to-slate-900 text-white shadow-lg"', 'variant === "yellow" ? "bg-[#F59E0B]/10 text-[#F59E0B] shadow-[0_0_15px_rgba(245,158,11,0.3)]" : "bg-slate-800 text-white shadow-lg"');

content = content.replace(/{variant === "emerald" && \(/, '{variant === "yellow" && (');
content = content.replace(/bg-emerald-400\/5/g, 'bg-[#F59E0B]/10');

fs.writeFileSync(file, content);
console.log("Updated AccessHub");
