import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useEffect, useState } from 'react';
import axios from 'axios';
import LineChart from '@/Components/Charts/LineChart';
import BarChart from '@/Components/Charts/BarChart';
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
  const [range, setRange] = useState<'last7' | 'last30' | 'month' | 'year'>(
    'last30'
  );
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1); // 1-12
  const [year, setYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    setLoading(true);
    const params: any = { range };
    if (range === 'month') {
      params.month = month;
      params.year = year;
    } else if (range === 'year') {
      params.year = year;
    }
    axios
      .get(route('api.charts.teacher-dashboard'), { params })
      .then((res) => setChartsData(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [range, month, year]);

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
      // Comment dulu hafalan
      // {
      //   label: 'Hafalan Baru',
      //   data: chartsData.dailyProgress.map((d: any) => d.hafalan),
      //   borderColor: 'rgb(255, 99, 132)',
      //   backgroundColor: 'rgba(255, 99, 132, 0.5)',
      // },
    ],
  };

  // Chart data for student performance (avg pages per day)
  const studentPerformanceChartData = chartsData?.progressPerStudent && {
    labels: chartsData.progressPerStudent.map((s: any) => s.nama_lengkap),
    datasets: [
      {
        label: 'Rata-rata Halaman/Hari',
        data: chartsData.progressPerStudent.map(
          (s: any) => s.avg_pages_per_day
        ),
        backgroundColor: 'rgba(59, 130, 246, 0.6)', // blue-500
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
      // Future dataset for hafalan (currently zero / commented)
      // {
      //   label: 'Rata-rata Hafalan/Hari',
      //   data: chartsData.progressPerStudent.map(
      //     (s: any) => s.avg_hafalan_per_day
      //   ),
      //   backgroundColor: 'rgba(16, 185, 129, 0.6)', // emerald-500
      //   borderColor: 'rgba(16, 185, 129, 1)',
      //   borderWidth: 1,
      // },
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
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="text-gray-900 text-lg font-medium">
              Selamat datang kembali, {auth.user.name}!
            </div>
            <div className="flex flex-wrap items-end gap-3 text-sm">
              <div>
                <label
                  className="block text-gray-600 mb-1"
                  htmlFor="rangeSelect"
                >
                  Rentang
                </label>
                <select
                  id="rangeSelect"
                  value={range}
                  onChange={(e) => setRange(e.target.value as any)}
                  className="border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  title="Pilih rentang waktu"
                >
                  <option value="last7">7 Hari Terakhir</option>
                  <option value="last30">30 Hari Terakhir</option>
                  <option value="month">Per Bulan</option>
                  <option value="year">Per Tahun</option>
                </select>
              </div>
              {range === 'month' && (
                <>
                  <div>
                    <label
                      className="block text-gray-600 mb-1"
                      htmlFor="monthSelect"
                    >
                      Bulan
                    </label>
                    <select
                      id="monthSelect"
                      value={month}
                      onChange={(e) => setMonth(Number(e.target.value))}
                      className="border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      title="Pilih bulan"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      className="block text-gray-600 mb-1"
                      htmlFor="yearInputMonth"
                    >
                      Tahun
                    </label>
                    <input
                      id="yearInputMonth"
                      type="number"
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                      className="border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 w-24"
                      title="Masukkan tahun"
                    />
                  </div>
                </>
              )}
              {range === 'year' && (
                <div>
                  <label
                    className="block text-gray-600 mb-1"
                    htmlFor="yearInput"
                  >
                    Tahun
                  </label>
                  <input
                    id="yearInput"
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 w-24"
                    title="Masukkan tahun"
                  />
                </div>
              )}
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
                  icon={<BookOpenIcon className="w-8 h-8 text-blue-500" />}
                />
                <KpiCard
                  title="Total Halaman Selesai"
                  value={chartsData.activeDaysInfo?.totalPages || 0}
                  icon={<BookOpenIcon className="w-8 h-8 text-green-500" />}
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

              {/* Student Performance Chart (moved above Active Days Info) */}
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

              {/* Active Days Info (moved below performance chart) */}
              {chartsData.activeDaysInfo && (
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {(() => {
                      const info = chartsData.activeDaysInfo;
                      const startFmt = format(
                        parseISO(info.startDate),
                        'd MMM yyyy',
                        { locale: id }
                      );
                      const endFmt = format(
                        parseISO(info.endDate),
                        'd MMM yyyy',
                        { locale: id }
                      );
                      return `Informasi Hari Aktif (${info.rangeLabel}: ${startFmt} – ${endFmt})`;
                    })()}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="font-medium text-gray-600">
                        Total Hari
                      </div>
                      <div className="text-xl font-bold text-blue-600">
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
                      <div className="text-xl font-bold text-green-600">
                        {chartsData.activeDaysInfo.activeDays}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="font-medium text-gray-600">
                        Total Aktivitas
                      </div>
                      <div className="text-xl font-bold text-indigo-600">
                        {chartsData.activeDaysInfo.totalPages} hlm
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded">
                    <h4 className="font-medium text-blue-800 mb-2">
                      📊 Rumus Perhitungan:
                    </h4>
                    <div className="text-sm text-blue-700 space-y-1">
                      <div>
                        <strong>Hari Aktif</strong> = Total Hari - Weekend -
                        Hari Libur
                      </div>
                      <div>
                        <strong>Hari Aktif</strong> ={' '}
                        {Math.round(chartsData.activeDaysInfo.period)} -{' '}
                        {chartsData.activeDaysInfo.weekends} -{' '}
                        {chartsData.activeDaysInfo.holidays} ={' '}
                        <strong>
                          {chartsData.activeDaysInfo.activeDays} hari
                        </strong>
                      </div>
                      <div>
                        <strong>Total Aktivitas</strong> ={' '}
                        {chartsData.activeDaysInfo.totalPages} halaman selesai
                      </div>
                      <div>
                        <strong>Rata-rata</strong> ={' '}
                        {chartsData.activeDaysInfo.totalPages} ÷{' '}
                        {chartsData.activeDaysInfo.activeDays} ={' '}
                        <strong>
                          {chartsData.avgPagesPerDay} halaman/hari
                        </strong>
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
