import { ReactNode } from 'react';

interface KpiCardProps {
  title: string;

  value: string | number;

  icon: ReactNode; // Tambahkan prop untuk ikon
}

export default function KpiCard({ title, value, icon }: KpiCardProps) {
  return (
    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 flex items-center">
      <div className="flex-shrink-0 bg-gray-100 rounded-full p-3">{icon}</div>

      <div className="ml-5">
        <h3 className="text-sm font-medium text-gray-500 truncate">{title}</h3>

        <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
