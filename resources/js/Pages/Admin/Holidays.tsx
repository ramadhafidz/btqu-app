import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Calendar, { CalendarProps } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../../../css/calendar.css';
import {
  CalendarIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  SparklesIcon,
  ChartBarIcon,
  CheckIcon,
  XMarkIcon,
  ChevronDownIcon,
  ViewColumnsIcon,
  CalendarDaysIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import {
  CalendarIcon as CalendarSolidIcon,
  SparklesIcon as SparklesSolidIcon,
} from '@heroicons/react/24/solid';

interface Holiday {
  id: number;
  tanggal: string;
  keterangan: string;
  formatted_date: string;
  created_at: string;
  updated_at: string;
}

interface HolidaysProps {
  holidays: {
    data: Holiday[];
    links: any[];
    prev_page_url: string | null;
    next_page_url: string | null;
  };
  allHolidays: Holiday[];
  filters: {
    search?: string;
    year?: number;
  };
  currentYear: number;
  statistics: {
    total: number;
    upcoming: number;
  };
}

export default function Holidays({
  holidays,
  allHolidays,
  filters,
  currentYear,
  statistics,
}: HolidaysProps) {
  // Debug log to see holidays data
  console.log('Holidays data received:', holidays);
  console.log('All holidays for calendar:', allHolidays);
  console.log('Total holidays count:', holidays.data.length);
  console.log(
    'All holidays count:',
    allHolidays ? allHolidays.length : 'undefined'
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [formData, setFormData] = useState({
    tanggal: '',
    keterangan: '',
  });
  const [searchQuery, setSearchQuery] = useState(filters.search || '');
  const [selectedYear, setSelectedYear] = useState(filters.year || currentYear);
  const [statusFilter, setStatusFilter] = useState<'all' | 'past' | 'upcoming'>(
    (filters as any)?.status || 'all'
  );
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingHoliday) {
      router.put(`/admin/holidays/${editingHoliday.id}`, formData, {
        onSuccess: () => {
          setIsModalOpen(false);
          setEditingHoliday(null);
          setFormData({ tanggal: '', keterangan: '' });
        },
      });
    } else {
      router.post('/admin/holidays', formData, {
        onSuccess: () => {
          setIsModalOpen(false);
          setFormData({ tanggal: '', keterangan: '' });
        },
      });
    }
  };

  const handleEdit = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setFormData({
      tanggal: holiday.tanggal,
      keterangan: holiday.keterangan,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (holiday: Holiday) => {
    if (
      confirm(
        `Apakah Anda yakin ingin menghapus hari libur "${holiday.keterangan}"?`
      )
    ) {
      router.delete(`/admin/holidays/${holiday.id}`);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get(
      '/admin/holidays',
      { search: searchQuery, year: selectedYear, status: statusFilter },
      {
        preserveState: true,
        replace: true,
      }
    );
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    router.get('/admin/holidays', {
      search: searchQuery,
      year,
      status: statusFilter,
    });
  };

  const handleImportNationalHolidays = () => {
    if (
      confirm(
        `Apakah Anda yakin ingin mengimpor hari libur nasional untuk tahun ${selectedYear}?`
      )
    ) {
      setIsImporting(true);
      router.post(
        '/admin/holidays/import-national',
        { year: selectedYear },
        {
          onFinish: () => setIsImporting(false),
        }
      );
    }
  };

  const openAddModal = () => {
    setEditingHoliday(null);
    setFormData({ tanggal: '', keterangan: '' });
    setIsModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDateColor = (dateString: string) => {
    const today = new Date();
    const holiday = new Date(dateString);

    if (holiday < today) {
      return 'text-gray-500 bg-gray-50'; // Past
    } else if (holiday.toDateString() === today.toDateString()) {
      return 'text-green-700 bg-green-50 border-green-200'; // Today
    } else {
      return 'text-blue-700 bg-blue-50 border-blue-200'; // Future
    }
  };

  const years = Array.from({ length: 10 }, (_, i) => currentYear - 2 + i);

  // Server already filtered, just use holidays.data
  const filteredHolidays = holidays.data;

  // Get status badge styles
  const getStatusBadge = (status: 'all' | 'past' | 'upcoming') => {
    switch (status) {
      case 'all':
        return {
          icon: CalendarIcon,
          text: 'Semua Status',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-300',
        };
      case 'upcoming':
        return {
          icon: SparklesIcon,
          text: 'Mendatang',
          bgColor: 'bg-green-50',
          textColor: 'text-green-700',
          borderColor: 'border-green-200',
        };
      case 'past':
        return {
          icon: ClockIcon,
          text: 'Sudah Lewat',
          bgColor: 'bg-red-50',
          textColor: 'text-red-700',
          borderColor: 'border-red-200',
        };
      default:
        return {
          icon: CalendarIcon,
          text: 'Semua Status',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-300',
        };
    }
  };

  const currentStatusBadge = getStatusBadge(statusFilter);

  // Calendar helper functions
  const getHolidaysForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    // Use allHolidays if available, otherwise fallback to holidays.data
    const holidaysList = allHolidays || holidays.data || [];
    const holidaysForDate = holidaysList.filter(
      (holiday) => holiday.tanggal === dateString
    );

    // Debug log
    console.log(
      'Checking date:',
      dateString,
      'Found holidays:',
      holidaysForDate.length
    );
    if (holidaysList.length === 0) {
      console.log('No holidays data available');
    }

    return holidaysForDate;
  };

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const holidaysOnDate = getHolidaysForDate(date);

      // Debug log
      if (holidaysOnDate.length > 0) {
        console.log(
          'Holiday found for date:',
          date.toISOString().split('T')[0],
          holidaysOnDate
        );
      }

      if (holidaysOnDate.length > 0) {
        return (
          <div className="w-full h-full flex flex-col items-center justify-center p-1 text-white">
            <div className="text-lg font-bold mb-1">{date.getDate()}</div>
            <div className="text-xs font-medium text-center leading-tight">
              {holidaysOnDate[0].keterangan.length > 12
                ? holidaysOnDate[0].keterangan.substring(0, 12) + '...'
                : holidaysOnDate[0].keterangan}
            </div>
            {holidaysOnDate.length > 1 && (
              <div className="text-xs font-bold mt-1">
                +{holidaysOnDate.length - 1}
              </div>
            )}
          </div>
        );
      }
    }
    return null;
  };

  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const holidaysOnDate = getHolidaysForDate(date);

      // Debug log
      if (holidaysOnDate.length > 0) {
        console.log(
          'Adding holiday-tile-red class for date:',
          date.toISOString().split('T')[0]
        );
      }

      if (holidaysOnDate.length > 0) {
        return 'holiday-tile-red';
      }
    }
    return '';
  };

  const onCalendarDateClick = (value: any, event: any) => {
    if (!value || Array.isArray(value)) return;

    const date = value instanceof Date ? value : new Date(value);
    const holidaysOnDate = getHolidaysForDate(date);

    if (holidaysOnDate.length > 0) {
      // Show holiday details or edit modal
      if (holidaysOnDate.length === 1) {
        handleEdit(holidaysOnDate[0]);
      } else {
        // Multiple holidays on same date - could show a selection modal
        alert(
          `Ada ${holidaysOnDate.length} hari libur pada tanggal ini:\n${holidaysOnDate.map((h) => h.keterangan).join('\n')}`
        );
      }
    } else {
      // No holiday - open add modal with date pre-filled
      const dateString = date.toISOString().split('T')[0];
      setFormData({ tanggal: dateString, keterangan: '' });
      setEditingHoliday(null);
      setIsModalOpen(true);
    }
  };

  return (
    <AuthenticatedLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold leading-tight text-gray-800 flex items-center">
              <CalendarIcon className="h-8 w-8 mr-3 text-blue-600" />
              Kelola Hari Libur
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Mengelola jadwal hari libur untuk perhitungan hari aktif
              pembelajaran
            </p>
          </div>
          <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500">
            <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full flex items-center">
              <ChartBarIcon className="h-4 w-4 mr-1" />
              {filteredHolidays.length} dari {statistics.total} Hari Libur
            </span>
            <span className="px-3 py-1.5 bg-green-50 text-green-700 rounded-full flex items-center">
              <CalendarSolidIcon className="h-4 w-4 mr-1" />
              Tahun {selectedYear}
            </span>
            {statusFilter !== 'all' && (
              <span className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full flex items-center">
                <FunnelIcon className="h-4 w-4 mr-1" />
                {statusFilter === 'past' ? 'Sudah Lewat' : 'Mendatang'}
              </span>
            )}
          </div>
        </div>
      }
    >
      <Head title="Kelola Hari Libur" />

      <div className="py-6">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          {/* Action Cards */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Total Hari Libur</p>
                  <p className="text-3xl font-bold">{statistics.total}</p>
                </div>
                <CalendarIcon className="h-12 w-12 text-blue-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Tahun Aktif</p>
                  <p className="text-3xl font-bold">{selectedYear}</p>
                </div>
                <CalendarSolidIcon className="h-12 w-12 text-green-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">Sumber Data API</p>
                  <p className="text-sm font-medium">dayoffapi.vercel.app</p>
                </div>
                <ArrowDownTrayIcon className="h-12 w-12 text-orange-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Status Import</p>
                  <p className="text-sm font-medium">Otomatis + Manual</p>
                </div>
                <SparklesSolidIcon className="h-12 w-12 text-purple-200" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <CalendarIcon className="h-5 w-5 mr-2 text-gray-600" />
                    Daftar Hari Libur
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Kelola dan pantau jadwal hari libur untuk sistem
                    pembelajaran
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 ${
                        viewMode === 'grid'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <ViewColumnsIcon className="h-4 w-4 mr-1" />
                      Grid
                    </button>
                    <button
                      onClick={() => setViewMode('calendar')}
                      className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 ${
                        viewMode === 'calendar'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <CalendarDaysIcon className="h-4 w-4 mr-1" />
                      Calendar
                    </button>
                  </div>
                  <div className="relative group">
                    <button
                      onClick={handleImportNationalHolidays}
                      disabled={isImporting}
                      className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors duration-200 shadow-sm"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                      {isImporting ? 'Mengimpor...' : 'Impor Libur Nasional'}
                    </button>

                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      Data dari dayoffapi.vercel.app
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                  <button
                    onClick={openAddModal}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 shadow-sm"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Tambah Hari Libur
                  </button>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="p-6 bg-gray-50 border-b border-gray-200">
              <form
                onSubmit={handleSearch}
                className="flex flex-col gap-4 sm:flex-row"
              >
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Cari berdasarkan keterangan atau tanggal..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors duration-200"
                  />
                </div>
                <div className="flex gap-3">
                  {/* Status custom dropdown (badge style) */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                      className={`inline-flex items-center px-3 py-2.5 border rounded-lg text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${currentStatusBadge.bgColor} ${currentStatusBadge.textColor} ${currentStatusBadge.borderColor} hover:opacity-80`}
                      aria-label="Filter berdasarkan status"
                    >
                      <currentStatusBadge.icon className="h-4 w-4 mr-2" />
                      {currentStatusBadge.text}
                      <ChevronDownIcon className="h-4 w-4 ml-2" />
                    </button>
                    {showStatusDropdown && (
                      <div className="absolute z-20 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg">
                        <div className="p-1">
                          {(['all', 'upcoming', 'past'] as const).map(
                            (status) => {
                              const badge = getStatusBadge(status);
                              const IconComponent = badge.icon;
                              return (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={() => {
                                    setStatusFilter(status);
                                    setShowStatusDropdown(false);
                                    // Request with new status, reset to first page
                                    router.get('/admin/holidays', {
                                      search: searchQuery,
                                      year: selectedYear,
                                      status,
                                    });
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors duration-150 flex items-center ${
                                    statusFilter === status
                                      ? 'bg-blue-50 text-blue-700'
                                      : 'text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  <IconComponent className="h-4 w-4 mr-2" />
                                  {badge.text}
                                  {statusFilter === status && (
                                    <CheckIcon className="h-4 w-4 ml-auto text-blue-600" />
                                  )}
                                </button>
                              );
                            }
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <label htmlFor="year-filter" className="sr-only">
                      Pilih tahun
                    </label>
                    <select
                      id="year-filter"
                      value={selectedYear}
                      onChange={(e) => handleYearChange(Number(e.target.value))}
                      className="min-w-[100px] pl-3 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white transition-colors duration-200 appearance-none cursor-pointer"
                      aria-label="Pilih tahun"
                    >
                      {years.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
                    aria-label="Filter data"
                  >
                    <FunnelIcon className="h-4 w-4 mr-2" />
                    Filter
                  </button>
                </div>
              </form>
            </div>

            {/* Holidays List */}
            <div className="p-6">
              {viewMode === 'calendar' ? (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <CalendarDaysIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                      <div>
                        <h4 className="text-sm font-medium text-blue-900">
                          Cara Menggunakan Calendar
                        </h4>
                        <p className="text-sm text-blue-700 mt-1">
                          • Klik pada tanggal merah untuk mengedit hari libur
                          <br />
                          • Klik pada tanggal kosong untuk menambah hari libur
                          baru
                          <br />• Tanggal merah menunjukkan hari libur dengan
                          nama yang tertera
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="calendar-container bg-white rounded-lg border p-6">
                    <Calendar
                      onChange={onCalendarDateClick}
                      value={new Date()}
                      view="month"
                      defaultView="month"
                      minDate={new Date(selectedYear, 0, 1)}
                      maxDate={new Date(selectedYear, 11, 31)}
                      tileContent={tileContent}
                      tileClassName={tileClassName}
                      locale="id-ID"
                      className="mx-auto w-full"
                    />
                  </div>
                </div>
              ) : filteredHolidays.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {statusFilter === 'all'
                      ? 'Tidak ada hari libur'
                      : statusFilter === 'past'
                        ? 'Tidak ada hari libur yang sudah lewat'
                        : 'Tidak ada hari libur mendatang'}
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {statusFilter === 'all'
                      ? `Mulai dengan menambahkan hari libur baru atau mengimpor hari libur nasional untuk tahun ${selectedYear}.`
                      : `Coba ubah filter atau pilih tahun yang berbeda.`}
                  </p>
                  {statusFilter === 'all' && (
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={openAddModal}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors duration-200"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Tambah Manual
                      </button>
                      <button
                        onClick={handleImportNationalHolidays}
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors duration-200"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                        Impor Nasional
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Filter Summary */}
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium">
                        Menampilkan {filteredHolidays.length} hari libur
                      </span>
                      {statusFilter !== 'all' && (
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {statusFilter === 'past'
                            ? 'Sudah Lewat'
                            : 'Mendatang'}
                        </span>
                      )}
                    </div>
                    {statusFilter !== 'all' && (
                      <button
                        onClick={() => setStatusFilter('all')}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Reset Filter
                      </button>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredHolidays.map((holiday) => (
                      <div
                        key={holiday.id}
                        className={`
                        border-2 rounded-xl p-4 transition-all duration-200 hover:shadow-md
                        ${getDateColor(holiday.tanggal)}
                      `}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm mb-1 line-clamp-2">
                              {holiday.keterangan}
                            </h4>
                            <p className="text-xs opacity-75">
                              {formatDate(holiday.tanggal)}
                            </p>
                            <p className="text-xs opacity-60 font-mono mt-1">
                              {holiday.tanggal}
                            </p>
                          </div>
                          <div className="flex gap-1 ml-2">
                            <button
                              onClick={() => handleEdit(holiday)}
                              className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                              aria-label="Edit hari libur"
                              title="Edit hari libur"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(holiday)}
                              className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200"
                              aria-label="Hapus hari libur"
                              title="Hapus hari libur"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Status indicator */}
                        <div className="flex items-center text-xs">
                          {new Date(holiday.tanggal) < new Date() ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-200 text-gray-700">
                              <ClockIcon className="h-3 w-3 mr-1" />
                              Sudah lewat
                            </span>
                          ) : new Date(holiday.tanggal).toDateString() ===
                            new Date().toDateString() ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-200 text-green-800">
                              <SparklesSolidIcon className="h-3 w-3 mr-1" />
                              Hari ini
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-200 text-blue-800">
                              <CalendarSolidIcon className="h-3 w-3 mr-1" />
                              Mendatang
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Pagination */}
            {holidays.links && holidays.links.length > 3 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1 flex justify-between sm:hidden">
                    {holidays.prev_page_url && (
                      <a
                        href={holidays.prev_page_url}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        ← Sebelumnya
                      </a>
                    )}
                    {holidays.next_page_url && (
                      <a
                        href={holidays.next_page_url}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Selanjutnya →
                      </a>
                    )}
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-center">
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      {holidays.links.map((link, index) => (
                        <a
                          key={index}
                          href={link.url || '#'}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors duration-200 ${
                            link.active
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          } ${index === 0 ? 'rounded-l-md' : ''} ${
                            index === holidays.links.length - 1
                              ? 'rounded-r-md'
                              : ''
                          }`}
                          dangerouslySetInnerHTML={{ __html: link.label }}
                          aria-label={`Halaman ${link.label}`}
                          title={`Halaman ${link.label}`}
                        />
                      ))}
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />

            <span className="hidden sm:inline-block sm:h-screen sm:align-middle">
              &#8203;
            </span>

            <div className="relative inline-block transform overflow-hidden rounded-xl bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-6 pt-6 pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <div className="flex items-center mb-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <CalendarIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-lg font-semibold leading-6 text-gray-900">
                            {editingHoliday
                              ? 'Edit Hari Libur'
                              : 'Tambah Hari Libur'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {editingHoliday
                              ? 'Perbarui informasi hari libur'
                              : 'Tambahkan hari libur baru ke sistem'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label
                            htmlFor="tanggal"
                            className="flex items-center text-sm font-medium text-gray-700 mb-1"
                          >
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            Tanggal
                          </label>
                          <input
                            type="date"
                            id="tanggal"
                            required
                            value={formData.tanggal}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                tanggal: e.target.value,
                              }))
                            }
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="keterangan"
                            className="flex items-center text-sm font-medium text-gray-700 mb-1"
                          >
                            <PencilIcon className="h-4 w-4 mr-1" />
                            Keterangan
                          </label>
                          <input
                            type="text"
                            id="keterangan"
                            required
                            placeholder="Contoh: Hari Kemerdekaan RI"
                            value={formData.keterangan}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                keterangan: e.target.value,
                              }))
                            }
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse sm:gap-3">
                  <button
                    type="submit"
                    className="inline-flex w-full justify-center items-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto transition-colors duration-200"
                  >
                    <CheckIcon className="h-4 w-4 mr-2" />
                    {editingHoliday ? 'Perbarui' : 'Simpan'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="mt-3 inline-flex w-full justify-center items-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto transition-colors duration-200"
                  >
                    <XMarkIcon className="h-4 w-4 mr-2" />
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}
