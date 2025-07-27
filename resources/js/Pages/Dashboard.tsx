// resources/js/Pages/Dashboard.tsx

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useEffect, useState, useRef, useMemo } from 'react';
import axios from 'axios';
import BarChart from '@/Components/Charts/BarChart';
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
  const chartRef = useRef<Chart<'bar'>>(null);

  // State untuk grafik distribusi jilid
  const [jilidDistribution, setJilidDistribution] = useState<any>(null);
  const [loadingJilid, setLoadingJilid] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState(''); // '' berarti semua level

  // Mengambil data awal untuk KPI dan grafik performa grup
  useEffect(() => {
    if (auth.user.role === 'koordinator') {
      axios
        .get(route('api.charts.coordinator-dashboard'))
        .then((res) => setChartsData(res.data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

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
        {
          label: 'Rata-rata Hafalan/Hari',
          data: chartsData.progressPerGroup.map(
            (d: any) => d.avg_hafalan_per_day
          ),
          backgroundColor: 'rgba(255, 99, 132, 0.7)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
        },
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
    return {
      labels: jilidDistribution.map((d: any) => `Jilid ${d.jilid}`),
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
              <div className="p-6 bg-white rounded-lg shadow-sm">
                <h3 className="text-2xl font-bold text-gray-800">
                  Selamat Datang, {auth.user.name}!
                </h3>
                <p className="text-gray-500 mt-1">
                  Berikut adalah ringkasan aktivitas BTQ di sekolah Anda.
                </p>
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
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Bagian untuk Grafik Distribusi Jilid */}
              <div className="bg-white shadow-sm sm:rounded-lg p-6">
                <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Distribusi Siswa per Jilid
                    </h3>
                    <p className="text-sm text-gray-500">
                      Lihat sebaran siswa di setiap jilid berdasarkan level
                      kelas.
                    </p>
                  </div>
                  <div>
                    <select
                      value={selectedLevel}
                      onChange={(e) => setSelectedLevel(e.target.value)}
                      className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                    >
                      <option value="">Semua Level</option>
                      <option value="1">Level 1</option>
                      <option value="2">Level 2</option>
                      <option value="3">Level 3</option>
                    </select>
                  </div>
                </div>

                {loadingJilid && (
                  <div className="text-center py-16">Memuat data grafik...</div>
                )}

                {!loadingJilid && jilidDistributionChartData && (
                  <div className="h-96">
                    <BarChart chartData={jilidDistributionChartData} title="" />
                  </div>
                )}

                {!loadingJilid &&
                  (!jilidDistribution || jilidDistribution.length === 0) && (
                    <div className="text-center py-16">
                      <p className="text-gray-500">
                        Tidak ada data siswa untuk level yang dipilih.
                      </p>
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
