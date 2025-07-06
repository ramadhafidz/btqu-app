import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { PageProps, BtqGroup, Student, StudentProgress, Juz, Surah } from '@/types';
import { useState, useEffect, FormEventHandler, FormEvent } from 'react';
import axios from 'axios';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import InputLabel from '@/Components/InputLabel';
import SecondaryButton from '@/Components/SecondaryButton';

interface StudentWithProgress extends Student { progress: StudentProgress }
interface BtqGroupWithStudents extends BtqGroup { students: StudentWithProgress[] }

const JILID_LIMITS: { [key: number]: number } = { 1: 40, 2: 40, 3: 40, 4: 40, 5: 40, 6: 40, 7: 37, 8: 25 };

export default function MyGroup({ auth, btqGroup: initialGroup }: PageProps & { btqGroup: BtqGroupWithStudents | null }) {
    const [btqGroup, setBtqGroup] = useState(initialGroup);
    const [pagesToAdd, setPagesToAdd] = useState<{ [key: number]: string }>({});
    const [juzs, setJuzs] = useState<Juz[]>([]);
    const [surahs, setSurahs] = useState<Surah[]>([]);
    const [selectedJuz, setSelectedJuz] = useState('');
    const [hafalanForm, setHafalanForm] = useState({ hafalan_surah_id: '', hafalan_ayat: '' });
    const [processingHafalan, setProcessingHafalan] = useState(false);

    useEffect(() => {
        setBtqGroup(initialGroup);
    }, [initialGroup]);

    useEffect(() => {
        axios.get(route('api.juzs')).then(res => setJuzs(res.data));
        axios.get(route('api.surahs')).then(res => setSurahs(res.data));
    }, []);

    useEffect(() => {
        if (btqGroup) {
            setHafalanForm({
                hafalan_surah_id: btqGroup.hafalan_surah_id?.toString() || '',
                hafalan_ayat: btqGroup.hafalan_ayat || '',
            });
        }
    }, [btqGroup]);

    useEffect(() => {
        axios.get(route('api.surahs', { juz_id: selectedJuz })).then(res => setSurahs(res.data));
    }, [selectedJuz]);

    const refreshPageData = () => {
        // @ts-ignore
        router.reload({
            only: ['btqGroup'], // Hanya minta data 'btqGroup' yang baru dari server
            preserveState: true, // Penting: agar state lokal (seperti input) tidak hilang
            preserveScroll: true, // Agar posisi scroll halaman tidak kembali ke atas
        });
    };

    const handlePageChange = (studentId: number, value: string) => {
        setPagesToAdd(prev => ({ ...prev, [studentId]: value }));
    };

    const handleUpdateProgress = (e: FormEvent, studentId: number) => {
        e.preventDefault();
        const student = btqGroup?.students.find(s => s.id === studentId);
        if (!student?.progress) return;
        axios.patch(route('teacher.progress.update', student.progress.id), { pages_to_add: pagesToAdd[studentId] || '0' })
             .then(() => {
                refreshPageData();
                setPagesToAdd(prev => ({ ...prev, [studentId]: '' }));
             });
    };

    const handleProposePromotion = (studentId: number) => {
        const student = btqGroup?.students.find(s => s.id === studentId);
        if (!student?.progress) return;
        axios.post(route('teacher.promotions.propose', student.progress.id))
             .then(() => refreshPageData());
    };

    const handleUpdateHafalan: FormEventHandler = (e) => {
        e.preventDefault();
        if (!btqGroup) return;
        setProcessingHafalan(true);
        axios.put(route('teacher.hafalan.update', btqGroup.id), hafalanForm)
             .then(() => refreshPageData())
             .finally(() => setProcessingHafalan(false));
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Grup Saya</h2>}
        >
            <Head title="Grup Saya" />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {btqGroup ? (
                        <>
                            <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                                <section>
                                    <header>
                                        <h2 className="text-lg font-medium text-gray-900">Atur Hafalan Kelompok</h2>
                                        <p className="mt-1 text-sm text-gray-600">
                                            Hafalan saat ini:
                                            <strong> Surah {btqGroup.hafalan_surah?.name_latin ?? 'N/A'}</strong> Ayat <strong>{btqGroup.hafalan_ayat ?? 'N/A'}</strong>
                                        </p>
                                    </header>
                                    <form onSubmit={handleUpdateHafalan} className="mt-6 space-y-6">
                                        <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
                                            <div className="sm:w-1/3"><InputLabel htmlFor="juz" value="Pilih Juz" /><select name="juz" id="juz" onChange={e => setSelectedJuz(e.target.value)} className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"><option value="">Semua Juz</option>{juzs.map(j => <option key={j.id} value={j.id}>Juz {j.juz_number}</option>)}</select></div>
                                            <div className="sm:w-1/3"><InputLabel htmlFor="hafalan_surah_id" value="Pilih Surah" /><select name="hafalan_surah_id" id="hafalan_surah_id" value={hafalanForm.hafalan_surah_id} onChange={e => setHafalanForm(prev => ({ ...prev, hafalan_surah_id: e.target.value }))} className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"><option value="">Pilih Surah</option>{surahs.map(s => <option key={s.id} value={s.id}>{s.surah_number}. {s.name_latin}</option>)}</select></div>
                                            <div className="sm:w-1/3"><InputLabel htmlFor="hafalan_ayat" value="Ayat" /><TextInput id="hafalan_ayat" name="hafalan_ayat" value={hafalanForm.hafalan_ayat} onChange={e => setHafalanForm(prev => ({...prev, hafalan_ayat: e.target.value}))} className="mt-1 block w-full" placeholder="Contoh: 1-7"/></div>
                                        </div>
                                        <PrimaryButton disabled={processingHafalan}>Simpan Hafalan</PrimaryButton>
                                    </form>
                                </section>
                            </div>
                            <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                                <h3 className="text-lg font-bold mb-4">Anggota Kelompok: {btqGroup.teacher ? `Grup ${btqGroup.teacher.user.name}` : `Grup ${btqGroup.id}`}</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full whitespace-nowrap">
                                        <thead>
                                            <tr className="text-left font-bold"><th className="pb-4 pt-6 px-6">Nama Siswa</th><th className="pb-4 pt-6 px-6">Jilid</th><th className="pb-4 pt-6 px-6">Halaman</th><th className="pb-4 pt-6 px-6">Status</th><th className="pb-4 pt-6 px-6">Tambah Halaman</th></tr>
                                        </thead>
                                        <tbody>
                                            {btqGroup.students.map((student) => {
                                                const limit = JILID_LIMITS[student.progress.jilid] || 40;
                                                const isCompleted = student.progress.halaman >= limit;
                                                const isProposed = student.progress.status_kenaikan === 'Diajukan';
                                                return (
                                                    <tr key={student.id} className="hover:bg-gray-100"><td className="border-t items-center px-6 py-4">{student.nama_lengkap}</td><td className="border-t items-center px-6 py-4">{student.progress.jilid}</td><td className="border-t items-center px-6 py-4">{student.progress.halaman}</td><td className="border-t items-center px-6 py-4"><span className={`px-2 py-1 text-xs font-bold rounded-full ${isProposed ? 'bg-blue-200 text-blue-800' : 'bg-green-200 text-green-800'}`}>{student.progress.status_kenaikan}</span></td><td className="border-t items-center px-6 py-2">{isProposed ? (<span className="italic text-gray-500">Menunggu ACC</span>) : isCompleted ? (<SecondaryButton onClick={() => handleProposePromotion(student.id)}>Ajukan</SecondaryButton>) : (<form onSubmit={(e) => handleUpdateProgress(e, student.id)} className="flex items-center space-x-2"><TextInput type="number" min="1" value={pagesToAdd[student.id] || ''} onChange={(e) => handlePageChange(student.id, e.target.value)} className="w-24" /><PrimaryButton>Update</PrimaryButton></form>)}</td></tr>
                                                );
                                            })}
                                            {btqGroup.students.length === 0 && (<tr><td className="px-6 py-4 border-t" colSpan={5}>Belum ada siswa di kelompok ini.</td></tr>)}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    ) : <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg"><div className="p-6 text-gray-900">Anda belum ditugaskan untuk mengajar di kelompok manapun.</div></div>}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
