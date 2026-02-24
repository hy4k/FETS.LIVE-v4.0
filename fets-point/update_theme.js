import fs from 'fs';

const file = 'src/components/CommandCentreFinal.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/text-slate-800/g, 'text-[#FDFFF8]');
content = content.replace(/text-slate-700/g, 'text-[#E2E8F0]');
content = content.replace(/text-slate-600/g, 'text-[#A0A5B5]');
content = content.replace(/text-slate-500/g, 'text-[#A0A5B5]');
content = content.replace(/text-slate-400/g, 'text-[#6B7280]');
content = content.replace(/text-slate-300/g, 'text-[#4B5563]');
content = content.replace(/text-slate-200/g, 'text-[#353A47]');
content = content.replace(/text-slate-100/g, 'text-[#1A1D24]');

content = content.replaceAll('bg-white/40', 'bg-[#15171C]/40');
content = content.replaceAll('bg-white/50', 'bg-[#15171C]/50');
content = content.replaceAll('bg-white/60', 'bg-[#15171C]/60');
content = content.replaceAll('bg-white/80', 'bg-[#15171C]/80');
content = content.replaceAll('bg-white', 'bg-[#15171C]');

content = content.replaceAll('border-white/60', 'border-[#353A47]');
content = content.replaceAll('border-white/50', 'border-[#353A47]');
content = content.replaceAll('border-white/40', 'border-[#353A47]');
content = content.replaceAll('border-white/80', 'border-[#353A47]');

content = content.replace(/border-slate-[12]00/g, 'border-[#353A47]');
content = content.replaceAll('from-slate-700 to-slate-500', 'from-[#F59E0B] to-amber-600');
content = content.replaceAll('bg-[var(--dashboard-bg, #EEF2F9)]', 'bg-[#0D0E11]');

fs.writeFileSync(file, content);
console.log('Update complete.');
