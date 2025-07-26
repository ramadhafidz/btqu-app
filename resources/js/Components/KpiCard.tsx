// resources/js/Components/KpiCard.tsx

interface KpiCardProps {
  title: string;
  value: string | number;
  period: string;
}

export default function KpiCard({ title, value, period }: KpiCardProps) {
  return (
    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 flex flex-col">
      <h3 className="text-sm font-medium text-gray-500 truncate">{title}</h3>
      <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{period}</p>
    </div>
  );
}
