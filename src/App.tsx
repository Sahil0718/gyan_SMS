import React, { useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User
} from 'firebase/auth';
import {
  collection,
  query,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  orderBy,
  addDoc,
  serverTimestamp,
  getDocFromServer
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, Role } from './types';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  MessageSquare,
  TrendingUp,
  ClipboardList,
  LogOut,
  LogIn,
  Plus,
  Search,
  ChevronRight,
  UserCircle,
  AlertCircle,
  GraduationCap,
  CalendarCheck,
  Book,
  Pencil,
  School
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Components
import Dashboard from './components/Dashboard';
import Students from './components/Students';
import TeachingLogs from './components/TeachingLogs';
import MentoringLogs from './components/MentoringLogs';
import ProgressReports from './components/ProgressReports';
import Reflections from './components/Reflections';
import Classrooms from './components/Classrooms';
import Attendance from './components/Attendance';
import IIDSLogo from './components/IIDSLogo';

type View = 'dashboard' | 'students' | 'teaching' | 'mentoring' | 'progress' | 'reflections' | 'classrooms' | 'attendance';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch or create profile
        const profileRef = doc(db, 'users', currentUser.uid);
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
          setProfile(profileSnap.data() as UserProfile);
        } else {
          const newProfile: UserProfile = {
            uid: currentUser.uid,
            name: currentUser.displayName || 'Anonymous User',
            email: currentUser.email || '',
            role: 'teacher' // Default role
          };
          await setDoc(profileRef, newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Connection Test
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    // Force select account is often better for testing/off the bat experience
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      // In some cloud IDE environments (like Project IDX/Firebase Studio), 
      // popups can be blocked or behave unexpectedly.
      // signInWithPopup is generally fine for desktop, but if it fails,
      // we check for specific environment constraints.
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      // Ignore cancellation errors
      if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        return;
      }
      
      console.error("Login failed:", error);
      
      // If popup is blocked or fails in a way that suggests a redirect might be needed
      if (error.code === 'auth/popup-blocked') {
        alert("Sign-in popup was blocked. Please allow popups for this site or try again.");
      } else {
        alert(`Login failed: ${error.message}. Make sure your domain is added to 'Authorized domains' in Firebase Console.`);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setActiveView('dashboard');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-stone-400 font-mono text-sm tracking-widest uppercase"
        >
          Initializing Gyan Teaching Fellowship...
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-school-grid flex items-center justify-center p-4 relative overflow-hidden">
        {/* Decorative School Elements */}
        <div className="absolute top-10 left-10 text-slate-200 -rotate-12 hidden lg:block">
          <Book size={120} strokeWidth={1} />
        </div>
        <div className="absolute bottom-10 right-10 text-slate-200 rotate-12 hidden lg:block">
          <School size={120} strokeWidth={1} />
        </div>
        <div className="absolute top-1/4 right-20 text-slate-200 rotate-45 hidden lg:block">
          <Pencil size={80} strokeWidth={1} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-white rounded-[2rem] shadow-2xl border-4 border-slate-900 w-full max-w-lg overflow-hidden"
        >
          {/* Top "Folder" Tab */}
          <div className="absolute top-0 left-0 right-0 h-4 bg-slate-900" />

          <div className="p-8 md:p-12">
            <div className="flex flex-col items-center mb-10">
              <div className="flex items-center justify-center mb-6 w-full">
                <IIDSLogo className="h-16 w-auto object-contain" />
              </div>
              <h1 className="text-4xl font-serif font-bold text-slate-900 text-center leading-tight">
                Gyan Teaching <br />
                <span className="text-blue-600 italic">Fellowship</span>
              </h1>
              <div className="h-1 w-20 bg-red-500 mt-4 rounded-full" />
              <p className="text-slate-500 font-mono text-xs uppercase tracking-[0.2em] mt-6">
                Institutional Management System
              </p>
            </div>

            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 mb-10 relative">
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-white border-2 border-amber-200 rounded-full flex items-center justify-center text-amber-500">
                <AlertCircle size={16} />
              </div>
              <p className="text-amber-800 text-sm leading-relaxed font-medium">
                Welcome to the official portal for Gyan Fellows. Please sign in with your institutional Google account to access your teaching logs, student records, and fellowship reflections.
              </p>
            </div>

            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center gap-4 bg-slate-900 text-white py-4 px-8 rounded-2xl hover:bg-blue-600 hover:shadow-[0_6px_0_rgb(30,58,138)] hover:-translate-y-1 active:translate-y-0 active:shadow-none transition-all font-bold text-lg disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none border-2 border-slate-900"
            >
              {isLoggingIn ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn size={24} />
              )}
              {isLoggingIn ? 'Authenticating...' : 'Sign In to Portal'}
            </button>

            <div className="mt-12 flex items-center justify-center gap-6 opacity-40">
              <Book size={20} />
              <div className="w-1 h-1 bg-slate-400 rounded-full" />
              <School size={20} />
              <div className="w-1 h-1 bg-slate-400 rounded-full" />
              <Pencil size={20} />
            </div>
          </div>

          {/* Bottom "Notebook" Edge */}
          <div className="h-2 bg-slate-100 border-t border-slate-200 flex">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="flex-1 border-r border-slate-200" />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'classrooms', label: 'Classrooms', icon: GraduationCap },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'teaching', label: 'Teaching Logs', icon: BookOpen },
    { id: 'mentoring', label: 'Mentoring Logs', icon: MessageSquare },
    { id: 'progress', label: 'Student Progress', icon: TrendingUp },
    { id: 'reflections', label: 'Reflections', icon: ClipboardList },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className={`bg-white border-r border-slate-200 transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-72' : 'w-20'} z-20 relative`}>
        <div className="h-20 flex items-center gap-3 px-6 border-b border-slate-100">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-display font-bold shrink-0 shadow-sm">G</div>
          {isSidebarOpen && <span className="font-display font-bold text-lg text-slate-900 tracking-tight whitespace-nowrap overflow-hidden">Gyan Teaching Fellowship</span>}
        </div>

        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as View)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${activeView === item.id
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              <item.icon size={20} className={activeView === item.id ? 'text-blue-600' : 'text-slate-400'} />
              {isSidebarOpen && <span className="text-sm whitespace-nowrap">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden shrink-0 border border-slate-200">
              {user.photoURL ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" /> : <UserCircle size={24} className="text-slate-400" />}
            </div>
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{profile?.name}</p>
                <p className="text-xs font-medium text-slate-500 capitalize">{profile?.role}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors ${!isSidebarOpen && 'justify-center'}`}
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="text-sm font-medium">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <ChevronRight className={`transition-transform duration-300 ${isSidebarOpen ? 'rotate-180' : ''}`} />
            </button>
            <h2 className="text-xl font-display font-semibold text-slate-900 tracking-tight">
              {navItems.find(i => i.id === activeView)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search records..."
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-64 transition-all"
              />
            </div>
            <div className="text-sm font-medium text-slate-500 hidden sm:block">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-6xl mx-auto"
            >
              {activeView === 'dashboard' && <Dashboard profile={profile} setActiveView={setActiveView} />}
              {activeView === 'classrooms' && <Classrooms profile={profile} />}
              {activeView === 'students' && <Students />}
              {activeView === 'attendance' && <Attendance profile={profile} />}
              {activeView === 'teaching' && <TeachingLogs profile={profile} />}
              {activeView === 'mentoring' && <MentoringLogs profile={profile} />}
              {activeView === 'progress' && <ProgressReports profile={profile} />}
              {activeView === 'reflections' && <Reflections profile={profile} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
