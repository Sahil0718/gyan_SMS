import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { ProgressReport, Student, Classroom, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, TrendingUp, Calendar, X, User, Award } from 'lucide-react';

interface Props {
  profile: UserProfile | null;
}

export default function ProgressReports({ profile }: Props) {
  const [reports, setReports] = useState<ProgressReport[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    studentUid: '',
    academicPerformance: '',
    attendance: 100,
    behavioralNotes: '',
    overallProgress: 'satisfactory' as const,
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const q = query(collection(db, 'progressReports'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setReports(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProgressReport)));
    });
    const unsubStudents = onSnapshot(collection(db, 'students'), (snap) => {
      setStudents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
    });
    const unsubClasses = onSnapshot(collection(db, 'classrooms'), (snap) => {
      setClassrooms(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Classroom)));
    });
    return () => {
      unsubscribe();
      unsubStudents();
      unsubClasses();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'progressReports'), {
        ...formData,
        date: new Date(formData.date).toISOString()
      });
      setIsModalOpen(false);
      setFormData({ studentUid: '', academicPerformance: '', attendance: 100, behavioralNotes: '', overallProgress: 'satisfactory', date: new Date().toISOString().split('T')[0] });
    } catch (error) {
      console.error("Error saving report:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Student Progress</h1>
          <p className="text-slate-500 font-medium mt-1">Track academic standing and behavioral progress.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5 transition-all font-medium"
        >
          <Plus size={18} />
          New Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report) => {
          const student = students.find(s => s.id === report.studentUid);
          const classroom = classrooms.find(c => c.id === student?.classroomId);
          return (
            <motion.div 
              key={report.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 flex items-center justify-center text-blue-600 rounded-full shrink-0">
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{student?.name || 'Unknown Student'}</h3>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">
                      {classroom ? `Grade ${classroom.grade}${classroom.section ? ` (Section ${classroom.section})` : ''}` : 'Unassigned'} • {new Date(report.date).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full ${
                  report.overallProgress === 'excellent' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 
                  report.overallProgress === 'good' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 
                  report.overallProgress === 'satisfactory' ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {report.overallProgress.replace('-', ' ')}
                </span>
              </div>

              <div className="space-y-5">
                <div>
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-slate-500 font-medium">Attendance</span>
                    <span className="font-bold text-slate-900">{report.attendance}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-500 rounded-full ${
                      report.attendance >= 90 ? 'bg-emerald-500' : 
                      report.attendance >= 75 ? 'bg-amber-500' : 'bg-red-500'
                    }`} style={{ width: `${report.attendance}%` }} />
                  </div>
                </div>

                <div className="pt-5 border-t border-slate-100">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Award size={14} className="text-red-500" />
                    Academic Standing
                  </h4>
                  <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">{report.academicPerformance}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
        {reports.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 font-medium">
            No progress reports recorded yet.
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
              className="relative bg-white w-full max-w-xl rounded-3xl border border-slate-100 shadow-2xl p-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-display font-bold text-slate-900 tracking-tight">New Progress Report</h2>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Attendance %</label>
                    <input 
                      required
                      type="number" 
                      min="0"
                      max="100"
                      value={formData.attendance}
                      onChange={(e) => setFormData({...formData, attendance: parseInt(e.target.value)})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Overall Progress</label>
                    <select 
                      value={formData.overallProgress}
                      onChange={(e) => setFormData({...formData, overallProgress: e.target.value as any})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    >
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="satisfactory">Satisfactory</option>
                      <option value="needs-improvement">Needs Improvement</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Academic Standing</label>
                  <textarea 
                    required
                    rows={3}
                    placeholder="Summary of academic performance..."
                    value={formData.academicPerformance}
                    onChange={(e) => setFormData({...formData, academicPerformance: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Behavioral Notes</label>
                  <textarea 
                    rows={3}
                    placeholder="Notes on participation and behavior..."
                    value={formData.behavioralNotes}
                    onChange={(e) => setFormData({...formData, behavioralNotes: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none"
                  />
                </div>

                <div className="pt-6">
                  <button 
                    type="submit"
                    className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-medium hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5 transition-all"
                  >
                    Save Progress Report
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
