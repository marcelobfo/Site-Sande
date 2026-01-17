
import React, { useState } from 'react';
import { LayoutGrid, List, Trash2, Edit3, Calendar } from 'lucide-react';
import { BlogPost } from '../../types';

interface AdminBlogProps {
  posts: BlogPost[];
  onEdit: (post: BlogPost) => void;
  onDelete: (id: string) => void;
}

export const AdminBlog: React.FC<AdminBlogProps> = ({ posts, onEdit, onDelete }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2 bg-white p-2 rounded-2xl border border-gray-100 w-fit ml-auto">
        <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-brand-purple text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}><LayoutGrid size={20}/></button>
        <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-brand-purple text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}><List size={20}/></button>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map(post => (
            <div key={post.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100 group hover:border-brand-purple transition-all flex flex-col">
              <div className="relative aspect-video">
                <img src={post.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute top-4 right-4 bg-brand-orange text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">{post.category}</div>
              </div>
              <div className="p-6 flex-grow flex flex-col">
                <h4 className="font-black text-brand-dark leading-tight mb-4 group-hover:text-brand-purple transition-colors line-clamp-2">{post.title}</h4>
                <div className="mt-auto flex justify-between items-center pt-4 border-t border-gray-50">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{new Date(post.publish_date).toLocaleDateString()}</span>
                  <div className="flex gap-2">
                    <button onClick={() => onEdit(post)} className="p-2 text-brand-purple hover:bg-brand-purple/5 rounded-lg transition-all"><Edit3 size={16}/></button>
                    <button onClick={() => onDelete(post.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16}/></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4 bg-white p-6 rounded-[2.5rem] border border-gray-100">
          {posts.map(post => (
            <div key={post.id} className="flex items-center gap-6 p-4 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100 group">
              <img src={post.image_url} className="w-24 h-16 rounded-xl object-cover border border-gray-100 shadow-sm" />
              <div className="flex-grow">
                <h4 className="font-black text-brand-dark group-hover:text-brand-purple transition-colors">{post.title}</h4>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{post.category} • {new Date(post.publish_date).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => onEdit(post)} className="p-3 text-brand-purple hover:bg-brand-purple/10 rounded-xl transition-all"><Edit3 size={18} /></button>
                <button onClick={() => onDelete(post.id)} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
