export type Role = 'teacher' | 'mentor' | 'admin';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: Role;
}

export interface Student {
  id: string;
  name: string;
  email?: string;
  studentId: string;
  classroomId: string;
  status: 'active' | 'graduated' | 'inactive';
}

export interface Classroom {
  id: string;
  grade: number; // 6-10
  section: string;
  subjects: string[];
  teacherUid: string;
}

export interface AttendanceRecord {
  id: string;
  classroomId: string;
  date: string;
  statuses: { [studentId: string]: 'present' | 'absent' | 'late' };
  notes?: string;
}

export interface TeachingLog {
  id: string;
  teacherUid: string;
  date: string;
  subject: string;
  topic: string;
  notes: string;
  studentIds: string[];
}

export interface MentoringLog {
  id: string;
  mentorUid: string;
  studentUid: string;
  date: string;
  focusArea: string;
  discussionPoints: string;
  actionItems: string;
}

export interface ProgressReport {
  id: string;
  studentUid: string;
  date: string;
  academicPerformance: string;
  attendance: number;
  behavioralNotes: string;
  overallProgress: 'excellent' | 'good' | 'satisfactory' | 'needs-improvement';
}

export interface Reflection {
  id: string;
  userUid: string;
  date: string;
  category: 'teaching' | 'mentoring' | 'process-improvement';
  content: string;
  improvementPlan: string;
}
