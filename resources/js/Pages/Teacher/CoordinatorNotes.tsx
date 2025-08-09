import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import DOMPurify from 'dompurify';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

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
  const badgeClass = (decision: string) =>
    decision === 'approved'
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';

  return (
    <AuthenticatedLayout
      header={
        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
          Catatan Koordinator
        </h2>
      }
    >
      <Head title="Catatan Koordinator" />
      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Daftar Catatan
                  </h3>
                  <p className="text-sm text-gray-500">
                    Catatan hasil persetujuan/penolakan kenaikan jilid untuk
                    siswa Anda.
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  {btqGroup ? (
                    <span>Kelompok BTQ Level {btqGroup.level}</span>
                  ) : (
                    <span>Tidak ada kelompok BTQ</span>
                  )}
                </div>
              </div>

              {!logs || logs.length === 0 ? (
                <div className="text-center text-gray-500 py-16">
                  <p>Tidak ada catatan untuk ditampilkan.</p>
                  <p className="text-xs mt-2">
                    Catatan akan muncul setelah koordinator meninjau pengajuan
                    kenaikan.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {logs.map((log) => (
                    <li key={log.id} className="py-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-gray-900">
                              {log.student?.nama_lengkap ?? '—'}
                            </span>
                            {typeof log.jilid === 'number' && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                                Jilid {log.jilid}
                              </span>
                            )}
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${badgeClass(log.decision)}`}
                            >
                              {log.decision === 'approved'
                                ? 'Disetujui'
                                : 'Ditolak'}
                            </span>
                          </div>
                          <div className="mt-2 prose prose-sm prose-ul:list-disc prose-ol:list-decimal max-w-none">
                            <div
                              className="text-gray-800"
                              dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(log.note ?? ''),
                              }}
                            />
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
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-6">
                <Link
                  href={route('teacher.my-group.index')}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  ← Kembali ke Grup Saya
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
