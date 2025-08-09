import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { PageProps, Student, Teacher } from '@/types';
import { FormEventHandler, useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import DangerButton from '@/Components/DangerButton';
import TextInput from '@/Components/TextInput';
import { useToast } from '@/hooks/useToast';
import {
  TrashIcon,
  PlusCircleIcon,
  ChevronUpDownIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import Downshift from 'downshift';

interface BtqGroup {
  id: number;
  level: number;
  teacher: Teacher | null;
  students: Student[];
}
interface ValidationErrors {
  teacher_id?: string[];
  level?: string[];
}

// Helper untuk menggabungkan classNames secara kondisional
const cx = (...classes: (string | boolean | undefined)[]) =>
  classes.filter(Boolean).join(' ');

export default function Index({ auth }: PageProps) {
  const [groups, setGroups] = useState<BtqGroup[]>([]);
  const [unassignedStudents, setUnassignedStudents] = useState<Student[]>([]);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<BtqGroup | null>(null);
  const [teacherFormData, setTeacherFormData] = useState({ teacher_id: '' });
  const [groupFormData, setGroupFormData] = useState({ level: '' });
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [filterLevel, setFilterLevel] = useState<string>('');
  const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<BtqGroup | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  const toast = useToast();

  const groupedByLevel = useMemo(() => {
    return groups.reduce(
      (acc, group) => {
        (acc[group.level] = acc[group.level] || []).push(group);
        return acc;
      },
      {} as Record<number, BtqGroup[]>
    );
  }, [groups]);

  const refreshGroups = (level: string) => {
    axios
      .get(route('admin.api.btq-groups.index', { level: level }))
      .then((res) => setGroups(res.data));
  };

  useEffect(() => {
    refreshGroups(filterLevel);
  }, [filterLevel]);

  const openAddGroupModal = () => {
    setErrors({});
    setGroupFormData({ level: '' });
    setIsAddGroupModalOpen(true);
  };

  const openAssignTeacherModal = (group: BtqGroup) => {
    setCurrentGroup(group);
    setTeacherFormData({ teacher_id: group.teacher?.id.toString() || '' });
    // Ambil semua data guru saat modal dibuka
    axios.get(route('admin.api.all-teachers')).then((res) => {
      setAllTeachers(res.data);
    });
    setIsTeacherModalOpen(true);
  };

  const openManageStudentModal = (group: BtqGroup) => {
    setCurrentGroup(group);
    axios
      .get(route('admin.api.unassigned-students', { level: group.level }))
      .then((res) => setUnassignedStudents(res.data));
    setIsStudentModalOpen(true);
  };

  const closeModal = () => {
    setIsTeacherModalOpen(false);
    setIsStudentModalOpen(false);
    setIsAddGroupModalOpen(false);
    setErrors({});
    // Bersihkan state guru saat modal ditutup
    setAllTeachers([]);
  };

  const handleCreateGroup: FormEventHandler = (e) => {
    e.preventDefault();
    setProcessing(true);
    axios
      .post(route('admin.api.btq-groups.store'), groupFormData)
      .then(() => {
        closeModal();
        refreshGroups(filterLevel);
        const lvl = groupFormData.level ? ` Level ${groupFormData.level}` : '';
        toast.success(`Grup BTQ${lvl} berhasil dibuat.`);
      })
      .catch((err) => {
        if (err.response?.status === 422) {
          setErrors(err.response.data.errors);
        } else {
          toast.error('Terjadi kesalahan saat membuat grup.');
        }
      })
      .finally(() => setProcessing(false));
  };

  const handleAssignTeacher: FormEventHandler = (e) => {
    e.preventDefault();
    setProcessing(true);
    axios
      .put(
        route('admin.api.btq-groups.update', currentGroup?.id),
        teacherFormData
      )
      .then(() => {
        closeModal();
        refreshGroups(filterLevel);
        toast.success(
          teacherFormData.teacher_id
            ? 'Guru berhasil diatur untuk grup.'
            : 'Guru berhasil dilepas dari grup.'
        );
      })
      .catch((err) => {
        if (err.response?.status === 422) {
          setErrors(err.response.data.errors);
        } else {
          toast.error('Terjadi kesalahan saat menyimpan pengaturan guru.');
        }
      })
      .finally(() => setProcessing(false));
  };

  const refreshStudentAndGroupLists = () => {
    const groupPromise = axios.get(
      route('admin.api.btq-groups.index', { level: filterLevel })
    );
    const studentPromise = currentGroup
      ? axios.get(
          route('admin.api.unassigned-students', { level: currentGroup.level })
        )
      : Promise.resolve({ data: unassignedStudents });

    Promise.all([groupPromise, studentPromise]).then(
      ([groupsRes, unassignedRes]) => {
        const newGroups: BtqGroup[] = groupsRes.data;
        setGroups(newGroups);
        setUnassignedStudents(unassignedRes.data);
        if (currentGroup) {
          const updatedGroup = newGroups.find((g) => g.id === currentGroup.id);
          setCurrentGroup(updatedGroup || null);
        }
      }
    );
  };

  const addStudentToGroup = (studentId: number) => {
    axios
      .post(route('admin.api.btq-groups.add-student', currentGroup?.id), {
        student_id: studentId,
      })
      .then(() => {
        refreshStudentAndGroupLists();
        toast.success('Siswa berhasil ditambahkan ke grup.');
      })
      .catch(() => toast.error('Gagal menambahkan siswa ke grup.'));
  };

  const removeStudentFromGroup = (studentId: number) => {
    axios
      .post(route('admin.api.btq-groups.remove-student', currentGroup?.id), {
        student_id: studentId,
      })
      .then(() => {
        refreshStudentAndGroupLists();
        toast.success('Siswa berhasil dikeluarkan dari grup.');
      })
      .catch(() => toast.error('Gagal mengeluarkan siswa dari grup.'));
  };

  const getGroupName = (group: BtqGroup | null) => {
    if (!group) return '';
    return group.teacher
      ? `Grup ${group.teacher.user.name}`
      : `Grup Level ${group.level}`;
  };

  const openDeleteGroup = (group: BtqGroup) => {
    setGroupToDelete(group);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!groupToDelete) return;
    setIsDeleting(true);
    axios
      .delete(route('admin.api.btq-groups.destroy', groupToDelete.id))
      .then(() => {
        setIsDeleteModalOpen(false);
        setGroupToDelete(null);
        refreshGroups(filterLevel);
        toast.success('Grup berhasil dihapus.');
      })
      .catch(() => {
        toast.error('Terjadi kesalahan saat menghapus grup.');
      })
      .finally(() => setIsDeleting(false));
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setGroupToDelete(null);
  };

  const isSearchActive = studentSearch.trim().length > 0;
  const filteredCurrentMembers = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    const items = currentGroup?.students ?? [];
    if (!q) return items;
    return items.filter(
      (s) =>
        (s.nama_lengkap?.toLowerCase() || '').includes(q) ||
        String((s as any).nisn ?? '')
          .toLowerCase()
          .includes(q)
    );
  }, [currentGroup, studentSearch]);

  const filteredUnassigned = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return unassignedStudents;
    return unassignedStudents.filter(
      (s) =>
        (s.nama_lengkap?.toLowerCase() || '').includes(q) ||
        String((s as any).nisn ?? '')
          .toLowerCase()
          .includes(q)
    );
  }, [unassignedStudents, studentSearch]);

  return (
    <AuthenticatedLayout
      header={
        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
          Manajemen Kelompok BTQ
        </h2>
      }
    >
      <Head title="Manajemen Kelompok BTQ" />
      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-800">
                Daftar Kelompok BTQ
              </h3>
              <p className="text-sm text-gray-500">
                Bentuk kelompok, atur guru, dan masukkan siswa.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <label htmlFor="filterLevel" className="sr-only">
                Filter berdasarkan Level
              </label>
              <select
                id="filterLevel"
                aria-label="Filter berdasarkan Level"
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
              >
                <option value="">Semua Level</option>
                <option value="1">Level 1</option>
                <option value="2">Level 2</option>
                <option value="3">Level 3</option>
                <option value="4">Level 4</option>
                <option value="5">Level 5</option>
                <option value="6">Level 6</option>
              </select>
              <PrimaryButton
                onClick={openAddGroupModal}
                className="flex items-center gap-2"
              >
                <PlusCircleIcon className="w-5 h-5" />
                <span>Tambah Grup</span>
              </PrimaryButton>
            </div>
          </div>

          <div className="space-y-8">
            {Object.keys(groupedByLevel).length > 0 ? (
              Object.entries(groupedByLevel).map(([level, groupsInLevel]) => (
                <div key={level}>
                  <h4 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2">
                    Level {level}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groupsInLevel.map((group) => {
                      return (
                        <div
                          key={group.id}
                          className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col"
                        >
                          <div className="p-5 flex-grow">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="text-lg font-bold text-gray-900">
                                  {getGroupName(group)}
                                </h3>
                                <p className="text-sm text-gray-400">
                                  ID Grup: {group.id}
                                </p>
                              </div>
                              <button
                                onClick={() => openDeleteGroup(group)}
                                className="text-gray-400 hover:text-red-500"
                                title="Hapus Grup"
                                aria-label="Hapus Grup"
                              >
                                <TrashIcon className="w-5 h-5" />
                              </button>
                            </div>

                            <div className="flex items-center gap-3 my-4">
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                                {group.teacher
                                  ? group.teacher.user.name.charAt(0)
                                  : '?'}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-500">
                                  Guru Pengajar
                                </p>
                                <p className="font-semibold text-gray-800">
                                  {group.teacher ? (
                                    group.teacher.user.name
                                  ) : (
                                    <span className="text-gray-400 italic">
                                      Belum diatur
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <p className="text-sm font-medium text-gray-500">
                                  Anggota ({group.students.length} Siswa)
                                </p>
                              </div>
                            </div>

                            <div className="flex -space-x-2 mt-3 overflow-hidden">
                              {group.students.slice(0, 7).map((student) => (
                                <div
                                  key={student.id}
                                  title={student.nama_lengkap}
                                  className="w-8 h-8 rounded-full bg-blue-200 text-blue-800 border-2 border-white flex items-center justify-center text-xs font-bold"
                                >
                                  {student.nama_lengkap
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')}
                                </div>
                              ))}
                              {group.students.length > 7 && (
                                <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-800 border-2 border-white flex items-center justify-center text-xs font-bold">
                                  +{group.students.length - 7}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="bg-gray-50 p-3 mt-auto flex justify-end gap-2 border-t">
                            <SecondaryButton
                              onClick={() => openAssignTeacherModal(group)}
                              className="!text-xs !py-1.5 !px-3"
                            >
                              Atur Guru
                            </SecondaryButton>
                            <PrimaryButton
                              onClick={() => openManageStudentModal(group)}
                              className="!text-xs !py-1.5 !px-3"
                            >
                              Atur Siswa
                            </PrimaryButton>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16 bg-white rounded-lg shadow-sm">
                <h3 className="font-semibold text-lg">
                  Tidak Ada Kelompok BTQ
                </h3>
                <p className="text-gray-500 mt-1">
                  Silakan buat kelompok baru untuk level yang dipilih.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal show={isAddGroupModalOpen} onClose={closeModal}>
        <form onSubmit={handleCreateGroup} className="p-6">
          <h2 className="text-lg font-medium text-gray-900">
            Buat Grup BTQ Baru
          </h2>
          <div className="mt-6">
            <InputLabel htmlFor="level" value="Pilih Level untuk Grup Baru" />
            <select
              name="level"
              id="level"
              aria-label="Pilih Level untuk Grup Baru"
              value={groupFormData.level}
              required
              onChange={(e) => setGroupFormData({ level: e.target.value })}
              className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
            >
              <option value="">Pilih Level</option>
              <option value="1">Level 1</option>
              <option value="2">Level 2</option>
              <option value="3">Level 3</option>
              <option value="4">Level 4</option>
              <option value="5">Level 5</option>
              <option value="6">Level 6</option>
            </select>
            <InputError message={errors.level?.[0]} className="mt-2" />
          </div>
          <div className="mt-6 flex justify-end">
            <SecondaryButton onClick={closeModal}>Batal</SecondaryButton>
            <PrimaryButton className="ms-3" disabled={processing}>
              Buat Grup
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      <Modal show={isTeacherModalOpen} onClose={closeModal}>
        <div className="p-6 overflow-visible">
          <form onSubmit={handleAssignTeacher} className="p-6 overflow-visible">
            <h2 className="text-lg font-medium text-gray-900">
              Atur Guru untuk {getGroupName(currentGroup)}
            </h2>
            <Downshift
              onChange={(selection) =>
                setTeacherFormData({
                  teacher_id: selection ? String(selection.id) : '',
                })
              }
              itemToString={(item) => (item ? item.user.name : '')}
              initialSelectedItem={currentGroup?.teacher}
            >
              {({
                getInputProps,
                getItemProps,
                getLabelProps,
                getMenuProps,
                getToggleButtonProps,
                isOpen,
                inputValue,
                highlightedIndex,
                selectedItem,
                getRootProps,
              }) => (
                <div className="mt-6 relative z-50">
                  <div className="w-full flex flex-col gap-1">
                    <label
                      {...getLabelProps()}
                      className="block text-sm font-medium text-gray-700"
                    >
                      Pilih Guru
                    </label>
                    <div
                      className="relative"
                      {...getRootProps({}, { suppressRefError: true })}
                    >
                      <div className="flex items-center border border-gray-300 rounded-md shadow-sm">
                        <input
                          placeholder="Ketik untuk mencari guru..."
                          className="w-full p-2 border-none focus:ring-0 rounded-md"
                          {...getInputProps()}
                        />
                        <button
                          aria-label={'toggle menu'}
                          type="button"
                          className="px-2"
                          {...getToggleButtonProps()}
                        >
                          <ChevronUpDownIcon className="w-5 h-5 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <ul
                    {...getMenuProps()}
                    className={cx(
                      'absolute w-full bg-white mt-1 shadow-lg max-h-60 overflow-y-auto rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-50',
                      !(isOpen && allTeachers.length) && 'hidden'
                    )}
                  >
                    {isOpen
                      ? allTeachers
                          .filter(
                            (item) =>
                              !inputValue ||
                              item.user.name
                                .toLowerCase()
                                .includes(inputValue.toLowerCase())
                          )
                          .map((item, index) => (
                            <li
                              className={cx(
                                'cursor-pointer select-none relative py-2 px-3',
                                highlightedIndex === index && 'bg-indigo-100',
                                selectedItem?.id_pegawai === item.id_pegawai &&
                                  'font-semibold'
                              )}
                              {...getItemProps({
                                key: item.id_pegawai,
                                index,
                                item,
                              })}
                            >
                              <span className="block truncate">
                                {item.user.name}
                              </span>
                              <span className="text-sm text-gray-500">
                                ID: {item.id_pegawai}
                              </span>
                            </li>
                          ))
                      : null}
                  </ul>
                  <InputError
                    message={errors.teacher_id?.[0]}
                    className="mt-2"
                  />
                </div>
              )}
            </Downshift>

            <div className="mt-6 flex justify-end">
              <SecondaryButton type="button" onClick={closeModal}>
                Batal
              </SecondaryButton>
              <PrimaryButton className="ms-3" disabled={processing}>
                Simpan
              </PrimaryButton>
            </div>
          </form>
        </div>
      </Modal>

      <Modal show={isStudentModalOpen} onClose={closeModal} maxWidth="2xl">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 border-b pb-2">
            Atur Siswa untuk {getGroupName(currentGroup)}
          </h2>
          <div className="mt-4 relative">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
              </div>
              <TextInput
                type="text"
                placeholder="Cari siswa (nama atau NISN)..."
                className="w-full pl-10"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-gray-800">
                Anggota Saat Ini ({filteredCurrentMembers.length}
                {isSearchActive && currentGroup
                  ? `/ ${currentGroup.students.length}`
                  : ''}
                )
              </h3>
              <div className="mt-2 border rounded-md p-2 min-h-[10rem] max-h-96 overflow-y-auto">
                <ul className="space-y-2">
                  {filteredCurrentMembers.map((student) => (
                    <li
                      key={student.id}
                      className="flex justify-between items-center p-2 rounded hover:bg-gray-100"
                    >
                      <span>{student.nama_lengkap}</span>
                      <DangerButton
                        onClick={() => removeStudentFromGroup(student.id)}
                      >
                        Keluarkan
                      </DangerButton>
                    </li>
                  ))}
                  {filteredCurrentMembers.length === 0 && (
                    <li>
                      <p className="italic text-gray-500 p-2">
                        {isSearchActive
                          ? 'Tidak ada hasil.'
                          : 'Tidak ada anggota.'}
                      </p>
                    </li>
                  )}
                </ul>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-gray-800">
                Siswa Tersedia ({filteredUnassigned.length}
                {isSearchActive ? `/ ${unassignedStudents.length}` : ''})
              </h3>
              <div className="mt-2 border rounded-md p-2 min-h-[10rem] max-h-96 overflow-y-auto">
                <ul className="mt-2 space-y-2">
                  {filteredUnassigned.map((student) => (
                    <li
                      key={student.id}
                      className="flex justify-between items-center p-2 rounded hover:bg-gray-100"
                    >
                      <span>{student.nama_lengkap}</span>
                      <PrimaryButton
                        onClick={() => addStudentToGroup(student.id)}
                      >
                        + Tambah
                      </PrimaryButton>
                    </li>
                  ))}
                  {filteredUnassigned.length === 0 && (
                    <li>
                      <p className="italic text-gray-500 p-2">
                        {isSearchActive
                          ? 'Tidak ada hasil.'
                          : 'Tidak ada siswa tersedia.'}
                      </p>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <SecondaryButton onClick={closeModal}>Tutup</SecondaryButton>
          </div>
        </div>
      </Modal>

      {/* Modal Konfirmasi Penghapusan Grup */}
      <Modal show={isDeleteModalOpen} onClose={closeDeleteModal}>
        <div className="p-6">
          <div className="flex items-center">
            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
              <TrashIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
            </div>
            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
              <h3 className="text-base font-semibold leading-6 text-gray-900">
                Konfirmasi Penghapusan Grup
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Anda yakin ingin menghapus{' '}
                  <span className="font-semibold text-gray-900">
                    {getGroupName(groupToDelete)}
                  </span>
                  ?
                </p>
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-amber-800">
                        <strong>Peringatan:</strong> Semua siswa di dalam grup
                        ini akan dikeluarkan dari grup, dan penghapusan tidak
                        dapat dibatalkan.
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <DangerButton
              onClick={confirmDelete}
              disabled={isDeleting}
              className="w-full justify-center sm:ml-3 sm:w-auto"
            >
              {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
            </DangerButton>
            <SecondaryButton
              onClick={closeDeleteModal}
              disabled={isDeleting}
              className="mt-3 w-full justify-center sm:mt-0 sm:w-auto"
            >
              Batal
            </SecondaryButton>
          </div>
        </div>
      </Modal>
    </AuthenticatedLayout>
  );
}
