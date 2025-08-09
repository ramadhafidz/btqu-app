import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { BtqGroup, PageProps } from '@/types';
import { useEffect, useState } from 'react';
import axios from 'axios';
import LineChart from '@/Components/Charts/LineChart';
import BarChart from '@/Components/Charts/BarChart';
import KpiCard from '@/Components/KpiCard';
import {
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

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
        borderColor: '#005929',
        backgroundColor: '#00592955',
      },
      // Comment dulu hafalan
      // {
      //   label: 'Hafalan Baru',
      //   data: chartsData.dailyProgress.map((d: any) => d.hafalan),
      //   borderColor: 'rgb(255, 99, 132)',
      //   backgroundColor: 'rgba(255, 99, 132, 0.5)',
      // },
    ],
  };

  const studentPerformanceChartData = chartsData?.progressPerStudent && {
    labels: chartsData.progressPerStudent.map((s: any) => s.nama_lengkap),
    datasets: [
      {
        label: 'Rata-rata Halaman/Hari',
        data: chartsData.progressPerStudent.map(
          (s: any) => s.avg_pages_per_day
        ),
        backgroundColor: '#826F4F99',
        borderColor: '#826F4F',
        borderWidth: 1,
      },
      // Future dataset for hafalan (commented)
      // {
      //   label: 'Rata-rata Hafalan/Hari',
      //   data: chartsData.progressPerStudent.map(
      //     (s: any) => s.avg_hafalan_per_day
      //   ),
      //   backgroundColor: 'rgba(16, 185, 129, 0.6)',
      //   borderColor: 'rgba(16, 185, 129, 1)',
      //   borderWidth: 1,
      // },
    ],
  };

  return (
    <AuthenticatedLayout
      header={
        <div className="flex flex-col-reverse gap-3 md:flex-row md:items-center md:justify-between">
          <Link
            href={route('dashboard')}
            className="group inline-flex w-fit items-center gap-2 text-sm font-medium text-[#005929] rounded-md px-3 py-1.5 bg-[#005929]/10 hover:bg-[#005929]/15 focus:outline-none focus:ring-2 focus:ring-[#005929] focus:ring-offset-1 transition"
          >
            <ArrowLeftIcon className="h-4 w-4 transition group-hover:-translate-x-0.5" />
            <span>Kembali ke Dasbor Koordinator</span>
          </Link>
          <h2 className="font-semibold text-xl text-gray-800 leading-tight">
            Detail Dasbor: {chartsData?.groupName || 'Memuat...'}
          </h2>
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
                  icon={<BookOpenIcon className="w-8 h-8 text-[#005929]" />}
                />
                <KpiCard
                  title="Total Halaman Selesai"
                  value={chartsData.activeDaysInfo?.totalPages || 0}
                  icon={<BookOpenIcon className="w-8 h-8 text-[#826F4F]" />}
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

              {/* Student Performance Chart */}
              {studentPerformanceChartData && (
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Rincian Performa Siswa (30 Hari Terakhir)
                  </h3>
                  <BarChart
                    chartData={studentPerformanceChartData}
                    title="Rata-rata Halaman/Hari per Siswa"
                  />
                </div>
              )}

              {/* Active Days Info */}
              {chartsData.activeDaysInfo && (
                <div className="bg-white shadow-sm sm:rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {(() => {
                      const info = chartsData.activeDaysInfo;
                      const startFmt = info.startDate;
                      const endFmt = info.endDate;
                      return `Informasi Hari Aktif (${info.rangeLabel}: ${startFmt} – ${endFmt})`;
                    })()}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="font-medium text-gray-600">
                        Total Hari
                      </div>
                      <div className="text-xl font-bold text-[#826F4F]">
                        {Math.round(chartsData.activeDaysInfo.period)}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="font-medium text-gray-600">Weekend</div>
                      <div className="text-xl font-bold text-red-600">
                        -{chartsData.activeDaysInfo.weekends}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="font-medium text-gray-600">
                        Hari Libur
                      </div>
                      <div className="text-xl font-bold text-orange-600">
                        -{chartsData.activeDaysInfo.holidays}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="font-medium text-gray-600">
                        Hari Aktif
                      </div>
                      <div className="text-xl font-bold text-[#005929]">
                        {chartsData.activeDaysInfo.activeDays}
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 p-4 bg-gradient-to-r from-[#005929]/5 to-[#826F4F]/5 rounded-lg border border-[#005929]/30">
                    <h4 className="font-semibold text-[#005929] mb-3 flex items-center">
                      <span className="mr-2">📊</span>
                      Rumus Perhitungan
                    </h4>
                    <div className="mb-3 p-3 bg-white rounded border-l-4 border-[#826F4F]">
                      <div className="text-sm font-medium text-gray-700 mb-1">
                        Hari Aktif:
                      </div>
                      <div className="font-mono text-lg text-[#826F4F] bg-[#826F4F]/10 px-3 py-2 rounded inline-block">
                        {Math.round(chartsData.activeDaysInfo.period)} -{' '}
                        {chartsData.activeDaysInfo.weekends} -{' '}
                        {chartsData.activeDaysInfo.holidays} ={' '}
                        <span className="font-bold text-[#826F4F]">
                          {chartsData.activeDaysInfo.activeDays}
                        </span>{' '}
                        hari
                      </div>
                    </div>
                    <div className="mb-3 p-3 bg-white rounded border-l-4 border-[#005929]">
                      <div className="text-sm font-medium text-gray-700 mb-1">
                        Rata-rata Halaman per Hari:
                      </div>
                      <div className="font-mono text-lg text-[#005929] bg-[#005929]/10 px-3 py-2 rounded inline-block">
                        {chartsData.activeDaysInfo.totalPages} ÷{' '}
                        {chartsData.activeDaysInfo.activeDays} ={' '}
                        <span className="font-bold text-[#005929]">
                          {chartsData.avgPagesPerDay}
                        </span>{' '}
                        hlm/hari
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-amber-50 rounded border border-amber-200">
                      <div className="text-sm text-amber-800">
                        <span className="font-medium">💡 Catatan:</span>{' '}
                        Perhitungan menggunakan hari aktif (
                        <span className="font-semibold">
                          {chartsData.activeDaysInfo.activeDays} hari
                        </span>
                        ) untuk konsistensi seluruh sistem.
                      </div>
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
