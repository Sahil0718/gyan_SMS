import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Reflection, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, ClipboardList, Calendar, X, Sparkles, Target } from 'lucide-react';

interface Props {
  profile: UserProfile | null;
}

export default function Reflections({ profile }: Props) {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    category: 'teaching' as const,
    content: '',
    improvementPlan: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const q = query(collection(db, 'reflections'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setReflections(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reflection)));
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'reflections'), {
        ...formData,
        userUid: profile?.uid,
        date: new Date(formData.date).toISOString()
      });
      setIsModalOpen(false);
      setFormData({ category: 'teaching', content: '', improvementPlan: '', date: new Date().toISOString().split('T')[0] });
    } catch (error) {
      console.error("Error saving reflection:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Reflection & Review</h1>
          <p className="text-slate-500 font-medium mt-1">Participate in reflection and improvement processes coordinated by Gyan Teaching Fellowship.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5 transition-all font-medium"
        >
          <Plus size={18} />
          New Reflection
        </button>
      </div>

      <div className="space-y-8">
        {reflections.map((reflection) => (
          <motion.div 
            key={reflection.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative pl-8 md:pl-12 border-l-2 border-blue-100"
          >
            <div className="absolute left-[-9px] top-0 w-4 h-4 bg-blue-600 rounded-full ring-4 ring-white" />
            
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
              <div>
                <span className="text-sm font-bold text-slate-900 block mb-1.5">
                  {new Date(reflection.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold uppercase tracking-wider">
                  {reflection.category.replace('-', ' ')}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 space-y-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-red-600">
                  <Sparkles size={18} />
                  <h4 className="text-sm font-bold uppercase tracking-wider">Reflection Content</h4>
                </div>
                <p className="text-slate-700 text-base leading-relaxed whitespace-pre-wrap italic font-serif bg-slate-50 p-5 rounded-xl border border-slate-100">
                  "{reflection.content}"
                </p>
              </div>

              <div className="space-y-3 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-2 text-emerald-600">
                  <Target size={18} />
                  <h4 className="text-sm font-bold uppercase tracking-wider">Improvement Plan</h4>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                  {reflection.improvementPlan}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
        {reflections.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 font-medium">
            No reflections recorded yet.
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
                <h2 className="text-2xl font-display font-bold text-slate-900 tracking-tight">New Reflection</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Category</label>
                    <select 
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value as any})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    >
                      <option value="teaching">Teaching Reflection</option>
                      <option value="mentoring">Mentoring Reflection</option>
                      <option value="process-improvement">Process Improvement</option>
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
                  <label className="text-sm font-semibold text-slate-700">Reflection Content</label>
                  <textarea 
                    required
                    rows={5}
                    placeholder="Reflect on your recent activities, challenges faced, and successes..."
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Improvement Plan</label>
                  <textarea 
                    required
                    rows={3}
                    placeholder="What specific steps will you take to improve?"
                    value={formData.improvementPlan}
                    onChange={(e) => setFormData({...formData, improvementPlan: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none"
                  />
                </div>

                <div className="pt-6">
                  <button 
                    type="submit"
                    className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-medium hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5 transition-all"
                  >
                    Submit Reflection
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
