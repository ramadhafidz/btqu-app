import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useEffect, useState } from 'react';
import axios from 'axios';
import LineChart from '@/Components/Charts/LineChart';
import KpiCard from '@/Components/KpiCard';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';

export default function Dashboard({ auth }: PageProps) {
  const [loading, setLoading] = useState(true);
  const [chartsData, setChartsData] = useState<any>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  useEffect(() => {
    axios
      .get(route('api.charts.teacher-dashboard'))
      .then((res) => setChartsData(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const dailyProgressData = chartsData?.dailyProgress && {
    labels: chartsData.dailyProgress.map((d: any) =>
      format(parseISO(d.date), 'dd MMM', { locale: id })
    ),
    datasets: [
      {
        label: 'Halaman Selesai',
        data: chartsData.dailyProgress.map((d: any) => d.pages),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
      {
        label: 'Hafalan Baru',
        data: chartsData.dailyProgress.map((d: any) => d.hafalan),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  };

  return (
    <AuthenticatedLayout
      header={
        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
          Dashboard Guru
        </h2>
      }
    >
      <Head title="Dashboard Guru" />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 mb-6">
            <div className="text-gray-900">
              Selamat datang kembali, {auth.user.name}!
            </div>
          </div>

          {loading && (
            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              Memuat data grafik...
            </div>
          )}

          {!loading && !chartsData && (
            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              Tidak ada data untuk ditampilkan. Mulai catat progres siswa di
              halaman "Grup Saya".
            </div>
          )}

          {!loading && chartsData && (
            <div className="flex flex-col gap-6">
              {/* KPI Cards */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <KpiCard
                  title="Rata-rata Halaman/Hari"
                  value={chartsData.avgPagesPerDay}
                  icon={
                    <BookOpenIcon className="w-8 h-8 text-blue-500" />
                  }
                />

                <KpiCard
                  title="Rata-rata Hafalan/Hari"
                  value={chartsData.avgHafalanPerDay}
                  icon={
                    <ClipboardDocumentCheckIcon className="w-8 h-8 text-green-500" />
                  }
                />
              </div>

              {/* Line Chart */}

              {dailyProgressData && (
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-4">
                  <LineChart
                    chartData={dailyProgressData}
                    title="Progres Harian Kelompok Anda"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
