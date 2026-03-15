import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Classroom, Student, AttendanceRecord, UserProfile } from '../types';
import { Calendar, Check, X, Clock, Save, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import Toast from './Toast';

interface AttendanceProps {
  profile: UserProfile | null;
  searchTerm: string;
}

export default function Attendance({ profile, searchTerm }: AttendanceProps) {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClass, setSelectedClass] = useState<Classroom | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<{ [studentId: string]: 'present' | 'absent' | 'late' }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [existingRecordId, setExistingRecordId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!profile?.uid) {
      setClassrooms([]);
      return;
    }

    const classroomsQuery = query(collection(db, 'classrooms'), where('teacherUid', '==', profile.uid));
    const unsubscribe = onSnapshot(classroomsQuery, (snap) => {
      const classroomData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Classroom));
      classroomData.sort((a, b) => {
        if (a.grade !== b.grade) return a.grade - b.grade;
        return (a.section || '').localeCompare(b.section || '');
      });
      setClassrooms(classroomData);
    });
    return () => unsubscribe();
  }, [profile?.uid]);

  useEffect(() => {
    if (selectedClass && profile?.uid) {
      const q = query(
        collection(db, 'students'),
        where('classroomId', '==', selectedClass.id),
        where('ownerUid', '==', profile.uid)
      );
      const unsubscribe = onSnapshot(q, (snap) => {
        const classStudents = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
        // Sort students alphabetically by name
        classStudents.sort((a, b) => a.name.localeCompare(b.name));
        setStudents(classStudents);
        
        // Initialize attendance if not already set by existing record
        if (!existingRecordId) {
          const initial: { [studentId: string]: 'present' | 'absent' | 'late' } = {};
          classStudents.forEach(s => initial[s.id] = 'present');
          setAttendance(initial);
        }
      });
      return () => unsubscribe();
    }
  }, [selectedClass, existingRecordId, profile?.uid]);

  useEffect(() => {
    async function checkExisting() {
      if (selectedClass && date && profile?.uid) {
        const q = query(
          collection(db, 'attendance'), 
          where('classroomId', '==', selectedClass.id),
          where('date', '==', date),
          where('teacherUid', '==', profile.uid)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const record = snap.docs[0].data() as AttendanceRecord;
          setAttendance(record.statuses);
          setExistingRecordId(snap.docs[0].id);
        } else {
          setExistingRecordId(null);
          // Reset to default present for new record
          const initial: { [studentId: string]: 'present' | 'absent' | 'late' } = {};
          students.forEach(s => initial[s.id] = 'present');
          setAttendance(initial);
        }
      }
    }
    checkExisting();
  }, [selectedClass, date, students.length, profile?.uid]);

  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSave = async () => {
    if (!selectedClass || !profile) return;
    setIsSaving(true);
    try {
      if (existingRecordId) {
        await updateDoc(doc(db, 'attendance', existingRecordId), {
          statuses: attendance,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'attendance'), {
          classroomId: selectedClass.id,
          date,
          statuses: attendance,
          teacherUid: profile.uid,
          createdAt: serverTimestamp()
        });
      }
      setShowToast(true);
    } catch (error) {
      console.error("Error saving attendance:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredStudents = students.filter((student) => {
    if (!normalizedSearchTerm) return true;
    const searchable = `${student.name || ''} ${student.studentId || ''}`.toLowerCase();
    return searchable.includes(normalizedSearchTerm);
  });

  return (
    <div className="space-y-6">
      <Toast 
        isVisible={showToast} 
        message="Attendance recorded successfully" 
        onClose={() => setShowToast(false)} 
      />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Attendance</h1>
          <p className="text-slate-500 font-medium mt-1">Track daily presence for your classrooms.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium text-slate-700 shadow-sm transition-all"
          />
          <select 
            value={selectedClass?.id || ''}
            onChange={(e) => setSelectedClass(classrooms.find(c => c.id === e.target.value) || null)}
            className="p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium text-slate-700 shadow-sm transition-all min-w-[200px]"
          >
            <option value="">Select Classroom</option>
            {classrooms.map(c => (
              <option key={c.id} value={c.id}>Grade {c.grade}{c.section ? ` (Section ${c.section})` : ''}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedClass ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                {selectedClass.grade}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Grade {selectedClass.grade}{selectedClass.section ? ` (Section ${selectedClass.section})` : ''}</h3>
                <p className="text-sm font-medium text-slate-500 mt-0.5">
                  {filteredStudents.length} Students • {new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(selectedClass.subjects || []).map((s, i) => (
                    <span key={i} className="text-xs font-medium bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md shadow-sm">{s}</span>
                  ))}
                </div>
              </div>
            </div>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none font-medium"
            >
              <Save size={18} />
              {isSaving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student Name</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-semibold text-slate-900">{student.name}</td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-500">{student.studentId}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-3">
                        <button 
                          onClick={() => handleStatusChange(student.id, 'present')}
                          className={`p-2.5 rounded-xl transition-all ${attendance[student.id] === 'present' ? 'bg-emerald-100 text-emerald-700 shadow-sm ring-1 ring-emerald-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 border border-slate-200'}`}
                          title="Present"
                        >
                          <Check size={18} className={attendance[student.id] === 'present' ? 'stroke-[3px]' : ''} />
                        </button>
                        <button 
                          onClick={() => handleStatusChange(student.id, 'late')}
                          className={`p-2.5 rounded-xl transition-all ${attendance[student.id] === 'late' ? 'bg-amber-100 text-amber-700 shadow-sm ring-1 ring-amber-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 border border-slate-200'}`}
                          title="Late"
                        >
                          <Clock size={18} className={attendance[student.id] === 'late' ? 'stroke-[3px]' : ''} />
                        </button>
                        <button 
                          onClick={() => handleStatusChange(student.id, 'absent')}
                          className={`p-2.5 rounded-xl transition-all ${attendance[student.id] === 'absent' ? 'bg-red-100 text-red-700 shadow-sm ring-1 ring-red-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 border border-slate-200'}`}
                          title="Absent"
                        >
                          <X size={18} className={attendance[student.id] === 'absent' ? 'stroke-[3px]' : ''} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredStudents.length === 0 && (
            <div className="p-20 text-center">
              <p className="text-slate-500 font-medium">
                {normalizedSearchTerm ? 'No students match your search in this classroom.' : 'No students found in this classroom.'}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
          <Calendar className="mx-auto text-slate-300 mb-4" size={48} />
          <p className="text-slate-500 font-medium">Select a classroom to begin taking attendance.</p>
        </div>
      )}
    </div>
  );
}
