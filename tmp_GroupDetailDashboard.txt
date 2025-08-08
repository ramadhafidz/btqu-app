// resources/js/Pages/Admin/GroupDetailDashboard.tsx

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { BtqGroup, PageProps } from '@/types';
import { useEffect, useState } from 'react';
import axios from 'axios';
import LineChart from '@/Components/Charts/LineChart';
import KpiCard from '@/Components/KpiCard';

export default function GroupDetailDashboard({
  auth,
  group,
}: PageProps & { group: BtqGroup }) {
  const [loading, setLoading] = useState(true);
  const [chartsData, setChartsData] = useState<any>(null);

  useEffect(() => {
    axios
      .get(route('admin.api.charts.group-detail', { group: group.id }))
      .then((res) => setChartsData(res.data))
      .catch((err) => {
        console.error(err);
        setChartsData(null);
      })
      .finally(() => setLoading(false));
  }, [group.id]);

  const dailyProgressData = chartsData?.dailyProgress && {
    labels: chartsData.dailyProgress.map((d: any) => d.date),
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
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-xl text-gray-800 leading-tight">
            Detail Dasbor: {chartsData?.groupName || 'Memuat...'}
          </h2>
          <Link
            href={route('dashboard')}
            className="text-sm text-indigo-600 hover:underline"
          >
            &larr; Kembali ke Dasbor Koordinator
          </Link>
        </div>
      }
    >
      <Head title={`Detail ${chartsData?.groupName}`} />
      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {loading && (
            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              Memuat data grafik...
            </div>
          )}

          {!loading && !chartsData && (
            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              Tidak ada progres yang tercatat untuk kelompok ini.
            </div>
          )}

          {!loading && chartsData && (
            <div className="flex flex-col gap-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <KpiCard
                  title="Rata-rata Halaman/Hari"
                  value={chartsData.avgPagesPerDay}
                  period="30 hari terakhir"
                />
                <KpiCard
                  title="Rata-rata Hafalan/Hari"
                  value={chartsData.avgHafalanPerDay}
                  period="30 hari terakhir"
                />
              </div>

              {/* Line Chart */}
              {dailyProgressData && (
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-4">
                  <LineChart
                    chartData={dailyProgressData}
                    title="Progres Harian Kelompok"
                  />
                </div>
              )}

              {/* [BARU] Tabel Rincian Siswa */}
              {chartsData.progressPerStudent && (
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Rincian Performa Siswa (30 Hari Terakhir)
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Nama Siswa
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Rata-rata Halaman/Hari
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Rata-rata Hafalan/Hari
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {chartsData.progressPerStudent.map(
                            (student: any, index: number) => (
                              <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {student.nama_lengkap}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {student.avg_pages_per_day}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {student.avg_hafalan_per_day}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
