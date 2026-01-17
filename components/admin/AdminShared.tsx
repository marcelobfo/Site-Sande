
import React from 'react';
import { Upload, RefreshCcw } from 'lucide-react';

// Fix: Use React.FC to ensure proper children prop handling and type inference across different files
export const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="bg-white p-10 lg:p-14 rounded-[4rem] shadow-sm border border-gray-100 mb-10">
    <div className="flex items-center gap-4 mb-12 border-b border-gray-50 pb-8">
      <div className="bg-gray-50 p-5 rounded-2xl shadow-inner text-brand-purple">{icon}</div>
      <h3 className="text-2xl font-black text-brand-dark uppercase tracking-tight">{title}</h3>
    </div>
    <div className="space-y-10">{children}</div>
  </div>
);

export const AdminInput = ({ label, value, onChange, textarea, type = "text", placeholder, required, icon }: any) => (
  <div className="w-full">
    {label && (
      <div className="flex items-center gap-2 mb-3 px-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">{label} {required && '*'}</label>
      </div>
    )}
    <div className="relative group">
      {icon && <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-brand-purple transition-colors">{icon}</div>}
      {textarea ? (
        <textarea rows={5} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full p-6 bg-gray-50/50 border-2 border-transparent focus:border-brand-purple focus:bg-white rounded-[2rem] font-bold text-brand-dark transition-all resize-none outline-none shadow-inner" />
      ) : (
        <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={`w-full ${icon ? 'pl-14 pr-8' : 'px-8'} py-5 bg-gray-50/50 border-2 border-transparent focus:border-brand-purple focus:bg-white rounded-2xl font-bold text-brand-dark transition-all outline-none shadow-inner`} />
      )}
    </div>
  </div>
);

export const ImageUp = ({ label, current, onUpload }: any) => (
  <div className="space-y-4">
    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block px-1">{label}</label>
    <div className="border-2 border-dashed border-gray-200 rounded-[3rem] p-10 text-center hover:border-brand-purple hover:bg-white transition-all relative overflow-hidden bg-gray-50/50 min-h-[260px] flex flex-col items-center justify-center gap-5 group">
      {current ? (
        <div className="relative">
          <img src={current} className="max-h-40 rounded-3xl shadow-xl border-4 border-white transition-transform group-hover:scale-105 duration-500" />
          <div className="absolute inset-0 bg-brand-dark/40 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-[2px]">
            <div className="bg-white p-3 rounded-full text-brand-purple shadow-lg"><RefreshCcw size={24} /></div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="p-6 bg-white rounded-full shadow-sm text-gray-200 group-hover:text-brand-purple transition-colors">
            <Upload size={36} />
          </div>
          <div className="space-y-1">
             <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Clique ou Arraste</p>
             <p className="text-[9px] text-gray-300 font-bold">PNG, JPG ou WEBP (Max 2MB)</p>
          </div>
        </div>
      )}
      <input type="file" accept="image/*" onChange={onUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
    </div>
  </div>
);
