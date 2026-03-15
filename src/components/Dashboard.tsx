import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, limit, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Student, TeachingLog, MentoringLog } from '../types';
import { motion } from 'motion/react';
import { 
  Users, 
  BookOpen, 
  MessageSquare, 
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Plus,
  GraduationCap,
  CalendarCheck,
  ChevronRight
} from 'lucide-react';

interface DashboardProps {
  profile: UserProfile | null;
  setActiveView: (view: any) => void;
  searchTerm: string;
  onSearch: (term: string) => void;
}

export default function Dashboard({ profile, setActiveView, searchTerm, onSearch }: DashboardProps) {
  const [stats, setStats] = useState({
    students: 0,
    teachingLogs: 0,
    mentoringLogs: 0,
    classrooms: 0
  });
  const [recentLogs, setRecentLogs] = useState<TeachingLog[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const isSearching = normalizedSearchTerm.length > 0;

  const getSearchableText = (log: TeachingLog) => {
    const studentNames = (log.studentIds || [])
      .map((studentId) => students.find((student) => student.id === studentId)?.name || '')
      .join(' ');

    return [
      log.topic || '',
      log.subject || '',
      log.notes || '',
      studentNames
    ]
      .join(' ')
      .toLowerCase();
  };

  const filteredRecentLogs = recentLogs.filter((log) => getSearchableText(log).includes(normalizedSearchTerm));
  const filteredStudents = students.filter((student) => {
    if (!normalizedSearchTerm) return false;
    const searchable = `${student.name || ''} ${student.studentId || ''} ${student.email || ''}`.toLowerCase();
    return searchable.includes(normalizedSearchTerm);
  });
  const totalSearchResults = filteredRecentLogs.length + filteredStudents.length;
  const visibleLogs = isSearching ? filteredRecentLogs : recentLogs.slice(0, 5);

  useEffect(() => {
    if (!profile?.uid) {
      setStats({ students: 0, teachingLogs: 0, mentoringLogs: 0, classrooms: 0 });
      setRecentLogs([]);
      setStudents([]);
      return;
    }

    const studentsQuery = query(collection(db, 'students'), where('ownerUid', '==', profile.uid));
    const unsubStudentsCount = onSnapshot(studentsQuery, (snap) => {
      setStats(prev => ({ ...prev, students: snap.size }));
    });
    const teachingQuery = query(collection(db, 'teachingLogs'), where('teacherUid', '==', profile.uid));
    const unsubTeaching = onSnapshot(teachingQuery, (snap) => {
      setStats(prev => ({ ...prev, teachingLogs: snap.size }));
    });
    const mentoringQuery = query(collection(db, 'mentoringLogs'), where('mentorUid', '==', profile.uid));
    const unsubMentoring = onSnapshot(mentoringQuery, (snap) => {
      setStats(prev => ({ ...prev, mentoringLogs: snap.size }));
    });
    const classroomsQuery = query(collection(db, 'classrooms'), where('teacherUid', '==', profile.uid));
    const unsubClassrooms = onSnapshot(classroomsQuery, (snap) => {
      setStats(prev => ({ ...prev, classrooms: snap.size }));
    });

    const q = query(
      collection(db, 'teachingLogs'),
      where('teacherUid', '==', profile.uid),
      orderBy('date', 'desc'),
      limit(100)
    );
    const unsubRecent = onSnapshot(q, (snap) => {
      setRecentLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeachingLog)));
    });
    const unsubStudentsList = onSnapshot(studentsQuery, (snap) => {
      setStudents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
    });

    return () => {
      unsubStudentsCount();
      unsubTeaching();
      unsubMentoring();
      unsubClassrooms();
      unsubRecent();
      unsubStudentsList();
    };
  }, [profile?.uid]);

  const cards = [
    { id: 'classrooms', label: 'Classrooms', value: stats.classrooms, icon: GraduationCap, color: 'bg-blue-50 text-blue-600', border: 'border-blue-100' },
    { id: 'students', label: 'Total Students', value: stats.students, icon: Users, color: 'bg-slate-50 text-slate-600', border: 'border-slate-100' },
    { id: 'teaching', label: 'Teaching Sessions', value: stats.teachingLogs, icon: BookOpen, color: 'bg-red-50 text-red-600', border: 'border-red-100' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Welcome back, {profile?.name?.split(' ')[0]}</h1>
        <p className="text-slate-500 font-medium">Here's an overview of the Gyan Teaching Fellowship academic progress and documentation.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, idx) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`bg-white p-6 rounded-2xl border ${card.border} shadow-sm hover:shadow-md transition-all group cursor-pointer`}
            onClick={() => setActiveView(card.id)}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${card.color}`}>
                <card.icon size={24} />
              </div>
              <ArrowUpRight className="text-slate-300 group-hover:text-slate-900 transition-colors" size={20} />
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-slate-900">{card.value}</p>
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-bold text-lg text-slate-900">
              {isSearching ? `Search Results (${totalSearchResults})` : 'Recent Teaching Logs'}
            </h3>
            <button 
              onClick={() => setActiveView(isSearching ? 'students' : 'teaching')}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1"
            >
              {isSearching ? 'View Students' : 'View All'} <ChevronRight size={16} />
            </button>
          </div>
          <div className="space-y-4">
            {isSearching && filteredStudents.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Students</p>
                {filteredStudents.slice(0, 3).map((student) => (
                  <div key={student.id} className="flex gap-4 items-start p-4 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                    <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl shrink-0">
                      <Users size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{student.name}</p>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">
                        ID: {student.studentId || 'N/A'}{student.email ? ` • ${student.email}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isSearching && filteredStudents.length > 0 && filteredRecentLogs.length > 0 && (
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Teaching Logs</p>
            )}

            {visibleLogs.length > 0 ? visibleLogs.map((log) => (
              <div key={log.id} className="flex gap-4 items-start p-4 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                  <Clock size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{log.topic}</p>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">{log.subject} • {new Date(log.date).toLocaleDateString()}</p>
                </div>
                <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full whitespace-nowrap">
                  {log.studentIds.length} Students
                </div>
              </div>
            )) : (
              <div className="text-center py-8">
                <p className="text-sm text-slate-400 font-medium">
                  {isSearching ? 'No matching records found.' : 'No recent activity found.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-slate-900 rounded-2xl p-6 shadow-lg flex flex-col justify-between relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <h3 className="font-display font-bold text-xl text-white mb-2">Quick Actions</h3>
            <p className="text-slate-400 text-sm mb-6 font-medium">Streamline your documentation process.</p>
            
            <div className="space-y-3">
              <button 
                onClick={() => setActiveView('attendance')}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-lg text-white group-hover:bg-red-500 transition-colors">
                    <CalendarCheck size={18} />
                  </div>
                  <span className="text-sm font-medium text-white">Take Daily Attendance</span>
                </div>
                <ChevronRight size={18} className="text-slate-500 group-hover:text-white transition-colors" />
              </button>
              <button 
                onClick={() => setActiveView('teaching')}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-lg text-white group-hover:bg-blue-500 transition-colors">
                    <BookOpen size={18} />
                  </div>
                  <span className="text-sm font-medium text-white">Log New Teaching Session</span>
                </div>
                <Plus size={18} className="text-slate-500 group-hover:text-white transition-colors" />
              </button>
              <button 
                onClick={() => setActiveView('mentoring')}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-lg text-white group-hover:bg-blue-500 transition-colors">
                    <MessageSquare size={18} />
                  </div>
                  <span className="text-sm font-medium text-white">Record Mentoring Session</span>
                </div>
                <Plus size={18} className="text-slate-500 group-hover:text-white transition-colors" />
              </button>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-2 text-emerald-400 relative z-10">
            <CheckCircle2 size={16} />
            <span className="text-xs font-semibold tracking-wide">All systems operational</span>
          </div>
        </div>
      </div>
    </div>
  );
}
