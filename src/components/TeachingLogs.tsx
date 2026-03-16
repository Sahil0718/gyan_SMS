import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { TeachingLog, Student, Classroom, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, BookOpen, Calendar, X, Users as UsersIcon, Check, Edit2, Trash2 } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

interface Props {
  profile: UserProfile | null;
  searchTerm: string;
  onSearch: (term: string) => void;
}

export default function TeachingLogs({ profile, searchTerm, onSearch }: Props) {
  const [logs, setLogs] = useState<TeachingLog[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filteredLogs = logs.filter(log => {
    const textMatch = (log.topic || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                      (log.notes || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (log.subject || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const studentMatch = log.studentIds.some(id => {
      const student = students.find(s => s.id === id);
      return (student?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    });
    
    return textMatch || studentMatch;
  });

  const [formData, setFormData] = useState({
    classroomId: '',
    subject: '',
    topic: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
    studentIds: [] as string[]
  });

  useEffect(() => {
    if (!profile?.uid) {
      setLogs([]);
      setStudents([]);
      setClassrooms([]);
      return;
    }

    const q = query(
      collection(db, 'teachingLogs'),
      where('teacherUid', '==', profile.uid)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const logData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeachingLog));
      logData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setLogs(logData);
    });
    const studentsQuery = query(collection(db, 'students'), where('ownerUid', '==', profile.uid));
    const unsubStudents = onSnapshot(studentsQuery, (snap) => {
      setStudents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
    });
    const classesQuery = query(collection(db, 'classrooms'), where('teacherUid', '==', profile.uid));
    const unsubClasses = onSnapshot(classesQuery, (snap) => {
      const classroomData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Classroom));
      classroomData.sort((a, b) => {
        if (a.grade !== b.grade) return a.grade - b.grade;
        return (a.section || '').localeCompare(b.section || '');
      });
      setClassrooms(classroomData);
    });
    return () => {
      unsubscribe();
      unsubStudents();
      unsubClasses();
    };
  }, [profile?.uid]);

  const selectedClass = classrooms.find(c => c.id === formData.classroomId);
  const filteredStudents = students.filter(s => s.classroomId === formData.classroomId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        teacherUid: profile?.uid,
        date: new Date(formData.date).toISOString()
      };

      if (editingId) {
        await updateDoc(doc(db, 'teachingLogs', editingId), payload);
        setLogs((prev) => prev.map((log) => (log.id === editingId ? { ...log, ...payload } as TeachingLog : log)));
      } else {
        const docRef = await addDoc(collection(db, 'teachingLogs'), payload);
        setLogs((prev) => [{ id: docRef.id, ...payload } as TeachingLog, ...prev]);
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ classroomId: '', subject: '', topic: '', notes: '', date: new Date().toISOString().split('T')[0], studentIds: [] });
    } catch (error) {
      console.error("Error saving log:", error);
    }
  };

  const handleEdit = (log: TeachingLog) => {
    setFormData({
      classroomId: (log as any).classroomId || '',
      subject: log.subject || '',
      topic: log.topic || '',
      notes: log.notes || '',
      date: new Date(log.date).toISOString().split('T')[0],
      studentIds: log.studentIds || []
    });
    setEditingId(log.id);
    setIsModalOpen(true);
  };

  const openNewModal = () => {
    setEditingId(null);
    setFormData({ classroomId: '', subject: '', topic: '', notes: '', date: new Date().toISOString().split('T')[0], studentIds: [] });
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteDoc(doc(db, 'teachingLogs', confirmDelete));
      setLogs((prev) => prev.filter((log) => log.id !== confirmDelete));
      setConfirmDelete(null);
    } catch (error) {
      console.error("Error deleting log:", error);
    }
  };

  const toggleStudent = (id: string) => {
    setFormData(prev => ({
      ...prev,
      studentIds: prev.studentIds.includes(id) 
        ? prev.studentIds.filter(sid => sid !== id)
        : [...prev.studentIds, id]
    }));
  };

  return (
    <div className="space-y-6">
      <ConfirmModal 
        isOpen={!!confirmDelete}
        title="Delete Teaching Log"
        message="Are you sure you want to delete this teaching log? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Teaching Documentation</h1>
          <p className="text-slate-500 font-medium mt-1">Maintain regular documentation of teaching activities.</p>
        </div>
        <button 
          onClick={openNewModal}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5 transition-all font-medium"
        >
          <Plus size={18} />
          New Log
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredLogs.map((log) => {
          const logClass = classrooms.find(c => c.id === (log as any).classroomId);
          return (
            <motion.div 
              key={log.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-8">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Session Date</div>
                <div className="text-sm font-bold text-slate-900">{new Date(log.date).toLocaleDateString('en-US', { dateStyle: 'long' })}</div>
                {logClass && (
                  <div className="mt-2.5 text-xs font-medium text-blue-600 bg-blue-50 inline-block px-2.5 py-1 rounded-md">
                    Grade {logClass.grade}{logClass.section ? ` (Section ${logClass.section})` : ''}
                  </div>
                )}
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-100 rounded-lg text-xs font-medium text-red-700">
                  <UsersIcon size={14} className="text-red-500" />
                  {log.studentIds.length} Students
                </div>
              </div>
              
              <div className="flex-1 space-y-4">
                <div>
                  {log.subject && <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{log.subject}</div>}
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-xl font-bold text-slate-900">{log.topic}</h3>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleEdit(log)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Log"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => setConfirmDelete(log.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Log"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{log.notes}</p>
              </div>
            </motion.div>
          );
        })}
        {filteredLogs.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 font-medium">
            No teaching logs recorded yet.
          </div>
        )}
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
              className="relative bg-white w-full max-w-2xl rounded-3xl border border-slate-100 shadow-2xl p-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-display font-bold text-slate-900 tracking-tight">
                  {editingId ? 'Edit Teaching Log' : 'New Teaching Log'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Classroom</label>
                    <select 
                      required
                      value={formData.classroomId}
                      onChange={(e) => {
                        const newClassroomId = e.target.value;
                        const classStudents = students.filter(s => s.classroomId === newClassroomId).map(s => s.id);
                        setFormData({...formData, classroomId: newClassroomId, studentIds: classStudents, subject: ''});
                      }}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    >
                      <option value="">Select Class</option>
                      {classrooms.map(c => (
                        <option key={c.id} value={c.id}>Grade {c.grade}{c.section ? ` (Section ${c.section})` : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Date</label>
                    <input 
                      required
                      type="date" 
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Subject</label>
                    <select 
                      disabled={!selectedClass}
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm disabled:opacity-50 disabled:bg-slate-100"
                    >
                      <option value="">Select Subject</option>
                      {(selectedClass?.subjects || []).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Topic</label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. Introduction to Calculus"
                      value={formData.topic}
                      onChange={(e) => setFormData({...formData, topic: e.target.value})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Session Notes</label>
                  <textarea 
                    required
                    rows={4}
                    placeholder="Document teaching methods, student engagement, and key takeaways..."
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-700">Students Present</label>
                    {formData.classroomId && filteredStudents.length > 0 && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, studentIds: filteredStudents.map(s => s.id) }))}
                          className="text-xs font-medium text-blue-600 hover:text-blue-700"
                        >
                          Select All
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, studentIds: [] }))}
                          className="text-xs font-medium text-slate-500 hover:text-slate-700"
                        >
                          Deselect All
                        </button>
                      </div>
                    )}
                  </div>
                  {!formData.classroomId ? (
                    <p className="text-sm text-slate-400 italic bg-slate-50 p-4 rounded-xl border border-slate-200 border-dashed text-center">Select a classroom first to see students.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 border border-slate-200 rounded-xl bg-slate-50">
                      {filteredStudents.map(student => (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => toggleStudent(student.id)}
                          className={`flex items-center justify-between p-2.5 rounded-lg text-sm font-medium transition-all ${
                            formData.studentIds.includes(student.id) 
                              ? 'bg-blue-600 text-white shadow-sm' 
                              : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                          }`}
                        >
                          <span className="truncate pr-2">{student.name}</span>
                          {formData.studentIds.includes(student.id) && <Check size={14} className="shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-6">
                  <button 
                    type="submit"
                    className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-medium hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5 transition-all"
                  >
                    {editingId ? 'Update Documentation' : 'Save Documentation'}
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
