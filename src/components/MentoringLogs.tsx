import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { MentoringLog, Student, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, MessageSquare, Calendar, X, User } from 'lucide-react';

interface Props {
  profile: UserProfile | null;
}

export default function MentoringLogs({ profile }: Props) {
  const [logs, setLogs] = useState<MentoringLog[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    studentUid: '',
    focusArea: '',
    discussionPoints: '',
    actionItems: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const q = query(collection(db, 'mentoringLogs'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MentoringLog)));
    });
    const unsubStudents = onSnapshot(collection(db, 'students'), (snap) => {
      setStudents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
    });
    const unsubClassrooms = onSnapshot(collection(db, 'classrooms'), (snap) => {
      setClassrooms(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => {
      unsubscribe();
      unsubStudents();
      unsubClassrooms();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'mentoringLogs'), {
        ...formData,
        mentorUid: profile?.uid,
        date: new Date(formData.date).toISOString()
      });
      setIsModalOpen(false);
      setFormData({ studentUid: '', focusArea: '', discussionPoints: '', actionItems: '', date: new Date().toISOString().split('T')[0] });
    } catch (error) {
      console.error("Error saving log:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Mentoring Logs</h1>
          <p className="text-slate-500 font-medium mt-1">Document mentoring sessions and student support.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5 transition-all font-medium"
        >
          <Plus size={18} />
          New Session
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {logs.map((log) => {
          const student = students.find(s => s.id === log.studentUid);
          return (
            <motion.div 
              key={log.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row justify-between gap-6 mb-8 border-b border-slate-100 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 flex items-center justify-center text-blue-600 rounded-full shrink-0">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{student?.name || 'Unknown Student'}</h3>
                    <p className="text-sm font-medium text-slate-500 mt-0.5">
                      {(() => {
                        const c = classrooms.find(cl => cl.id === student?.classroomId);
                        return c ? `Grade ${c.grade}${c.section ? ` (Section ${c.section})` : ''}` : 'Unassigned';
                      })()}
                    </p>
                    <p className="text-sm font-medium text-blue-600 mt-1">{log.focusArea}</p>
                  </div>
                </div>
                <div className="md:text-right flex flex-col justify-center">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Session Date</div>
                  <div className="text-sm font-bold text-slate-900">{new Date(log.date).toLocaleDateString('en-US', { dateStyle: 'medium' })}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2.5">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <MessageSquare size={14} />
                    Discussion Points
                  </h4>
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-100">{log.discussionPoints}</p>
                </div>
                <div className="space-y-2.5">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Calendar size={14} className="text-red-500" />
                    Action Items
                  </h4>
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-100">{log.actionItems}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
        {logs.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 font-medium">
            No mentoring logs recorded yet.
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
                <h2 className="text-2xl font-display font-bold text-slate-900 tracking-tight">New Mentoring Session</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Student</label>
                    <select 
                      required
                      value={formData.studentUid}
                      onChange={(e) => setFormData({...formData, studentUid: e.target.value})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    >
                      <option value="">Select Student</option>
                      {students.map(s => {
                        const c = classrooms.find(cl => cl.id === s.classroomId);
                        return (
                          <option key={s.id} value={s.id}>
                            {s.name} ({c ? `Grade ${c.grade}${c.section ? ` (Section ${c.section})` : ''}` : 'Unassigned'})
                          </option>
                        );
                      })}
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

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Focus Area</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. Career Guidance, Academic Support"
                    value={formData.focusArea}
                    onChange={(e) => setFormData({...formData, focusArea: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Discussion Points</label>
                  <textarea 
                    required
                    rows={4}
                    placeholder="What was discussed during the session?"
                    value={formData.discussionPoints}
                    onChange={(e) => setFormData({...formData, discussionPoints: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Action Items</label>
                  <textarea 
                    required
                    rows={3}
                    placeholder="What are the next steps for the student?"
                    value={formData.actionItems}
                    onChange={(e) => setFormData({...formData, actionItems: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none"
                  />
                </div>

                <div className="pt-6">
                  <button 
                    type="submit"
                    className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-medium hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5 transition-all"
                  >
                    Save Mentoring Log
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
