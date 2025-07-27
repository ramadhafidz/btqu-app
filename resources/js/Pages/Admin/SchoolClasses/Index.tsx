import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import { FormEventHandler, useEffect, useState, useMemo } from 'react';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import axios from 'axios';
import {
  PlusCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

interface SchoolClass {
  id: number;
  level: number;
  nama_kelas: string;
  students_count: number;
}

interface ValidationErrors {
  level?: string[];
  nama_kelas?: string[];
}

export default function Index({ auth }: PageProps) {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentClass, setCurrentClass] = useState<SchoolClass | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    level: '',
    nama_kelas: '',
  });
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});

  const [openLevels, setOpenLevels] = useState<Record<number, boolean>>({});

  const fetchClasses = () => {
    axios
      .get(route('admin.api.school-classes.index'))
      .then((response) => setClasses(response.data));
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const groupedClasses = useMemo(() => {
    return classes.reduce(
      (acc, schoolClass) => {
        (acc[schoolClass.level] = acc[schoolClass.level] || []).push(
          schoolClass
        );
        return acc;
      },
      {} as Record<number, SchoolClass[]>
    );
  }, [classes]);

  useEffect(() => {
    const initialOpenState: Record<number, boolean> = {};
    Object.keys(groupedClasses).forEach((level) => {
      initialOpenState[Number(level)] = true;
    });
    setOpenLevels(initialOpenState);
  }, [classes]);

  const toggleLevel = (level: number) => {
    setOpenLevels((prev) => ({
      ...prev,
      [level]: !prev[level],
    }));
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setErrors({});
    setFormData({ id: '', level: '', nama_kelas: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (schoolClass: SchoolClass) => {
    setIsEditMode(true);
    setErrors({});
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
      ? route('admin.api.school-classes.update', currentClass?.id)
      : route('admin.api.school-classes.store');
    const method = isEditMode ? 'put' : 'post';

    axios({ method, url, data: formData })
      .then(() => {
        closeModal();
        fetchClasses();
      })
      .catch((error) => {
        if (error.response.status === 422) {
          setErrors(error.response.data.errors);
        }
      })
      .finally(() => setProcessing(false));
  };

  const deleteClass = (schoolClass: SchoolClass) => {
    if (
      !window.confirm(
        `Yakin ingin menghapus kelas ${schoolClass.level} ${schoolClass.nama_kelas}?`
      )
    ) {
      return;
    }
    axios
      .delete(route('admin.api.school-classes.destroy', schoolClass.id))
      .then(() => fetchClasses());
  };

  return (
    <AuthenticatedLayout
      header={
        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
          Manajemen Kelas
        </h2>
      }
    >
      <Head title="Manajemen Kelas" />
      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-800">Daftar Kelas</h3>
              <p className="text-sm text-gray-500">
                Kelola semua kelas yang tersedia di sekolah Anda.
              </p>
            </div>
            <PrimaryButton
              onClick={openAddModal}
              className="flex items-center gap-2"
            >
              <PlusCircleIcon className="w-5 h-5" />
              <span>Tambah Kelas</span>
            </PrimaryButton>
          </div>

          {/* [UBAH] Bungkus tabel dalam div untuk border & shadow */}
          <div className="bg-white shadow-sm sm:rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 font-bold w-1/4">
                    Level
                  </th>
                  <th scope="col" className="px-6 py-3 font-bold">
                    Nama Kelas
                  </th>
                  <th scope="col" className="px-6 py-3 font-bold">
                    Jumlah Siswa
                  </th>
                  <th scope="col" className="px-6 py-3 font-bold text-right">
                    Aksi
                  </th>
                </tr>
              </thead>

              {Object.keys(groupedClasses).length > 0 ? (
                Object.entries(groupedClasses).map(
                  ([level, classesInLevel]) => {
                    const levelNum = Number(level);
                    const isOpen = openLevels[levelNum];

                    return (
                      <tbody key={level} className="border-t">
                        {/* [UBAH] Header grup dibuat lebih ringan dan menyatu */}
                        <tr
                          className="bg-gray-50 cursor-pointer hover:bg-gray-100"
                          onClick={() => toggleLevel(levelNum)}
                        >
                          {/* [UBAH] Header grup sekarang menjadi bagian dari kolom, bukan colSpan */}
                          <th
                            scope="rowgroup"
                            colSpan={4}
                            className="px-6 py-3 font-bold text-gray-700 flex items-center"
                          >
                            <ChevronDownIcon
                              className={`w-5 h-5 mr-2 transition-transform ${
                                isOpen ? 'rotate-0' : '-rotate-90'
                              }`}
                            />
                            Level {level}
                          </th>
                        </tr>

                        {isOpen &&
                          classesInLevel.map((schoolClass) => (
                            <tr
                              key={schoolClass.id}
                              className="bg-white hover:bg-gray-50"
                            >
                              {/* [UBAH] Kolom pertama diberi latar belakang agar menyatu dengan headernya */}
                              <th
                                scope="row"
                                className="px-6 py-4 font-medium text-gray-900 bg-gray-50"
                              >
                                <span className="bg-blue-100 text-blue-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full">
                                  Kelas {schoolClass.level}
                                </span>
                              </th>
                              <td className="px-6 py-4 border-l">
                                {schoolClass.nama_kelas}
                              </td>
                              <td className="px-6 py-4 border-l">
                                {schoolClass.students_count} Siswa
                              </td>
                              <td className="px-6 py-4 text-right border-l">
                                <button
                                  onClick={() => openEditModal(schoolClass)}
                                  className="font-medium text-indigo-600 hover:text-indigo-800 p-2"
                                >
                                  <PencilSquareIcon className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => deleteClass(schoolClass)}
                                  className="font-medium text-red-600 hover:text-red-800 p-2 ml-2"
                                >
                                  <TrashIcon className="w-5 h-5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    );
                  }
                )
              ) : (
                <tbody>
                  <tr>
                    <td colSpan={4} className="text-center py-12">
                      <h3 className="font-semibold text-lg">
                        Belum Ada Data Kelas
                      </h3>
                      <p className="text-gray-500 mt-1">
                        Silakan tambahkan kelas baru untuk memulai.
                      </p>
                    </td>
                  </tr>
                </tbody>
              )}
            </table>
          </div>
        </div>
      </div>

      <Modal show={isModalOpen} onClose={closeModal}>
        {/* Modal tidak ada perubahan */}
        <form onSubmit={submit} className="p-6">
          <h2 className="text-lg font-medium text-gray-900">
            {isEditMode ? 'Edit Kelas' : 'Tambah Kelas Baru'}
          </h2>
          <div className="mt-6">
            <InputLabel htmlFor="level" value="Level Kelas" />
            <TextInput
              id="level"
              type="number"
              name="level"
              value={formData.level}
              className="mt-1 block w-full"
              onChange={(e) =>
                setFormData({
                  ...formData,
                  level: e.target.value,
                })
              }
              required
            />
            <InputError message={errors.level?.[0]} className="mt-2" />
          </div>
          <div className="mt-4">
            <InputLabel htmlFor="nama_kelas" value="Nama Kelas" />
            <TextInput
              id="nama_kelas"
              name="nama_kelas"
              value={formData.nama_kelas}
              className="mt-1 block w-full"
              onChange={(e) =>
                setFormData({
                  ...formData,
                  nama_kelas: e.target.value,
                })
              }
              required
            />
            <InputError message={errors.nama_kelas?.[0]} className="mt-2" />
          </div>
          <div className="mt-6 flex justify-end">
            <SecondaryButton onClick={closeModal}>Batal</SecondaryButton>
            <PrimaryButton className="ms-3" disabled={processing}>
              Simpan
            </PrimaryButton>
          </div>
        </form>
      </Modal>
    </AuthenticatedLayout>
  );
}
