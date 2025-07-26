// resources/js/Pages/Dashboard.tsx

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import BarChart from '@/Components/Charts/BarChart';
import { getElementAtEvent, Chart } from 'react-chartjs-2'; // Import getElementAtEvent

const generateColors = (numColors: number) => {
  const colors = [];
  for (let i = 0; i < numColors; i++) {
    const r = Math.floor(Math.random() * 200);
    const g = Math.floor(Math.random() * 200);
    const b = Math.floor(Math.random() * 200);
    colors.push(`rgba(${r}, ${g}, ${b}, 0.7)`);
  }
  return colors;
};

export default function Dashboard({ auth }: PageProps) {
  const [loading, setLoading] = useState(true);
  const [chartsData, setChartsData] = useState<any>(null);
  const chartRef = useRef<Chart<'bar'>>(null);

  useEffect(() => {
    if (auth.user.role === 'koordinator') {
      axios.get(route('api.charts.coordinator-dashboard'))
        .then(res => setChartsData(res.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const progressPerGroupData = chartsData?.progressPerGroup && {
    labels: chartsData.progressPerGroup.map((d: any) => d.group_name),
    datasets: [{
      label: 'Rata-rata Halaman/Hari',
      data: chartsData.progressPerGroup.map((d: any) => d.avg_pages_per_day),
      backgroundColor: 'rgba(75, 192, 192, 0.7)',
    },{
      label: 'Rata-rata Hafalan/Hari',
      data: chartsData.progressPerGroup.map((d: any) => d.avg_hafalan_per_day),
      backgroundColor: 'rgba(255, 99, 132, 0.7)',
    }]
  };

  const handleChartClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!chartRef.current) return;

    const element = getElementAtEvent(chartRef.current, event);

    if (element.length > 0) {
      const dataIndex = element[0].index;
      const groupId = chartsData?.progressPerGroup[dataIndex]?.group_id;
      if (groupId) {
        // Navigasi ke halaman detail
        router.get(route('admin.dashboard.group-detail', { group: groupId }));
      }
    }
  }

  return (
    <AuthenticatedLayout
      header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Dashboard Koordinator</h2>}
    >
      <Head title="Dashboard Koordinator" />

      <div className="py-12">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg p-6">
            {loading && <p>Memuat data dasbor...</p>}
            {!loading && !chartsData && <p>Tidak ada data untuk ditampilkan.</p>}
            {!loading && chartsData && (
              <div>
                {progressPerGroupData && (
                  <div>
                    <p className="text-center text-gray-600 mb-2 text-sm">Klik pada bar untuk melihat detail kelompok</p>
                    <BarChart
                      ref={chartRef}
                      onClick={handleChartClick}
                      chartData={progressPerGroupData}
                      title="Rata-rata Progres Harian per Kelompok"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
