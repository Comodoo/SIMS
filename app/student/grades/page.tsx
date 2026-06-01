'use client';

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/lib/auth-context';
import { query } from '@/lib/graphql';
import { ChevronDown, GraduationCap, Info } from 'lucide-react';
import { useEffect, useState } from 'react';

const STUDENT_PROFILE_QUERY = `
  query StudentProfile($userId: ID!) {
    studentByUser(userId: $userId) {
      id
    }
  }
`;

const ENROLLMENTS_QUERY = `
  query Enrollments($studentId: ID!) {
    enrollments(studentId: $studentId, limit: 100) {
      id
      semester
      academic_year
      status
      midterm_grade
      final_grade
      letter_grade
      course {
        id
        course_code
        name
        credits
        department
      }
    }
  }
`;

export default function StudentGradesPage() {
  const { user, token } = useAuth();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openYears, setOpenYears] = useState<string[]>([]);

  useEffect(() => {
    if (!user || !token) return;

    const fetchGrades = async () => {
      try {
        const profileRes = await query<any>(STUDENT_PROFILE_QUERY, { userId: user.id }, token);
        const profile = profileRes.studentByUser;
        if (!profile) { setLoading(false); return; }

        const response = await query<any>(ENROLLMENTS_QUERY, { studentId: profile.id }, token);
        setEnrollments(response.enrollments || []);
      } catch (error) {
        console.error('Failed to fetch grades:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
  }, [user, token]);

  // Group enrollments by academic year
  const groupByYear = (enrollments: any[]) => {
    const grouped: Record<string, any[]> = {};
    enrollments.forEach((enrollment) => {
      const year = enrollment.academic_year;
      if (!grouped[year]) {
        grouped[year] = [];
      }
      grouped[year].push(enrollment);
    });
    return grouped;
  };

  // Group enrollments by semester within a year
  const groupBySemester = (enrollments: any[]) => {
    const grouped: Record<string, any[]> = {};
    enrollments.forEach((enrollment) => {
      const semester = enrollment.semester;
      if (!grouped[semester]) {
        grouped[semester] = [];
      }
      grouped[semester].push(enrollment);
    });
    return grouped;
  };

  // Calculate GPA for a set of enrollments
  const calculateGPA = (enrollments: any[]) => {
    const gradeMap: Record<string, number> = { 'A': 4.0, 'B+': 3.5, 'B': 3.0, 'C+': 2.5, 'C': 2.0, 'D': 1.0, 'F': 0.0 };
    const gradedEnrollments = enrollments.filter((e) => e.letter_grade && gradeMap[e.letter_grade]);
    
    if (gradedEnrollments.length === 0) return { gpa: 0, totalCredits: 0, totalGradePoints: 0 };
    
    const totalCredits = gradedEnrollments.reduce((sum, e) => sum + (e.course.credits || 0), 0);
    const totalGradePoints = gradedEnrollments.reduce((sum, e) => {
      const gradeValue = gradeMap[e.letter_grade] || 0;
      return sum + (gradeValue * (e.course.credits || 0));
    }, 0);
    
    const gpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0;
    
    return { gpa, totalCredits, totalGradePoints };
  };

  if (loading) {
    return <div>Loading grades...</div>;
  }

  const groupedByYear = groupByYear(enrollments);
  const years = Object.keys(groupedByYear).sort().reverse();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Grades</h1>
        <p className="text-muted-foreground">View your academic performance and course results</p>
      </div>

      {/* Legend */}
      <div className="flex flex-col items-center mb-8">
        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-3 tracking-widest">Remarks Color Definition</p>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 px-6 py-2 bg-green-100/50 border border-green-200 rounded text-sm font-medium text-green-700">
            <div className="w-3 h-3 bg-green-200 rounded-sm"></div>
            Pass
          </div>
          <div className="flex items-center gap-2 px-6 py-2 bg-red-100/50 border border-red-200 rounded text-sm font-medium text-red-700">
            <div className="w-3 h-3 bg-red-200 rounded-sm"></div>
            Failed
          </div>
          <div className="flex items-center gap-2 px-6 py-2 bg-sky-100/50 border border-sky-200 rounded text-sm font-medium text-sky-700">
            <div className="w-3 h-3 bg-sky-200 rounded-sm"></div>
            Incomplete
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 flex items-center gap-3 mb-8 text-sky-700">
        <Info className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm">Click on an Academic Year and Semester to view your course results.</p>
      </div>

      {/* Years Accordion */}
      <Accordion type="multiple" defaultValue={openYears} className="space-y-4">
        {years.map((year) => {
          const yearEnrollments = groupedByYear[year];
          const { gpa, totalCredits, totalGradePoints } = calculateGPA(yearEnrollments);
          const groupedBySemester = groupBySemester(yearEnrollments);
          const semesters = Object.keys(groupedBySemester).sort();

          return (
            <AccordionItem 
              key={year} 
              value={year} 
              className="bg-white border rounded-lg overflow-hidden shadow-sm"
            >
              <AccordionTrigger className="px-6 py-5 hover:no-underline">
                <div className="flex flex-col items-start gap-1">
                  <h3 className="text-lg font-bold text-slate-800">{year}</h3>
                  <p className="text-xs text-slate-400">Academic Year</p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0 pb-0 border-t">
                {/* Year Summary */}
                <div className="bg-slate-50/50 p-6 flex flex-col items-center border-b">
                   <p className="text-xs uppercase font-bold text-slate-400 mb-4 tracking-wider">Year Result Summary</p>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full max-w-2xl">
                      <div className="bg-white border p-3 flex justify-between items-center rounded">
                        <span className="text-xs font-semibold text-slate-500">Total Credits:</span>
                        <span className="font-bold">{totalCredits.toFixed(1)}</span>
                      </div>
                      <div className="bg-white border p-3 flex justify-between items-center rounded">
                        <span className="text-xs font-semibold text-slate-500">Total Grade Points:</span>
                        <span className="font-bold">{totalGradePoints.toFixed(1)}</span>
                      </div>
                      <div className="bg-white border p-3 flex justify-between items-center rounded">
                        <span className="text-xs font-semibold text-slate-500">GPA:</span>
                        <span className="font-bold">{gpa.toFixed(2)}</span>
                      </div>
                      <div className="bg-white border p-3 flex justify-between items-center rounded">
                        <span className="text-xs font-semibold text-slate-500">Remarks:</span>
                        <Badge className="bg-green-600">Pass</Badge>
                      </div>
                   </div>
                </div>

                {/* Semesters Collapsible/Accordion */}
                <div className="divide-y">
                  {semesters.map((semester) => {
                    const semesterEnrollments = groupedBySemester[semester];
                    
                    return (
                      <div key={semester} className="bg-slate-50/30">
                         <details className="group" open>
                            <summary className="px-8 py-4 cursor-pointer list-none flex items-center justify-between hover:bg-slate-100/50 transition-colors">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-700">{semester}</span>
                                <span className="text-[10px] text-slate-400">{year}</span>
                              </div>
                              <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" />
                            </summary>
                            <div className="px-8 pb-8 pt-2">
                               <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
                                  <Table>
                                    <TableHeader className="bg-slate-50">
                                      <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-12 text-center text-[11px] font-bold uppercase text-slate-500">#</TableHead>
                                        <TableHead className="text-[11px] font-bold uppercase text-slate-500">Course Code</TableHead>
                                        <TableHead className="text-[11px] font-bold uppercase text-slate-500">Course Name</TableHead>
                                        <TableHead className="text-[11px] font-bold uppercase text-slate-500">Course Type</TableHead>
                                        <TableHead className="text-[11px] font-bold uppercase text-slate-500 text-center">Credit</TableHead>
                                        <TableHead className="text-[11px] font-bold uppercase text-slate-500 text-center">Grade</TableHead>
                                        <TableHead className="text-[11px] font-bold uppercase text-slate-500 text-center">Remarks</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {semesterEnrollments.map((enrollment, idx) => (
                                        <TableRow key={enrollment.id} className="hover:bg-slate-50/50">
                                          <TableCell className="text-center text-slate-400 text-xs font-medium">{idx + 1}</TableCell>
                                          <TableCell className="font-bold text-slate-700 text-xs">{enrollment.course.course_code}</TableCell>
                                          <TableCell className="text-slate-600 text-xs uppercase">{enrollment.course.name}</TableCell>
                                          <TableCell className="text-slate-500 text-xs">Core</TableCell>
                                          <TableCell className="text-center font-semibold text-slate-600 text-xs">{enrollment.course.credits.toFixed(1)}</TableCell>
                                          <TableCell className="text-center font-black text-slate-800 text-xs">{enrollment.letter_grade || '-'}</TableCell>
                                          <TableCell className="text-center p-1">
                                             <div className={`py-1.5 rounded text-[10px] font-bold uppercase ${
                                               enrollment.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                             }`}>
                                               {enrollment.status === 'active' ? 'Pass' : 'Incomplete'}
                                             </div>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                               </div>
                            </div>
                         </details>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Footer */}
      <div className="mt-12 pt-8 border-t text-center text-muted-foreground text-[11px] font-medium flex items-center justify-center gap-2">
         <GraduationCap className="w-4 h-4" />
         Copyright © 2026 <span className="text-primary font-bold">SIMS</span> All rights reserved
      </div>
    </div>
  );
}
