import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Classroom, UserProfile } from '../types';
import { Plus, Trash2, Users, GraduationCap } from 'lucide-react';
import { motion } from 'motion/react';
import ConfirmModal from './ConfirmModal';

interface ClassroomsProps {
  profile: UserProfile | null;
  searchTerm: string;
}

export default function Classrooms({ profile, searchTerm }: ClassroomsProps) {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [newClass, setNewClass] = useState({
    grade: 6,
    section: '',
    subjects: ''
  });

  useEffect(() => {
    if (!profile?.uid) {
      setClassrooms([]);
      return;
    }

    const classroomsQuery = query(collection(db, 'classrooms'), where('teacherUid', '==', profile.uid));
    const unsubscribe = onSnapshot(classroomsQuery, (snap) => {
      const classroomData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Classroom));
      // Sort by grade (asc) then section (asc) in memory
      classroomData.sort((a, b) => {
        if (a.grade !== b.grade) return a.grade - b.grade;
        return (a.section || '').localeCompare(b.section || '');
      });
      setClassrooms(classroomData);
    });
    return () => unsubscribe();
  }, [profile?.uid]);

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    try {
      const subjectsArray = newClass.subjects.split(',').map(s => s.trim()).filter(s => s !== '');
      await addDoc(collection(db, 'classrooms'), {
        grade: newClass.grade,
        section: newClass.section,
        subjects: subjectsArray,
        teacherUid: profile.uid
      });
      setNewClass({ grade: 6, section: '', subjects: '' });
      setIsAdding(false);
    } catch (error) {
      console.error("Error adding classroom:", error);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteDoc(doc(db, 'classrooms', confirmDelete));
      setConfirmDelete(null);
    } catch (error) {
      console.error("Error deleting classroom:", error);
    }
  };

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredClassrooms = classrooms.filter((classroom) => {
    if (!normalizedSearchTerm) return true;
    const searchable = [
      `grade ${classroom.grade}`,
      classroom.section || '',
      ...(classroom.subjects || [])
    ]
      .join(' ')
      .toLowerCase();
    return searchable.includes(normalizedSearchTerm);
  });

  return (
    <div className="space-y-6">
      <ConfirmModal 
        isOpen={!!confirmDelete}
        title="Delete Classroom"
        message="Are you sure you want to delete this class? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Classrooms</h1>
          <p className="text-slate-500 font-medium mt-1">Manage grades 6-10, their sections, and subjects.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5 transition-all font-medium"
        >
          <Plus size={18} />
          Add Class
        </button>
      </div>

      {isAdding && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
        >
          <form onSubmit={handleAddClass} className="grid grid-cols-1 md:grid-cols-4 gap-5 items-end">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Grade Level</label>
              <select 
                value={newClass.grade}
                onChange={(e) => setNewClass({ ...newClass, grade: parseInt(e.target.value) })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                required
              >
                {[6, 7, 8, 9, 10].map(g => (
                  <option key={g} value={g}>Grade {g}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Section</label>
              <input 
                type="text" 
                placeholder="e.g. A, B, Science"
                value={newClass.section}
                onChange={(e) => setNewClass({ ...newClass, section: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Subjects <span className="text-slate-400 font-normal">(Comma Separated)</span></label>
              <input 
                type="text" 
                placeholder="e.g. Math, Science, English"
                value={newClass.subjects}
                onChange={(e) => setNewClass({ ...newClass, subjects: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors">Save</button>
              <button type="button" onClick={() => setIsAdding(false)} className="px-5 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors">Cancel</button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClassrooms.map((classroom) => (
          <div key={classroom.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-100 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                <GraduationCap size={24} />
              </div>
              <button 
                onClick={() => setConfirmDelete(classroom.id)}
                className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900">Grade {classroom.grade}{classroom.section ? ` (Section ${classroom.section})` : ''}</h3>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {(classroom.subjects || []).map((subject, i) => (
                  <span key={i} className="text-xs font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200/50">
                    {subject}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-500 group-hover:text-blue-600 transition-colors">
                <Users size={16} />
                <span className="text-sm font-medium">Manage Students</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                {classroom.grade}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredClassrooms.length === 0 && !isAdding && (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
          <GraduationCap className="mx-auto text-slate-300 mb-4" size={48} />
          <p className="text-slate-500 font-medium">
            {normalizedSearchTerm ? 'No classrooms match your search.' : 'No classrooms defined yet. Add your first grade level to begin.'}
          </p>
        </div>
      )}
    </div>
  );
}
