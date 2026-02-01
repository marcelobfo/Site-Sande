import React, { useState } from 'react';
import { Calendar, Mail, Package, X, Phone, Database, Edit3, Trash2, DollarSign, GripVertical } from 'lucide-react';
import { Lead, LeadStatus } from '../../types';
import { supabase } from '../../lib/supabase';
import { NotificationType } from '../../components/Notification';

interface AdminLeadsProps {
  leads: Lead[];
  onUpdate: () => void;
  notify: (type: NotificationType, title: string, message: string) => void;
}

const STATUS_OPTIONS: LeadStatus[] = ['Novo', 'Aguardando Pagamento', 'Pago', 'Aprovado', 'Cancelado', 'Em Contato', 'Fechado', 'Perdido'];

const getStatusColor = (status: LeadStatus) => {
  switch (status) {
    case 'Pago':
    case 'Fechado': 
    case 'Aprovado': return 'bg-green-500';
    case 'Aguardando Pagamento': return 'bg-brand-orange';
    case 'Cancelado':
    case 'Perdido': return 'bg-red-500';
    case 'Novo': return 'bg-blue-500';
    case 'Em Contato': return 'bg-brand-purple';
    default: return 'bg-gray-400';
  }
};

export const AdminLeads: React.FC<AdminLeadsProps> = ({ leads, onUpdate, notify }) => {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<string | null>(null);

  const updateLeadStatus = async (leadId: string, newStatus: LeadStatus) => {
    const { error } = await supabase.from('leads').update({ status: newStatus }).eq('id', leadId);
    if (!error) {
      onUpdate();
      if (selectedLead?.id === leadId) setSelectedLead(prev => prev ? { ...prev, status: newStatus } : null);
      notify('success', 'Status Atualizado', `Lead movido para: ${newStatus}`);
    } else {
      notify('error', 'Erro ao mover', error.message);
    }
  };

  const deleteLead = async (id: string) => {
    if (confirm("Excluir este lead permanentemente?")) {
      await supabase.from('leads').delete().eq('id', id);
      onUpdate();
      setSelectedLead(null);
      notify('success', 'Lead Removido', 'Registro excluído com sucesso.');
    }
  };

  const onDragStart = (e: React.DragEvent, id: string) => {
    setDraggedLeadId(id);
    e.dataTransfer.setData('leadId', id);
    // Efeito visual de transparência durante o arraste
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const onDragEnd = (e: React.DragEvent) => {
    setDraggedLeadId(null);
    setIsDraggingOver(null);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  };

  const onDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    setIsDraggingOver(status);
  };

  const onDrop = (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('leadId');
    if (id) {
      updateLeadStatus(id, status);
    }
    setIsDraggingOver(null);
    setDraggedLeadId(null);
  };

  return (
    <div className="flex gap-6 overflow-x-auto pb-12 pt-2 min-h-[calc(100vh-250px)] custom-scrollbar-h items-start">
      {STATUS_OPTIONS.map(status => (
        <div 
          key={status} 
          onDragOver={(e) => onDragOver(e, status)}
          onDrop={(e) => onDrop(e, status)}
          className={`p-5 rounded-[2.5rem] min-w-[320px] max-w-[320px] flex flex-col border transition-all duration-300 ${
            isDraggingOver === status 
            ? 'bg-brand-purple/10 border-brand-purple border-dashed scale-[1.02]' 
            : 'bg-gray-100/50 border-gray-200/50'
          }`}
        >
          <div className="flex justify-between items-center mb-6 px-3">
            <div className="flex items-center gap-2">
               <div className={`w-3 h-3 rounded-full ${getStatusColor(status)} shadow-sm`}></div>
               <h4 className="font-black text-[11px] uppercase text-brand-dark tracking-widest">{status}</h4>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-gray-400">
                {leads.filter(l => l.status === status).length}
              </span>
              {leads.filter(l => l.status === status).some(l => l.value) && (
                <span className="bg-white px-2 py-0.5 rounded-full text-[9px] font-black text-brand-purple border border-gray-100 shadow-sm">
                  R$ {leads.filter(l => l.status === status).reduce((acc, curr) => acc + (Number(curr.value) || 0), 0).toLocaleString()}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-4 flex-grow px-1 min-h-[200px]">
            {leads.filter(l => l.status === status).map(lead => (
              <div 
                key={lead.id} 
                draggable 
                onDragStart={(e) => onDragStart(e, lead.id)}
                onDragEnd={onDragEnd}
                onClick={() => setSelectedLead(lead)} 
                className={`bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing hover:shadow-md hover:scale-[1.02] transition-all group relative overflow-hidden flex flex-col ${
                  draggedLeadId === lead.id ? 'ring-2 ring-brand-purple border-transparent' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                   <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-1">
                     <Calendar size={10} /> {new Date(lead.created_at).toLocaleDateString()}
                   </p>
                   <GripVertical size={14} className="text-gray-200 group-hover:text-gray-300 transition-colors" />
                </div>

                <h5 className="font-black text-brand-dark text-base leading-tight group-hover:text-brand-purple transition-colors mb-4 line-clamp-2">
                  {lead.name}
                </h5>
                
                <div className="flex items-center justify-between mt-auto gap-2">
                  <div className="flex flex-col gap-1.5 min-w-0 flex-grow">
                    {lead.product_name && (
                      <div className="bg-gray-50 px-3 py-1.5 rounded-xl flex items-center gap-2 border border-gray-100 w-fit max-w-full">
                        <Package size={10} className="text-gray-400 shrink-0" />
                        <span className="text-[8px] font-black text-gray-500 truncate uppercase">{lead.product_name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400 truncate pl-1">
                      <Mail size={10} className="shrink-0" /> {lead.email}
                    </div>
                  </div>

                  {lead.value && (
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-[11px] font-black text-brand-purple bg-brand-purple/5 px-3 py-1.5 rounded-2xl border border-brand-purple/10 flex items-center gap-1">
                        <DollarSign size={10} />
                        {Number(lead.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </div>

                <div className={`absolute left-0 top-0 bottom-0 w-1 ${getStatusColor(status)}`}></div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {selectedLead && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-brand-dark/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-3xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300">
             <div className="p-8 border-b flex justify-between items-center bg-gray-50">
                <div className="flex items-center gap-4">
                   <div className={`w-4 h-4 rounded-full ${getStatusColor(selectedLead.status)} shadow-sm`}></div>
                   <h3 className="text-2xl font-black text-brand-dark uppercase tracking-tighter">{selectedLead.name}</h3>
                </div>
                <button onClick={() => setSelectedLead(null)} className="p-3 hover:bg-gray-100 rounded-2xl transition-all"><X size={24} className="text-gray-300" /></button>
             </div>
             <div className="p-10 space-y-10 overflow-y-auto custom-scrollbar flex-grow">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="flex items-center gap-5 bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100">
                    <div className="bg-white p-4 rounded-2xl text-brand-purple shrink-0 shadow-sm"><Mail size={20}/></div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">E-mail</p>
                      <p className="font-bold text-brand-dark text-base break-words">{selectedLead.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-5 bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100">
                    <div className="bg-white p-4 rounded-2xl text-brand-purple shrink-0 shadow-sm"><Phone size={20}/></div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">WhatsApp</p>
                      <p className="font-bold text-brand-dark text-base">{selectedLead.whatsapp || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-5 bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100">
                    <div className="bg-white p-4 rounded-2xl text-brand-purple shrink-0 shadow-sm"><Package size={20}/></div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Produto / Valor</p>
                      <p className="font-bold text-brand-dark text-base">{selectedLead.product_name || 'N/A'} - R$ {Number(selectedLead.value || 0).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-5 bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100">
                    <div className="bg-white p-4 rounded-2xl text-brand-purple shrink-0 shadow-sm"><Database size={20}/></div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Origem</p>
                      <p className="font-bold text-brand-dark text-base">{selectedLead.subject || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100">
                   <h4 className="font-black text-xs uppercase tracking-widest text-brand-purple mb-6 flex items-center gap-2">
                     <Edit3 size={14}/> Observações do Atendimento
                   </h4>
                   <p className="text-gray-600 font-medium leading-relaxed italic">"{selectedLead.message || 'Sem observações adicionais.'}"</p>
                </div>

                <div className="space-y-4">
                   <h4 className="font-black text-xs uppercase tracking-[0.2em] text-brand-purple pl-2">Alterar Status Manualmente</h4>
                   <div className="flex flex-wrap gap-2.5">
                      {STATUS_OPTIONS.map(opt => (
                        <button key={opt} onClick={() => updateLeadStatus(selectedLead.id, opt)} className={`px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedLead.status === opt ? 'bg-brand-purple text-white shadow-xl scale-105' : 'bg-white border border-gray-100 text-gray-400 hover:border-brand-purple hover:text-brand-purple'}`}>{opt}</button>
                      ))}
                   </div>
                </div>
             </div>
             <div className="p-8 bg-gray-50 border-t flex justify-between items-center">
                <button onClick={() => deleteLead(selectedLead.id)} className="flex items-center gap-2 text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-50 px-4 py-2 rounded-xl transition-all"><Trash2 size={16}/> Excluir Lead</button>
                <button onClick={() => setSelectedLead(null)} className="bg-brand-dark text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Fechar Detalhes</button>
             </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar-h::-webkit-scrollbar {
          height: 10px;
        }
        .custom-scrollbar-h::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 20px;
          margin: 0 40px;
        }
        .custom-scrollbar-h::-webkit-scrollbar-thumb {
          background: #7E22CE20;
          border-radius: 20px;
          border: 2px solid #f1f1f1;
        }
        .custom-scrollbar-h::-webkit-scrollbar-thumb:hover {
          background: #7E22CE50;
        }
      `}</style>
    </div>
  );
};