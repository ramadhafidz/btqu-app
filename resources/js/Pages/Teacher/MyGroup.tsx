import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import {
  PageProps,
  BtqGroup,
  Student,
  StudentProgress,
  Juz,
  Surah,
} from "@/types";
import { useState, useEffect } from "react";
import axios from "axios";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import { Dialog } from "@headlessui/react";
import { PlusIcon, MinusIcon } from "@heroicons/react/24/solid";

interface StudentWithProgress extends Student {
  progress: StudentProgress;
}
interface BtqGroupWithStudents extends BtqGroup {
  students: StudentWithProgress[];
}

const JILID_LIMITS: { [key: number]: number } = {
  1: 40, 2: 40, 3: 40, 4: 40, 5: 40, 6: 40, 7: 37, 8: 25,
};

const getStatusBadgeClass = (status: string) => {
  switch (status.toLowerCase()) {
    case "lulus": return "bg-green-100 text-green-800";
    case "diajukan": return "bg-blue-100 text-blue-800";
    case "proses": default: return "bg-yellow-100 text-yellow-800";
  }
};

export default function MyGroup({
  auth,
  btqGroup: initialGroup,
}: PageProps & { btqGroup: BtqGroupWithStudents | null }) {
  const [btqGroup, setBtqGroup] = useState(initialGroup);
  const [juzs, setJuzs] = useState<Juz[]>([]);
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [selectedJuz, setSelectedJuz] = useState("");
  const [hafalanSurahIds, setHafalanSurahIds] = useState<{ [key: number]: string }>({});
  const [hafalanAyats, setHafalanAyats] = useState<{ [key: number]: string }>({});
  const [editHafalanStudentId, setEditHafalanStudentId] = useState<number | null>(null);
  const [localPageChanges, setLocalPageChanges] = useState<{ [key: number]: number }>({});

  // [UBAH] Tambah state untuk perubahan hafalan lokal
  const [localHafalanChanges, setLocalHafalanChanges] = useState<{ [key: number]: { surahId: number | null; ayat: string | null } }>({});

  const [savingState, setSavingState] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    setBtqGroup(initialGroup);
    if (initialGroup?.students) {
      const initialPages = initialGroup.students.reduce((acc, student) => {
        if (student.progress) acc[student.id] = student.progress.halaman;
        return acc;
      }, {} as { [key: number]: number });

      // [UBAH] Inisialisasi state hafalan lokal
      const initialHafalan = initialGroup.students.reduce((acc, student) => {
        if (student.progress) {
          acc[student.id] = {
            surahId: student.progress.hafalan_surah_id,
            ayat: student.progress.hafalan_ayat,
          };
        }
        return acc;
      }, {} as { [key: number]: { surahId: number | null, ayat: string | null } });

      setLocalPageChanges(initialPages);
      setLocalHafalanChanges(initialHafalan);
    }
  }, [initialGroup]);

  useEffect(() => {
    axios.get(route("api.juzs")).then((res) => setJuzs(res.data));
    axios.get(route("api.surahs")).then((res) => setSurahs(res.data));
  }, []);

  useEffect(() => {
    axios.get(route("api.surahs", { juz_id: selectedJuz })).then((res) => setSurahs(res.data));
  }, [selectedJuz]);

  const refreshPageData = () => {
    router.reload({
      only: ["btqGroup"],
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handleLocalPageChange = (studentId: number, amount: number) => {
    setLocalPageChanges((prev) => ({
      ...prev,
      [studentId]: (prev[studentId] || 0) + amount,
    }));
  };

  // [UBAH] Fungsi ini menyimpan SEMUA perubahan untuk satu baris
  const handleSaveChangesForRow = (studentId: number) => {
    const student = btqGroup?.students.find((s) => s.id === studentId);
    if (!student || !student.progress) return;

    setSavingState((prev) => ({ ...prev, [studentId]: true }));

    const payload: { pages_to_add?: number; hafalan_surah_id?: number | null; hafalan_ayat?: string | null } = {};

    // Cek perubahan halaman
    const initialPage = student.progress.halaman;
    const newPage = localPageChanges[studentId];
    if (newPage !== initialPage) {
      payload.pages_to_add = newPage - initialPage;
    }

    // Cek perubahan hafalan
    const initialHafalan = { surahId: student.progress.hafalan_surah_id, ayat: student.progress.hafalan_ayat };
    const newHafalan = localHafalanChanges[studentId];
    if (newHafalan && (newHafalan.surahId !== initialHafalan.surahId || newHafalan.ayat !== initialHafalan.ayat)) {
      payload.hafalan_surah_id = newHafalan.surahId;
      payload.hafalan_ayat = newHafalan.ayat;
    }

    if (Object.keys(payload).length > 0) {
      axios
        .patch(route("teacher.progress.update", student.progress.id), payload)
        .then(() => refreshPageData())
        .finally(() => setSavingState((prev) => ({ ...prev, [studentId]: false })));
    } else {
      setSavingState((prev) => ({ ...prev, [studentId]: false }));
    }
  };

  // [UBAH] Fungsi di modal hanya untuk atur state lokal
  const handleSetHafalan = () => {
    if (!editHafalanStudentId) return;

    setLocalHafalanChanges(prev => ({
      ...prev,
      [editHafalanStudentId]: {
        surahId: Number(hafalanSurahIds[editHafalanStudentId]) || null,
        ayat: hafalanAyats[editHafalanStudentId] || null,
      }
    }));

    setEditHafalanStudentId(null);
  };

  if (!btqGroup) { /* ... no changes ... */ }

  return (
    <AuthenticatedLayout header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Grup Saya</h2>}>
      <Head title="Grup Saya" />
      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6 md:p-8">
              <h3 className="text-xl font-bold mb-6 text-gray-800">Anggota Grup {auth.user.name}</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Siswa</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jilid</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Halaman</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hafalan</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {btqGroup.students.map((student) => {
                      const progress = student.progress;
                      const jilid = progress?.jilid ?? 0;
                      const maxHalaman = JILID_LIMITS[jilid] ?? 999;

                      const initialHalaman = progress?.halaman ?? 0;
                      const localHalaman = localPageChanges[student.id] ?? initialHalaman;

                      const localHafalan = localHafalanChanges[student.id] ?? { surahId: null, ayat: null };
                      const hafalanSurahId = localHafalan.surahId ?? progress?.hafalan_surah_id;
                      const hafalanAyat = localHafalan.ayat ?? progress?.hafalan_ayat;

                      // [UBAH] Logika `hasChanges` kini memeriksa halaman dan hafalan
                      const hasPageChange = localHalaman !== initialHalaman;
                      const hasHafalanChange = hafalanSurahId !== progress?.hafalan_surah_id || hafalanAyat !== progress?.hafalan_ayat;
                      const hasChanges = hasPageChange || hasHafalanChange;

                      const isSaving = savingState[student.id] || false;

                      return (
                        <tr key={student.id} className="hover:bg-gray-50 transition-colors duration-200">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.nama_lengkap}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{progress?.jilid ?? "-"}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <button type="button" onClick={() => handleLocalPageChange(student.id, -1)} disabled={!progress || localHalaman <= initialHalaman || isSaving} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"><MinusIcon className="w-5 h-5" /></button>
                              <span className="text-sm font-semibold text-gray-700 w-6 text-center">{localHalaman || "-"}</span>
                              <button type="button" onClick={() => handleLocalPageChange(student.id, 1)} disabled={!progress || localHalaman >= maxHalaman || isSaving} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"><PlusIcon className="w-5 h-5" /></button>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {progress?.status_kenaikan ? <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(progress.status_kenaikan)}`}>{progress.status_kenaikan}</span> : <span className="text-gray-400 italic text-sm">Belum ada</span>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button type="button" onClick={() => setEditHafalanStudentId(student.id)} className="font-medium text-indigo-600 hover:text-indigo-800 transition">
                              {/* [UBAH] Menampilkan data hafalan dari state lokal */}
                              {hafalanSurahId && hafalanAyat
                                ? `${surahs.find(s => s.id === hafalanSurahId)?.name_latin ?? '...'} : ${hafalanAyat}`
                                : "Tambah Hafalan"}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <PrimaryButton onClick={() => handleSaveChangesForRow(student.id)} disabled={!hasChanges || isSaving} className="!py-1.5 !px-3 text-xs">
                              {isSaving ? "Menyimpan..." : "Simpan"}
                            </PrimaryButton>
                          </td>
                        </tr>
                      );
                    })}
                    {btqGroup.students.length === 0 && (<tr><td colSpan={6} className="text-center py-8 text-gray-400">Belum ada siswa di kelompok ini.</td></tr>)}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Dialog open={!!editHafalanStudentId} onClose={() => setEditHafalanStudentId(null)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-xl bg-white p-6">
            <Dialog.Title className="text-lg font-bold text-gray-900">Atur Hafalan</Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-gray-500 mb-4">Atur progres hafalan untuk siswa. Perubahan akan disimpan saat Anda menekan tombol 'Simpan' di tabel utama.</Dialog.Description>
            <div className="space-y-4">
              <div>
                <label htmlFor="juz" className="block text-sm font-medium text-gray-700 mb-1">Pilih Juz</label>
                <select id="juz" value={selectedJuz} onChange={(e) => setSelectedJuz(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                  <option value="">Semua Juz</option>
                  {juzs.map((j) => (<option key={j.id} value={j.id}>Juz {j.juz_number}</option>))}
                </select>
              </div>
              <div>
                <label htmlFor="surah" className="block text-sm font-medium text-gray-700 mb-1">Pilih Surah</label>
                <select id="surah" value={hafalanSurahIds[editHafalanStudentId!] ?? ""} onChange={(e) => setHafalanSurahIds((prev) => ({...prev, [editHafalanStudentId!]: e.target.value,}))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                  <option value="">Pilih Surah</option>
                  {surahs.map((s) => (<option key={s.id} value={s.id}>{s.surah_number}. {s.name_latin}</option>))}
                </select>
              </div>
              <div>
                <label htmlFor="ayat" className="block text-sm font-medium text-gray-700 mb-1">Ayat</label>
                <input id="ayat" type="text" value={hafalanAyats[editHafalanStudentId!] ?? ""} onChange={(e) => setHafalanAyats((prev) => ({...prev, [editHafalanStudentId!]: e.target.value,}))} placeholder="Contoh: 1-7" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <SecondaryButton onClick={() => setEditHafalanStudentId(null)}>Batal</SecondaryButton>
              {/* [UBAH] Tombol ini menjadi "Atur" dan memanggil fungsi baru */}
              <PrimaryButton onClick={handleSetHafalan}>Atur</PrimaryButton>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </AuthenticatedLayout>
  );
}
