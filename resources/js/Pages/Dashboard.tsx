// resources/js/Pages/Dashboard.tsx

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useEffect, useState, useRef, useMemo } from 'react';
import axios from 'axios';
import BarChart from '@/Components/Charts/BarChart';
import PieChart from '@/Components/Charts/PieChart';
import { getElementAtEvent, Chart } from 'react-chartjs-2';
import {
  UserGroupIcon,
  AcademicCapIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';
import KpiCard from '@/Components/KpiCard';

export default function Dashboard({ auth }: PageProps) {
  // State untuk data utama (KPI & Performa Grup)
  const [loading, setLoading] = useState(true);
  const [chartsData, setChartsData] = useState<any>(null);
  const chartRef = useRef<any>(null);
  const [range, setRange] = useState<'last7' | 'last30' | 'month' | 'year'>(
    'last30'
  );
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());

  // State untuk grafik distribusi jilid
  const [jilidDistribution, setJilidDistribution] = useState<any>(null);
  const [loadingJilid, setLoadingJilid] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState(''); // '' berarti semua level
  const [jilidChartType, setJilidChartType] = useState<'bar' | 'pie'>('bar');

  // Mengambil data awal untuk KPI dan grafik performa grup
  useEffect(() => {
    if (auth.user.role === 'koordinator') {
      setLoading(true);
      const params: any = { range };
      if (range === 'month') {
        params.month = month;
        params.year = year;
      } else if (range === 'year') {
        params.year = year;
      }
      axios
        .get(route('api.charts.coordinator-dashboard'), { params })
        .then((res) => setChartsData(res.data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [range, month, year]);

  // Mengambil data untuk grafik distribusi jilid setiap kali filter level berubah
  useEffect(() => {
    if (auth.user.role === 'koordinator') {
      setLoadingJilid(true);
      axios
        .get(
          route('api.charts.student-distribution', {
            level: selectedLevel,
          })
        )
        .then((res) => {
          setJilidDistribution(res.data);
        })
        .catch((err) => console.error(err))
        .finally(() => setLoadingJilid(false));
    }
  }, [selectedLevel]);

  // Memproses data untuk grafik performa grup
  const progressPerGroupData = useMemo(() => {
    if (!chartsData?.progressPerGroup) return null;
    return {
      labels: chartsData.progressPerGroup.map((d: any) => d.group_name),
      datasets: [
        {
          label: 'Rata-rata Halaman/Hari',
          data: chartsData.progressPerGroup.map(
            (d: any) => d.avg_pages_per_day
          ),
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
        // Comment dulu hafalan
        // {
        //   label: 'Rata-rata Hafalan/Hari',
        //   data: chartsData.progressPerGroup.map(
        //     (d: any) => d.avg_hafalan_per_day
        //   ),
        //   backgroundColor: 'rgba(255, 99, 132, 0.7)',
        //   borderColor: 'rgba(255, 99, 132, 1)',
        //   borderWidth: 1,
        // },
      ],
    };
  }, [chartsData]);

  // Memproses data untuk daftar peringkat grup teratas
  const topGroups = useMemo(() => {
    if (!chartsData?.progressPerGroup) return [];
    return [...chartsData.progressPerGroup]
      .sort((a, b) => b.avg_pages_per_day - a.avg_pages_per_day)
      .slice(0, 5);
  }, [chartsData]);

  // Memproses data untuk grafik distribusi jilid
  const jilidDistributionChartData = useMemo(() => {
    if (!jilidDistribution) return null;

    const mapJilidLabel = (jilid: number) => {
      if (jilid === 7) return 'Gharib';
      if (jilid === 8) return 'Tajwid';
      return `Jilid ${jilid}`;
    };

    return {
      labels: jilidDistribution.map((d: any) => mapJilidLabel(d.jilid)),
      datasets: [
        {
          label: 'Jumlah Siswa',
          data: jilidDistribution.map((d: any) => d.student_count),
          backgroundColor: 'rgba(153, 102, 255, 0.7)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1,
        },
      ],
    };
  }, [jilidDistribution]);

  const jilidDistributionPieData = useMemo(() => {
    if (!jilidDistributionChartData) return null;
    const baseColors = [
      '#6366F1', // indigo-500
      '#10B981', // emerald-500
      '#F59E0B', // amber-500
      '#EF4444', // red-500
      '#3B82F6', // blue-500
      '#8B5CF6', // violet-500
      '#EC4899', // pink-500
      '#14B8A6', // teal-500
    ];
    const labels = jilidDistributionChartData.labels;
    const data = jilidDistributionChartData.datasets[0].data;
    const colors = labels.map(
      (_: string, i: number) => baseColors[i % baseColors.length]
    );
    return {
      labels,
      datasets: [
        {
          label: 'Jumlah Siswa',
          data,
          backgroundColor: colors.map((c: string) => c + 'CC'),
          borderColor: colors,
          borderWidth: 1,
        },
      ],
    };
  }, [jilidDistributionChartData]);

  // Ringkasan persentase untuk tampilan rapi di bawah chart
  const jilidDistributionSummary = useMemo(() => {
    if (!jilidDistributionChartData) return [];
    const counts: number[] = jilidDistributionChartData.datasets[0].data;
    const labels: string[] = jilidDistributionChartData.labels;
    const total = counts.reduce((a, b) => a + b, 0) || 1;
    return labels.map((label, i) => ({
      label,
      count: counts[i],
      pct: ((counts[i] / total) * 100).toFixed(1),
    }));
  }, [jilidDistributionChartData]);

  // Fungsi untuk menangani klik pada grafik performa grup
  const handleChartClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!chartRef.current) return;
    const element = getElementAtEvent(chartRef.current, event);

    if (element.length > 0) {
      const dataIndex = element[0].index;
      const groupId = chartsData?.progressPerGroup[dataIndex]?.group_id;
      if (groupId) {
        router.get(route('admin.dashboard.group-detail', { group: groupId }));
      }
    }
  };

  return (
    <AuthenticatedLayout
      header={
        <h2 className="text-xl font-semibold leading-tight text-gray-800">
          Dashboard Koordinator
        </h2>
      }
    >
      <Head title="Dashboard Koordinator" />
      <div className="py-12">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          {loading && (
            <div className="p-6 bg-white rounded-lg shadow-sm text-center">
              Memuat data dasbor...
            </div>
          )}

          {!loading && !chartsData && (
            <div className="p-6 bg-white rounded-lg shadow-sm text-center">
              Tidak ada data untuk ditampilkan.
            </div>
          )}

          {!loading && chartsData && (
            <div className="flex flex-col gap-6">
              {/* Header Sambutan */}
              <div className="p-6 bg-white rounded-lg shadow-sm flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">
                    Selamat Datang, {auth.user.name}!
                  </h3>
                  <p className="text-gray-500 mt-1">
                    Berikut adalah ringkasan aktivitas BTQ di sekolah Anda.
                  </p>
                </div>
                <div className="flex flex-wrap items-end gap-3 text-sm">
                  <div>
                    <label
                      htmlFor="rangeSelect"
                      className="block text-gray-600 mb-1"
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
                          htmlFor="monthSelect"
                          className="block text-gray-600 mb-1"
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
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(
                            (m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                      <div>
                        <label
                          htmlFor="yearInputMonth"
                          className="block text-gray-600 mb-1"
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
                        htmlFor="yearInput"
                        className="block text-gray-600 mb-1"
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

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard
                  title="Total Kelompok Aktif"
                  value={chartsData.statistics.total_groups}
                  icon={<UserGroupIcon className="w-8 h-8 text-blue-500" />}
                />
                <KpiCard
                  title="Total Siswa Terdaftar"
                  value={chartsData.statistics.total_students}
                  icon={<AcademicCapIcon className="w-8 h-8 text-green-500" />}
                />
                <KpiCard
                  title="Total Guru Mengajar"
                  value={chartsData.statistics.active_teachers}
                  icon={<BriefcaseIcon className="w-8 h-8 text-indigo-500" />}
                />
              </div>

              {/* Grid untuk Konten Utama */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Kolom Utama untuk Grafik Performa Grup */}
                <div className="lg:col-span-2 bg-white shadow-sm sm:rounded-lg p-6">
                  {progressPerGroupData && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Rata-rata Progres Harian per Kelompok
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Klik pada bar untuk melihat detail kelompok.
                      </p>
                      <div className="h-96">
                        <BarChart
                          ref={chartRef}
                          onClick={handleChartClick}
                          chartData={progressPerGroupData}
                          title=""
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Kolom Samping untuk Peringkat */}
                <div className="bg-white shadow-sm sm:rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Kelompok Teratas
                  </h3>
                  <ul className="space-y-4">
                    {topGroups.map((group, index) => (
                      <li key={group.group_id} className="flex items-center">
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-full ${
                            index === 0
                              ? 'bg-yellow-400'
                              : index === 1
                                ? 'bg-gray-300'
                                : index === 2
                                  ? 'bg-yellow-600'
                                  : 'bg-gray-200'
                          } text-white font-bold`}
                        >
                          {index + 1}
                        </div>
                        <div className="ml-4">
                          <p className="font-semibold text-gray-800">
                            {group.group_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {group.avg_pages_per_day} Halaman/Hari
                          </p>
                          <p className="text-xs text-gray-400">
                            Total: {group.total_pages} halaman
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Bagian untuk Grafik Distribusi Jilid (dirapikan) */}
              <div className="bg-white shadow-sm sm:rounded-lg p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-5">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Distribusi Siswa per Jilid
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="text-xs font-medium text-gray-500">
                      Level:
                    </label>
                    <select
                      value={selectedLevel}
                      onChange={(e) => setSelectedLevel(e.target.value)}
                      className="h-9 pl-3 pr-8 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm text-sm leading-tight bg-white"
                      title="Filter berdasarkan level kelas"
                    >
                      <option value="">Semua</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                    </select>
                    <div
                      className="flex bg-gray-100 rounded-md p-1 text-xs font-medium h-9"
                      title="Ganti tipe chart"
                    >
                      <button
                        onClick={() => setJilidChartType('bar')}
                        className={`px-4 inline-flex items-center justify-center rounded-sm h-full transition ${jilidChartType === 'bar' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-white'}`}
                      >
                        Bar
                      </button>
                      <button
                        onClick={() => setJilidChartType('pie')}
                        className={`px-4 inline-flex items-center justify-center rounded-sm h-full transition ${jilidChartType === 'pie' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-white'}`}
                      >
                        Pie
                      </button>
                    </div>
                  </div>
                </div>

                {loadingJilid && (
                  <div className="text-center py-14">Memuat data grafik...</div>
                )}

                {!loadingJilid && jilidDistributionChartData && (
                  <div className="flex flex-col lg:flex-row gap-8">
                    <div className="flex-1 flex items-center justify-center min-h-[320px]">
                      {jilidChartType === 'bar' && (
                        <div className="w-full h-80">
                          <BarChart
                            chartData={jilidDistributionChartData}
                            title=""
                          />
                        </div>
                      )}
                      {jilidChartType === 'pie' && jilidDistributionPieData && (
                        <div className="w-full max-w-sm h-80">
                          <PieChart
                            chartData={jilidDistributionPieData}
                            title=""
                          />
                        </div>
                      )}
                    </div>
                    <div className="lg:w-64 space-y-3">
                      <div className="text-sm font-semibold text-gray-700">
                        Ringkasan
                      </div>
                      <ul className="space-y-1 text-xs">
                        {jilidDistributionSummary.map((row) => (
                          <li
                            key={row.label}
                            className="flex justify-between border-b last:border-b-0 py-1"
                          >
                            <span className="text-gray-600 truncate pr-2">
                              {row.label}
                            </span>
                            <span className="text-gray-900 font-medium">
                              {row.count}{' '}
                              <span className="text-gray-400">
                                ({row.pct}%)
                              </span>
                            </span>
                          </li>
                        ))}
                      </ul>
                      <div className="pt-2 text-[11px] text-gray-400">
                        Total siswa:{' '}
                        {jilidDistributionSummary.reduce(
                          (a, b) => a + b.count,
                          0
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {!loadingJilid &&
                  (!jilidDistribution || jilidDistribution.length === 0) && (
                    <div className="text-center py-14">
                      <p className="text-gray-500">
                        Tidak ada data siswa untuk level yang dipilih.
                      </p>
                    </div>
                  )}
              </div>

              {/* Informasi Hari Aktif */}
              {chartsData?.activeDaysInfo && (
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
