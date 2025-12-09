import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title = 'Kayıt Yok', description = 'Gösterilecek veri bulunamadı.' }) => (
  <div className="flex flex-col items-center justify-center p-10 text-slate-500">
    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
      <Inbox size={28} className="text-slate-400" />
    </div>
    <p className="font-bold mb-1">{title}</p>
    <p className="text-sm text-slate-400">{description}</p>
  </div>
);

export default EmptyState;
