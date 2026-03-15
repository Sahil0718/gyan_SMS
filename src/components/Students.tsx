import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Student, Classroom, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, MoreHorizontal, UserPlus, X, Edit2, Trash2, Filter } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

interface StudentsProps {
  profile: UserProfile | null;
  navSearchTerm: string;
}

export default function Students({ profile, navSearchTerm }: StudentsProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  const [filterClass, setFilterClass] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studentId: '',
    classroomId: '',
    status: 'active' as const
  });

  useEffect(() => {
    if (!profile?.uid) {
      setStudents([]);
      setClassrooms([]);
      return;
    }

    const studentQuery = query(collection(db, 'students'), where('ownerUid', '==', profile.uid));
    const unsubStudents = onSnapshot(studentQuery, (snap) => {
      setStudents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
    });

    const classQuery = query(collection(db, 'classrooms'), where('teacherUid', '==', profile.uid));
    const unsubClasses = onSnapshot(classQuery, (snap) => {
      const classroomData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Classroom));
      classroomData.sort((a, b) => {
        if (a.grade !== b.grade) return a.grade - b.grade;
        return (a.section || '').localeCompare(b.section || '');
      });
      setClassrooms(classroomData);
    });
    return () => {
      unsubStudents();
      unsubClasses();
    };
  }, [profile?.uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.uid) return;
    try {
      const dataToSave = { ...formData };
      if (!dataToSave.email) delete (dataToSave as any).email;

      if (editingStudent) {
        await updateDoc(doc(db, 'students', editingStudent.id), dataToSave);
      } else {
        await addDoc(collection(db, 'students'), {
          ...dataToSave,
          ownerUid: profile.uid
        });
      }
      setIsModalOpen(false);
      setEditingStudent(null);
      setFormData({ name: '', email: '', studentId: '', classroomId: '', status: 'active' });
    } catch (error) {
      console.error("Error saving student:", error);
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      email: student.email || '',
      studentId: student.studentId,
      classroomId: student.classroomId,
      status: student.status
    });
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteDoc(doc(db, 'students', confirmDelete));
      setConfirmDelete(null);
    } catch (error) {
      console.error("Error deleting student:", error);
    }
  };

  const localSearch = searchTerm.trim().toLowerCase();
  const navbarSearch = navSearchTerm.trim().toLowerCase();
  const effectiveSearch = localSearch || navbarSearch;

  const filteredStudents = students.filter(s => {
    const searchable = `${s.name || ''} ${s.studentId || ''} ${s.email || ''} ${s.status || ''}`.toLowerCase();
    const matchesSearch = effectiveSearch ? searchable.includes(effectiveSearch) : true;
    const matchesClass = filterClass ? s.classroomId === filterClass : true;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6">
      <ConfirmModal 
        isOpen={!!confirmDelete}
        title="Delete Student"
        message="Are you sure you want to delete this student record? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Student Directory</h1>
          <p className="text-slate-500 font-medium mt-1">Manage student records and enrollment status.</p>
        </div>
        <button 
          onClick={() => {
            setEditingStudent(null);
            setFormData({ name: '', email: '', studentId: '', classroomId: '', status: 'active' });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5 transition-all font-medium"
        >
          <UserPlus size={18} />
          Add Student
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col md:flex-row items-center gap-4 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name or ID..." 
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-400">
            <Filter size={18} />
          </div>
          <select 
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="flex-1 md:w-48 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          >
            <option value="">All Classes</option>
            {classrooms.map(c => (
              <option key={c.id} value={c.id}>Grade {c.grade}{c.section ? ` (Section ${c.section})` : ''}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Class</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-900">{student.name}</span>
                      <span className="text-xs text-slate-500 mt-0.5">{student.email || 'No email provided'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-slate-600">{student.studentId}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-700">
                    {(() => {
                      const c = classrooms.find(cl => cl.id === student.classroomId);
                      return c ? `Grade ${c.grade}${c.section ? ` (Section ${c.section})` : ''}` : <span className="text-slate-400 italic font-normal">Unassigned</span>;
                    })()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${
                      student.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' : 
                      student.status === 'graduated' ? 'bg-blue-50 text-blue-700 border border-blue-200/50' : 'bg-slate-100 text-slate-600 border border-slate-200/50'
                    }`}>
                      {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(student)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => setConfirmDelete(student.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium text-sm">
                    No students found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto border border-slate-100"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-display font-bold text-slate-900 tracking-tight">{editingStudent ? 'Edit Student' : 'Add New Student'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Full Name</label>
                    <input 
                      required
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Email Address <span className="text-slate-400 font-normal">(Optional)</span></label>
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700">Student ID</label>
                      <input 
                        required
                        type="text" 
                        value={formData.studentId}
                        onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700">Classroom</label>
                      <select 
                        required
                        value={formData.classroomId}
                        onChange={(e) => setFormData({...formData, classroomId: e.target.value})}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      >
                        <option value="">Select Class</option>
                        {classrooms.map(c => (
                          <option key={c.id} value={c.id}>Grade {c.grade}{c.section ? ` (Section ${c.section})` : ''}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Status</label>
                    <select 
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    >
                      <option value="active">Active</option>
                      <option value="graduated">Graduated</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="pt-6">
                  <button 
                    type="submit"
                    className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-medium hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5 transition-all"
                  >
                    {editingStudent ? 'Update Record' : 'Create Record'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
