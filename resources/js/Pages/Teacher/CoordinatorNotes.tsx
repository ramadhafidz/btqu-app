import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useMemo, useState } from 'react';
import DOMPurify from 'dompurify';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/solid';

type LogItem = {
  id: number;
  student: { id: number; nama_lengkap: string } | null;
  jilid: number | null;
  decision: 'approved' | 'rejected' | string;
  reviewed_at: string | null;
  reviewer: { id: number; name: string } | null;
  note: string | null;
};

export default function CoordinatorNotes({
  auth,
  logs,
  btqGroup,
}: PageProps & {
  logs: LogItem[];
  btqGroup: { id: number; level: number } | null;
}) {
  const [decisionFilter, setDecisionFilter] = useState<
    'all' | 'approved' | 'rejected'
  >('all');
  const [q, setQ] = useState('');
  const [dateFilter, setDateFilter] = useState(''); // yyyy-MM-dd

  const badgeClass = (decision: string) =>
    decision === 'approved'
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';

  const decisionLabel = (decision: string) =>
    decision === 'approved' ? 'Disetujui' : 'Ditolak';

  const filteredLogs = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (logs ?? []).filter((l) => {
      const byDecision =
        decisionFilter === 'all' ? true : l.decision === decisionFilter;
      const bySearch = term
        ? (l.student?.nama_lengkap ?? '').toLowerCase().includes(term) ||
          (l.reviewer?.name ?? '').toLowerCase().includes(term) ||
          (l.note ?? '').toLowerCase().includes(term)
        : true;
      const byDate = dateFilter
        ? l.reviewed_at
          ? format(new Date(l.reviewed_at), 'yyyy-MM-dd') === dateFilter
          : false
        : true;
      return byDecision && bySearch && byDate;
    });
  }, [logs, decisionFilter, q, dateFilter]);

  return (
    <AuthenticatedLayout
      header={
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold text-xl text-gray-800 leading-tight">
            Catatan Koordinator
          </h2>
          <Link
            href={route('teacher.my-group.index')}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
          >
            <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
            <span>Kembali</span>
          </Link>
        </div>
      }
    >
      <Head title="Catatan Koordinator" />
      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6 md:p-8">
              <div className="mb-6 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Daftar Catatan
                    </h3>
                    <p className="text-sm text-gray-500">
                      Catatan hasil persetujuan/penolakan kenaikan jilid untuk
                      siswa Anda.
                    </p>
                  </div>
                  <div className="text-xs inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                    <span className="font-medium">Kelompok</span>
                    <span className="inline-flex items-center gap-1">
                      <span className="text-gray-500">Level</span>
                      <span className="font-semibold">
                        {btqGroup ? btqGroup.level : '—'}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-white overflow-hidden">
                    {[
                      { key: 'all', label: 'Semua' },
                      { key: 'approved', label: 'Disetujui' },
                      { key: 'rejected', label: 'Ditolak' },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setDecisionFilter(tab.key as any)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
                          decisionFilter === tab.key
                            ? 'bg-[#005929] text-white'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        type="button"
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <div className="relative flex-1">
                    <MagnifyingGlassIcon className="pointer-events-none h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Cari siswa, peninjau, atau isi catatan..."
                      className="w-full pl-10 pr-3 py-2 text-sm rounded-md border border-gray-300 shadow-sm focus:border-[#005929] focus:ring-[#005929]"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label htmlFor="dateFilter" className="sr-only">
                      Filter tanggal
                    </label>
                    <input
                      id="dateFilter"
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      title="Filter tanggal"
                      className="px-3 py-2 text-sm rounded-md border border-gray-300 shadow-sm focus:border-[#005929] focus:ring-[#005929]"
                    />
                    {dateFilter && (
                      <button
                        type="button"
                        onClick={() => setDateFilter('')}
                        className="text-xs text-gray-600 hover:text-gray-800 underline"
                      >
                        Reset tanggal
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {!filteredLogs || filteredLogs.length === 0 ? (
                <div className="text-center text-gray-500 py-16">
                  <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <XCircleIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="font-medium">
                    Tidak ada catatan untuk ditampilkan.
                  </p>
                  <p className="text-xs mt-2">
                    Coba ubah filter atau kata kunci pencarian.
                  </p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {filteredLogs.map((log) => (
                    <li
                      key={log.id}
                      className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900">
                              {log.student?.nama_lengkap ?? '—'}
                            </span>
                            {typeof log.jilid === 'number' && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                                Jilid {log.jilid}
                              </span>
                            )}
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${badgeClass(log.decision)}`}
                            >
                              {log.decision === 'approved' ? (
                                <CheckCircleIcon className="h-3.5 w-3.5" />
                              ) : (
                                <XCircleIcon className="h-3.5 w-3.5" />
                              )}
                              {decisionLabel(log.decision)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-500 shrink-0">
                          <div>
                            {log.reviewed_at
                              ? format(
                                  new Date(log.reviewed_at),
                                  'd MMM yyyy HH:mm',
                                  { locale: idLocale }
                                )
                              : '—'}
                          </div>
                          <div className="mt-1">
                            Oleh: {log.reviewer?.name ?? '—'}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 w-full">
                        <div className="text-xs font-medium text-gray-500 mb-1">
                          Catatan:
                        </div>
                        <div className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                          <div
                            className="prose prose-sm prose-ul:list-disc prose-ol:list-decimal max-w-none text-gray-800"
                            dangerouslySetInnerHTML={{
                              __html: DOMPurify.sanitize(log.note ?? ''),
                            }}
                          />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-8 text-center text-xs text-gray-400">
                Terakhir diperbarui:{' '}
                {format(new Date(), 'd MMM yyyy HH:mm', { locale: idLocale })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
