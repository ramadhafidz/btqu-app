import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import { FormEventHandler, useEffect, useState } from 'react';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import axios from 'axios';
import DangerButton from '@/Components/DangerButton'; // Tombol merah untuk hapus

interface SchoolClass {
    id: number;
    level: number;
    nama_kelas: string;
}
interface ValidationErrors { level?: string[]; nama_kelas?: string[]; }

export default function Index({ auth }: PageProps) {
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentClass, setCurrentClass] = useState<SchoolClass | null>(null);

    const [formData, setFormData] = useState({ id: '', level: '', nama_kelas: '' });
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<ValidationErrors>({});

    const fetchClasses = () => {
        axios.get('/admin/api/school-classes').then(response => setClasses(response.data));
    }

    useEffect(() => { fetchClasses(); }, []);

    const openAddModal = () => {
        setIsEditMode(false);
        setFormData({ id: '', level: '', nama_kelas: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (schoolClass: SchoolClass) => {
        setIsEditMode(true);
        setFormData({
            id: schoolClass.id.toString(),
            level: schoolClass.level.toString(),
            nama_kelas: schoolClass.nama_kelas,
        });
        setCurrentClass(schoolClass);
        setIsModalOpen(true);
    };

    const closeModal = () => setIsModalOpen(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        setProcessing(true);
        const url = isEditMode
            ? `/admin/api/school-classes/${currentClass?.id}`
            : '/admin/api/school-classes';
        const method = isEditMode ? 'put' : 'post';

        axios[method](url, formData)
            .then(response => {
                closeModal();
                fetchClasses();
            })
            .catch(error => {
                if (error.response.status === 422) {
                    setErrors(error.response.data.errors);
                }
            })
            .finally(() => setProcessing(false));
    };

    // --- FUNGSI BARU UNTUK HAPUS ---
    const deleteClass = (schoolClass: SchoolClass) => {
        // Tampilkan konfirmasi sebelum menghapus
        if (!window.confirm(`Apakah Anda yakin ingin menghapus kelas ${schoolClass.level} ${schoolClass.nama_kelas}?`)) {
            return;
        }
        axios.delete(`/admin/api/school-classes/${schoolClass.id}`)
            .then(() => {
                // Refresh daftar kelas setelah berhasil hapus
                fetchClasses();
            });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Manajemen Kelas</h2>}
        >
            <Head title="Manajemen Kelas" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="flex justify-end mb-4">
                        <PrimaryButton onClick={openAddModal}>Tambah Kelas</PrimaryButton>
                    </div>
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <table className="w-full whitespace-nowrap">
                                <thead>
                                    <tr className="text-left font-bold">
                                        <th className="pb-4 pt-6 px-6">Level</th>
                                        <th className="pb-4 pt-6 px-6">Nama Kelas</th>
                                        <th className="pb-4 pt-6 px-6">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {classes.map((schoolClass) => (
                                        <tr key={schoolClass.id} className="hover:bg-gray-100 focus-within:bg-gray-100">
                                            <td className="border-t items-center px-6 py-4">{schoolClass.level}</td>
                                            <td className="border-t items-center px-6 py-4">{schoolClass.nama_kelas}</td>
                                            <td className="border-t items-center px-6 py-4">
                                                <PrimaryButton onClick={() => openEditModal(schoolClass)}>Edit</PrimaryButton>
                                                {/* --- TOMBOL HAPUS BARU --- */}
                                                <DangerButton className="ms-2" onClick={() => deleteClass(schoolClass)}>
                                                    Hapus
                                                </DangerButton>
                                            </td>
                                        </tr>
                                    ))}
                                    {classes.length === 0 && (
                                        <tr><td className="px-6 py-4 border-t" colSpan={3}>Tidak ada data kelas.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <Modal show={isModalOpen} onClose={closeModal}>
                {/* ... (Form modal tidak ada perubahan) ... */}
                <form onSubmit={submit} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900">{isEditMode ? 'Edit Kelas' : 'Tambah Kelas Baru'}</h2>
                    <div className="mt-6">
                        <InputLabel htmlFor="level" value="Level Kelas" />
                        <TextInput id="level" type="number" name="level" value={formData.level} className="mt-1 block w-full"
                            onChange={(e) => setFormData({...formData, level: e.target.value})} required />
                        <InputError message={errors.level?.[0]} className="mt-2" />
                    </div>
                    <div className="mt-4">
                        <InputLabel htmlFor="nama_kelas" value="Nama Kelas" />
                        <TextInput id="nama_kelas" name="nama_kelas" value={formData.nama_kelas} className="mt-1 block w-full"
                            onChange={(e) => setFormData({...formData, nama_kelas: e.target.value})} required />
                        <InputError message={errors.nama_kelas?.[0]} className="mt-2" />
                    </div>
                    <div className="mt-6 flex justify-end">
                        <SecondaryButton onClick={closeModal}>Batal</SecondaryButton>
                        <PrimaryButton className="ms-3" disabled={processing}>Simpan</PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
