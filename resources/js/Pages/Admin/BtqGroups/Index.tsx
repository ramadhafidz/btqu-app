import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { PageProps, Student, Teacher } from '@/types';
import { FormEventHandler, useEffect, useState } from 'react';
import axios from 'axios';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import DangerButton from '@/Components/DangerButton';

interface BtqGroup { id: number; level: number; teacher: Teacher | null; students: Student[]; }
interface ValidationErrors { teacher_id?: string[], level?: string[] }

export default function Index({ auth }: PageProps) {
    const [groups, setGroups] = useState<BtqGroup[]>([]);
    const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
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

    const refreshGroups = (level: string) => {
        axios.get(route('admin.api.btq-groups.index', { level: level }))
            .then(res => setGroups(res.data));
    };

    useEffect(() => {
        refreshGroups(filterLevel);
    }, [filterLevel]);

    useEffect(() => {
        axios.get(route('admin.api.all-teachers')).then(res => setAllTeachers(res.data));
    }, []);

    const openAddGroupModal = () => {
        setErrors({});
        setGroupFormData({ level: '' });
        setIsAddGroupModalOpen(true);
    };

    const openAssignTeacherModal = (group: BtqGroup) => {
        setCurrentGroup(group);
        setTeacherFormData({ teacher_id: group.teacher?.id.toString() || '' });
        setIsTeacherModalOpen(true);
    };

    const openManageStudentModal = (group: BtqGroup) => {
        setCurrentGroup(group);
        axios.get(route('admin.api.unassigned-students', { level: group.level }))
             .then(res => setUnassignedStudents(res.data));
        setIsStudentModalOpen(true);
    };

    const closeModal = () => {
        setIsTeacherModalOpen(false);
        setIsStudentModalOpen(false);
        setIsAddGroupModalOpen(false);
        setErrors({});
    };

    const handleCreateGroup: FormEventHandler = (e) => {
        e.preventDefault();
        setProcessing(true);
        axios.post(route('admin.api.btq-groups.store'), groupFormData)
            .then(() => { closeModal(); refreshGroups(filterLevel); })
            .catch(err => { if (err.response.status === 422) setErrors(err.response.data.errors) })
            .finally(() => setProcessing(false));
    };

    const handleAssignTeacher: FormEventHandler = (e) => {
        e.preventDefault();
        setProcessing(true);
        axios.put(route('admin.api.btq-groups.update', currentGroup?.id), teacherFormData)
            .then(() => { closeModal(); refreshGroups(filterLevel); })
            .catch(err => { if (err.response.status === 422) setErrors(err.response.data.errors) })
            .finally(() => setProcessing(false));
    };

    const refreshStudentAndGroupLists = () => {
        const groupPromise = axios.get(route('admin.api.btq-groups.index', { level: filterLevel }));
        const studentPromise = currentGroup
            ? axios.get(route('admin.api.unassigned-students', { level: currentGroup.level }))
            : Promise.resolve({ data: unassignedStudents });

        Promise.all([groupPromise, studentPromise]).then(([groupsRes, unassignedRes]) => {
            const newGroups: BtqGroup[] = groupsRes.data;
            setGroups(newGroups);
            setUnassignedStudents(unassignedRes.data);
            if (currentGroup) {
                const updatedGroup = newGroups.find(g => g.id === currentGroup.id);
                setCurrentGroup(updatedGroup || null);
            }
        });
    };

    const addStudentToGroup = (studentId: number) => {
        axios.post(route('admin.api.btq-groups.add-student', currentGroup?.id), { student_id: studentId })
            .then(() => refreshStudentAndGroupLists());
    };

    const removeStudentFromGroup = (studentId: number) => {
        axios.post(route('admin.api.btq-groups.remove-student', currentGroup?.id), { student_id: studentId })
            .then(() => refreshStudentAndGroupLists());
    };

    const getGroupName = (group: BtqGroup | null) => {
        if (!group) return '';
        return group.teacher ? `Grup ${group.teacher.user.name}` : `Grup ${group.id}`;
    }

    // --- FUNGSI BARU UNTUK HAPUS GRUP ---
    const deleteGroup = (group: BtqGroup) => {
        if (!window.confirm(`Yakin ingin menghapus ${getGroupName(group)}? Semua siswa di dalamnya akan dikeluarkan dari grup.`)) {
            return;
        }
        axios.delete(route('admin.api.btq-groups.destroy', group.id))
            .then(() => refreshGroups(filterLevel));
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Manajemen Kelompok BTQ</h2>}
        >
            <Head title="Manajemen Kelompok BTQ" />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)}
                                className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm">
                                <option value="">Semua Level</option>
                                <option value="1">Level 1</option><option value="2">Level 2</option><option value="3">Level 3</option>
                                <option value="4">Level 4</option><option value="5">Level 5</option><option value="6">Level 6</option>
                            </select>
                        </div>
                        <PrimaryButton onClick={openAddGroupModal}>Tambah Grup Baru</PrimaryButton>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {groups.map((group) => (
                            <div key={group.id} className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">{getGroupName(group)} (Level {group.level})</h3>
                                        {/* --- TOMBOL HAPUS GRUP BARU --- */}
                                        <DangerButton onClick={() => deleteGroup(group)}>X</DangerButton>
                                    </div>
                                    <div className="border-t pt-4 mb-4">
                                        <p className="text-sm font-medium text-gray-500">Guru Pengajar:</p>
                                        <p className="text-gray-800">{group.teacher ? group.teacher.user.name : 'Belum ada guru'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Anggota ({group.students.length} Siswa):</p>
                                        <ul className="list-disc list-inside mt-2 text-gray-700 max-h-40 overflow-y-auto">
                                            {group.students.length > 0 ? (group.students.map(student => <li key={student.id}>{student.nama_lengkap}</li>)) : <li className="text-gray-400 italic">Belum ada siswa</li>}
                                        </ul>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t flex space-x-2">
                                    <SecondaryButton onClick={() => openAssignTeacherModal(group)}>Atur Guru</SecondaryButton>
                                    <PrimaryButton onClick={() => openManageStudentModal(group)}>Atur Siswa</PrimaryButton>
                                </div>
                            </div>
                        ))}
                        {groups.length === 0 && <div className="col-span-full bg-white overflow-hidden shadow-sm sm:rounded-lg p-6"><p className="text-center text-gray-500">Tidak ada kelompok BTQ untuk level ini.</p></div>}
                    </div>
                </div>
            </div>

            <Modal show={isAddGroupModalOpen} onClose={closeModal}>
                <form onSubmit={handleCreateGroup} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900">Buat Grup BTQ Baru</h2>
                    <div className="mt-6">
                        <InputLabel htmlFor="level" value="Pilih Level untuk Grup Baru" />
                        <select name="level" id="level" value={groupFormData.level} required
                            onChange={(e) => setGroupFormData({ level: e.target.value })}
                            className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm">
                            <option value="">Pilih Level</option>
                            <option value="1">Level 1</option><option value="2">Level 2</option><option value="3">Level 3</option><option value="4">Level 4</option><option value="5">Level 5</option><option value="6">Level 6</option>
                        </select>
                        <InputError message={errors.level?.[0]} className="mt-2" />
                    </div>
                    <div className="mt-6 flex justify-end">
                        <SecondaryButton onClick={closeModal}>Batal</SecondaryButton>
                        <PrimaryButton className="ms-3" disabled={processing}>Buat Grup</PrimaryButton>
                    </div>
                </form>
            </Modal>

            <Modal show={isTeacherModalOpen} onClose={closeModal}>
                <form onSubmit={handleAssignTeacher} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900">Atur Guru untuk {getGroupName(currentGroup)}</h2>
                    <div className="mt-6">
                        <InputLabel htmlFor="teacher_id" value="Pilih Guru" />
                        <select name="teacher_id" id="teacher_id" value={teacherFormData.teacher_id} required
                            onChange={(e) => setTeacherFormData({ teacher_id: e.target.value })}
                            className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm">
                            <option value="">Pilih seorang guru</option>
                            {allTeachers.map(teacher => <option key={teacher.id} value={teacher.id}>{teacher.user.name}</option>)}
                        </select>
                        <InputError message={errors.teacher_id?.[0]} className="mt-2" />
                    </div>
                    <div className="mt-6 flex justify-end">
                        <SecondaryButton onClick={closeModal}>Batal</SecondaryButton>
                        <PrimaryButton className="ms-3" disabled={processing}>Simpan</PrimaryButton>
                    </div>
                </form>
            </Modal>

            <Modal show={isStudentModalOpen} onClose={closeModal} maxWidth="4xl">
                <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 border-b pb-2">Atur Siswa untuk {getGroupName(currentGroup)}</h2>
                    <div className="mt-4 grid grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-bold text-gray-800">Anggota Saat Ini ({currentGroup?.students.length})</h3>
                            <div className="mt-2 border rounded-md p-2 min-h-[10rem] max-h-96 overflow-y-auto">
                                <ul className="space-y-2">
                                    {currentGroup?.students.map(student => (
                                        <li key={student.id} className="flex justify-between items-center p-2 rounded hover:bg-gray-100">
                                            <span>{student.nama_lengkap}</span>
                                            <DangerButton onClick={() => removeStudentFromGroup(student.id)}>Keluarkan</DangerButton>
                                        </li>
                                    ))}
                                    {currentGroup?.students.length === 0 && <p className="italic text-gray-500 p-2">Tidak ada anggota.</p>}
                                </ul>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">Siswa Tersedia ({unassignedStudents.length})</h3>
                            <div className="mt-2 border rounded-md p-2 min-h-[10rem] max-h-96 overflow-y-auto">
                                <ul className="mt-2 space-y-2">
                                    {unassignedStudents.map(student => (
                                        <li key={student.id} className="flex justify-between items-center p-2 rounded hover:bg-gray-100">
                                            <span>{student.nama_lengkap}</span>
                                            <PrimaryButton onClick={() => addStudentToGroup(student.id)}>+ Tambah</PrimaryButton>
                                        </li>
                                    ))}
                                    {unassignedStudents.length === 0 && <p className="italic text-gray-500 p-2">Tidak ada siswa tersedia.</p>}
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end"><SecondaryButton onClick={closeModal}>Tutup</SecondaryButton></div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
