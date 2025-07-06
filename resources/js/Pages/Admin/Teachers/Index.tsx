import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { PageProps, User } from '@/types';
import { FormEventHandler, useEffect, useState } from 'react';
import axios from 'axios';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import DangerButton from '@/Components/DangerButton';

interface Teacher {
    id: number;
    id_pegawai: string;
    user: User;
}
interface ValidationErrors {
    name?: string[]; email?: string[]; password?: string[]; id_pegawai?: string[];
}

export default function Index({ auth }: PageProps) {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', password_confirmation: '', id_pegawai: '' });
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<ValidationErrors>({});

    const fetchTeachers = () => {
        axios.get(route('admin.api.teachers.index')).then(response => setTeachers(response.data));
    }
    useEffect(() => { fetchTeachers(); }, []);

    const openAddModal = () => {
        setIsEditMode(false);
        setFormData({ name: '', email: '', password: '', password_confirmation: '', id_pegawai: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (teacher: Teacher) => {
        setIsEditMode(true);
        setFormData({
            name: teacher.user.name,
            email: teacher.user.email,
            id_pegawai: teacher.id_pegawai,
            password: '',
            password_confirmation: ''
        });
        setCurrentTeacher(teacher);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setErrors({});
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        setProcessing(true);
        const url = isEditMode
            ? route('admin.api.teachers.update', currentTeacher?.id)
            : route('admin.api.teachers.store');
        const method = isEditMode ? 'put' : 'post';

        axios({ method, url, data: formData })
            .then(() => {
                closeModal();
                fetchTeachers();
            })
            .catch(error => {
                if (error.response && error.response.status === 422) {
                    setErrors(error.response.data.errors);
                }
            })
            .finally(() => setProcessing(false));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    };

    // --- FUNGSI BARU UNTUK HAPUS ---
    const deleteTeacher = (teacher: Teacher) => {
        if (!window.confirm(`Yakin ingin menghapus guru ${teacher.user.name}? Akun login guru ini juga akan terhapus.`)) {
            return;
        }
        axios.delete(route('admin.api.teachers.destroy', teacher.id))
            .then(() => fetchTeachers());
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Manajemen Guru</h2>}
        >
            <Head title="Manajemen Guru" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="flex justify-end mb-4">
                        <PrimaryButton onClick={openAddModal}>Tambah Guru</PrimaryButton>
                    </div>
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <table className="w-full whitespace-nowrap">
                              <thead>
                                  <tr className="text-left font-bold">
                                      <th className="pb-4 pt-6 px-6">ID Pegawai</th>
                                      <th className="pb-4 pt-6 px-6">Nama</th>
                                      <th className="pb-4 pt-6 px-6">Email</th>
                                      <th className="pb-4 pt-6 px-6">Aksi</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {teachers.map((teacher) => (
                                      <tr key={teacher.id} className="hover:bg-gray-100 focus-within:bg-gray-100">
                                          <td className="border-t items-center px-6 py-4">{teacher.id_pegawai}</td>
                                          <td className="border-t items-center px-6 py-4">{teacher.user.name}</td>
                                          <td className="border-t items-center px-6 py-4">{teacher.user.email}</td>
                                          <td className="border-t items-center px-6 py-4">
                                              <PrimaryButton onClick={() => openEditModal(teacher)}>Edit</PrimaryButton>
                                              <DangerButton className="ms-2" onClick={() => deleteTeacher(teacher)}>Hapus</DangerButton>
                                          </td>
                                      </tr>
                                  ))}
                                  {teachers.length === 0 && (
                                      <tr><td className="px-6 py-4 border-t" colSpan={4}>Tidak ada data guru.</td></tr>
                                  )}
                              </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <Modal show={isModalOpen} onClose={closeModal}>
                {/* ... Form modal tidak ada perubahan ... */}
                <form onSubmit={submit} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900">{isEditMode ? 'Edit Guru' : 'Tambah Guru Baru'}</h2>
                    <p className="mt-1 text-sm text-gray-600">{isEditMode && 'Kosongkan password jika tidak ingin mengubahnya.'}</p>
                    <div className="mt-6">
                        <InputLabel htmlFor="name" value="Nama Lengkap" />
                        <TextInput id="name" name="name" value={formData.name} className="mt-1 block w-full" onChange={handleInputChange} required />
                        <InputError message={errors.name?.[0]} className="mt-2" />
                    </div>
                    <div className="mt-4">
                        <InputLabel htmlFor="id_pegawai" value="ID Pegawai" />
                        <TextInput id="id_pegawai" name="id_pegawai" value={formData.id_pegawai} className="mt-1 block w-full" onChange={handleInputChange} required />
                        <InputError message={errors.id_pegawai?.[0]} className="mt-2" />
                    </div>
                    <div className="mt-4">
                        <InputLabel htmlFor="email" value="Email" />
                        <TextInput id="email" type="email" name="email" value={formData.email} className="mt-1 block w-full" onChange={handleInputChange} required />
                        <InputError message={errors.email?.[0]} className="mt-2" />
                    </div>
                    <div className="mt-4">
                        <InputLabel htmlFor="password" value="Password" />
                        <TextInput id="password" type="password" name="password" value={formData.password} className="mt-1 block w-full" onChange={handleInputChange} required={!isEditMode} />
                        <InputError message={errors.password?.[0]} className="mt-2" />
                    </div>
                    <div className="mt-4">
                        <InputLabel htmlFor="password_confirmation" value="Konfirmasi Password" />
                        <TextInput id="password_confirmation" type="password" name="password_confirmation" value={formData.password_confirmation} className="mt-1 block w-full" onChange={handleInputChange} required={!isEditMode} />
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
