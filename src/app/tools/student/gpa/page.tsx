"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calculator,
  Plus,
  Trash2,
  RotateCcw,
  ChevronRight,
  Shield,
  CalendarCheck,
  AlignLeft,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";

interface Course {
  id: string;
  name: string;
  credits: number;
  gradePoint: number;
}

interface Semester {
  id: string;
  name: string;
  sgpa: number;
  credits: number;
}

const gradeOptions = [
  { label: "O / Outstanding (10)", points: 10 },
  { label: "A+ / Excellent (9)", points: 9 },
  { label: "A / Very Good (8)", points: 8 },
  { label: "B+ / Good (7)", points: 7 },
  { label: "B / Above Average (6)", points: 6 },
  { label: "C / Average (5)", points: 5 },
  { label: "P / Pass (4)", points: 4 },
  { label: "F / Fail (0)", points: 0 },
];

export default function GpaCalculatorPage() {
  const [activeTab, setActiveTab] = useState<"sgpa" | "cgpa" | "converter">("sgpa");

  // SGPA state
  const [courses, setCourses] = useState<Course[]>([
    { id: "1", name: "Data Structures & Algorithms", credits: 4, gradePoint: 10 },
    { id: "2", name: "Computer Networks", credits: 3, gradePoint: 9 },
    { id: "3", name: "Database Management Systems", credits: 4, gradePoint: 8 },
    { id: "4", name: "Software Engineering", credits: 3, gradePoint: 9 },
    { id: "5", name: "Humanities & Professional Ethics", credits: 2, gradePoint: 8 },
  ]);

  // CGPA state
  const [semesters, setSemesters] = useState<Semester[]>([
    { id: "1", name: "Semester 1", sgpa: 8.8, credits: 22 },
    { id: "2", name: "Semester 2", sgpa: 9.1, credits: 24 },
    { id: "3", name: "Semester 3", sgpa: 8.9, credits: 23 },
    { id: "4", name: "Semester 4", sgpa: 9.3, credits: 25 },
  ]);

  // Converter state
  const [gpaInput, setGpaInput] = useState<number>(8.5);
  const [formulaType, setFormulaType] = useState<"9.5" | "10" | "aicte">("9.5");

  // SGPA Calculation
  const totalSgpaCredits = courses.reduce((sum, c) => sum + c.credits, 0);
  const totalSgpaPoints = courses.reduce((sum, c) => sum + c.credits * c.gradePoint, 0);
  const calculatedSgpa = totalSgpaCredits > 0 ? (totalSgpaPoints / totalSgpaCredits).toFixed(2) : "0.00";

  // CGPA Calculation
  const totalCgpaCredits = semesters.reduce((sum, s) => sum + s.credits, 0);
  const totalCgpaPoints = semesters.reduce((sum, s) => sum + s.sgpa * s.credits, 0);
  const calculatedCgpa = totalCgpaCredits > 0 ? (totalCgpaPoints / totalCgpaCredits).toFixed(2) : "0.00";

  // Percentage conversion calculation
  const getConvertedPercentage = () => {
    if (formulaType === "9.5") return (gpaInput * 9.5).toFixed(1);
    if (formulaType === "10") return (gpaInput * 10).toFixed(1);
    // AICTE: (GPA - 0.75) * 10
    return Math.max(0, (gpaInput - 0.75) * 10).toFixed(1);
  };

  const addCourse = () => {
    setCourses((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: `Course ${prev.length + 1}`,
        credits: 3,
        gradePoint: 8,
      },
    ]);
  };

  const removeCourse = (id: string) => {
    if (courses.length <= 1) return;
    setCourses((prev) => prev.filter((c) => c.id !== id));
  };

  const addSemester = () => {
    setSemesters((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: `Semester ${prev.length + 1}`,
        sgpa: 8.5,
        credits: 22,
      },
    ]);
  };

  const removeSemester = (id: string) => {
    if (semesters.length <= 1) return;
    setSemesters((prev) => prev.filter((s) => s.id !== id));
  };

  const relatedTools = [
    { name: "Attendance Calculator", href: "/tools/student/attendance", icon: CalendarCheck },
    { name: "Word Counter", href: "/tools/student/word-counter", icon: AlignLeft },
  ];

  return (
    <>
      <Header />
      <main className="flex-1 max-w-[1200px] mx-auto px-6 py-10 w-full">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Student Tools", href: "/tools/student" },
            { label: "CGPA & SGPA Calculator" },
          ]}
        />

        <div className="mt-6 mb-8">
          <div
            className="flex items-center gap-2 mb-2 font-body text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--amber-primary)" }}
          >
            <Calculator size={16} />
            <span>Student Tool</span>
          </div>
          <h1
            className="font-headline font-bold text-3xl sm:text-4xl tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            CGPA & SGPA Calculator
          </h1>
          <p
            className="font-body text-base sm:text-lg mt-2 max-w-2xl"
            style={{ color: "var(--text-secondary)" }}
          >
            Calculate semester SGPA, cumulative CGPA across semesters, and percentage conversions with precision.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Mode Switcher */}
            <div
              className="flex items-center gap-2 p-1.5 rounded-xl border overflow-x-auto scrollbar-none"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              {[
                { id: "sgpa", label: "Semester SGPA" },
                { id: "cgpa", label: "Cumulative CGPA" },
                { id: "converter", label: "GPA to Percentage" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as "sgpa" | "cgpa" | "converter")}
                  className="px-4 py-2 rounded-lg font-body text-sm font-medium transition-all shrink-0"
                  style={{
                    backgroundColor: activeTab === tab.id ? "var(--amber-tint)" : "transparent",
                    color: activeTab === tab.id ? "var(--amber-primary)" : "var(--text-secondary)",
                    border: activeTab === tab.id ? "1px solid var(--amber-primary)" : "1px solid transparent",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB 1: SGPA */}
            {activeTab === "sgpa" && (
              <div
                className="rounded-xl border p-6 flex flex-col gap-6"
                style={{
                  backgroundColor: "var(--surface)",
                  borderColor: "var(--border-warm)",
                }}
              >
                {/* Result Card */}
                <div
                  className="p-6 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4"
                  style={{
                    backgroundColor: "var(--surface-tinted)",
                    borderColor: "var(--border-warm)",
                  }}
                >
                  <div>
                    <p className="font-body text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                      Calculated Semester SGPA
                    </p>
                    <p className="font-headline font-bold text-4xl mt-1" style={{ color: "var(--amber-primary)" }}>
                      {calculatedSgpa}
                    </p>
                    <p className="font-body text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                      Total Credits: {totalSgpaCredits} · Points Earned: {totalSgpaPoints}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={addCourse}
                      className="px-4 py-2.5 rounded-lg font-body font-semibold text-xs text-white flex items-center gap-1.5 transition-transform hover:scale-105"
                      style={{ backgroundColor: "var(--amber-primary)" }}
                    >
                      <Plus size={14} />
                      <span>Add Course</span>
                    </button>
                    <button
                      onClick={() =>
                        setCourses([
                          { id: "1", name: "Course 1", credits: 3, gradePoint: 10 },
                          { id: "2", name: "Course 2", credits: 3, gradePoint: 9 },
                        ])
                      }
                      className="p-2.5 rounded-lg border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      style={{ borderColor: "var(--border-warm)", color: "var(--text-secondary)" }}
                      title="Reset courses"
                    >
                      <RotateCcw size={16} />
                    </button>
                  </div>
                </div>

                {/* Courses Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-body text-sm">
                    <thead>
                      <tr className="border-b text-xs font-semibold uppercase" style={{ borderColor: "var(--border-warm)", color: "var(--text-muted)" }}>
                        <th className="pb-3 px-2">Course Name</th>
                        <th className="pb-3 px-2 w-28">Credits</th>
                        <th className="pb-3 px-2 w-56">Grade Obtained</th>
                        <th className="pb-3 px-2 w-12 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: "var(--border-warm)" }}>
                      {courses.map((course) => (
                        <tr key={course.id} className="group">
                          <td className="py-3 px-2">
                            <input
                              type="text"
                              value={course.name}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCourses((prev) => prev.map((c) => (c.id === course.id ? { ...c, name: val } : c)));
                              }}
                              placeholder="Course title"
                              className="w-full px-2.5 py-1.5 rounded border font-body text-sm focus:outline-none"
                              style={{
                                backgroundColor: "var(--bg-warm)",
                                borderColor: "var(--border-warm)",
                                color: "var(--text-primary)",
                              }}
                            />
                          </td>
                          <td className="py-3 px-2">
                            <input
                              type="number"
                              min={1}
                              max={10}
                              value={course.credits}
                              onChange={(e) => {
                                const val = Math.max(1, parseInt(e.target.value) || 1);
                                setCourses((prev) => prev.map((c) => (c.id === course.id ? { ...c, credits: val } : c)));
                              }}
                              className="w-20 px-2.5 py-1.5 rounded border font-body text-sm focus:outline-none"
                              style={{
                                backgroundColor: "var(--bg-warm)",
                                borderColor: "var(--border-warm)",
                                color: "var(--text-primary)",
                              }}
                            />
                          </td>
                          <td className="py-3 px-2">
                            <select
                              value={course.gradePoint}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setCourses((prev) => prev.map((c) => (c.id === course.id ? { ...c, gradePoint: val } : c)));
                              }}
                              className="w-full px-2.5 py-1.5 rounded border font-body text-sm focus:outline-none"
                              style={{
                                backgroundColor: "var(--bg-warm)",
                                borderColor: "var(--border-warm)",
                                color: "var(--text-primary)",
                              }}
                            >
                              {gradeOptions.map((opt) => (
                                <option key={opt.points} value={opt.points}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3 px-2 text-right">
                            <button
                              onClick={() => removeCourse(course.id)}
                              disabled={courses.length <= 1}
                              className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 disabled:opacity-20"
                              title="Delete course"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: CGPA */}
            {activeTab === "cgpa" && (
              <div
                className="rounded-xl border p-6 flex flex-col gap-6"
                style={{
                  backgroundColor: "var(--surface)",
                  borderColor: "var(--border-warm)",
                }}
              >
                <div
                  className="p-6 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4"
                  style={{
                    backgroundColor: "var(--surface-tinted)",
                    borderColor: "var(--border-warm)",
                  }}
                >
                  <div>
                    <p className="font-body text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                      Cumulative CGPA
                    </p>
                    <p className="font-headline font-bold text-4xl mt-1" style={{ color: "var(--amber-primary)" }}>
                      {calculatedCgpa}
                    </p>
                    <p className="font-body text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                      Total Credits Completed: {totalCgpaCredits}
                    </p>
                  </div>

                  <button
                    onClick={addSemester}
                    className="px-4 py-2.5 rounded-lg font-body font-semibold text-xs text-white flex items-center gap-1.5 transition-transform hover:scale-105"
                    style={{ backgroundColor: "var(--amber-primary)" }}
                  >
                    <Plus size={14} />
                    <span>Add Semester</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-body text-sm">
                    <thead>
                      <tr className="border-b text-xs font-semibold uppercase" style={{ borderColor: "var(--border-warm)", color: "var(--text-muted)" }}>
                        <th className="pb-3 px-2">Semester</th>
                        <th className="pb-3 px-2 w-32">SGPA Obtained</th>
                        <th className="pb-3 px-2 w-32">Total Credits</th>
                        <th className="pb-3 px-2 w-12 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: "var(--border-warm)" }}>
                      {semesters.map((sem) => (
                        <tr key={sem.id} className="group">
                          <td className="py-3 px-2">
                            <input
                              type="text"
                              value={sem.name}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSemesters((prev) => prev.map((s) => (s.id === sem.id ? { ...s, name: val } : s)));
                              }}
                              className="w-full px-2.5 py-1.5 rounded border font-body text-sm focus:outline-none"
                              style={{
                                backgroundColor: "var(--bg-warm)",
                                borderColor: "var(--border-warm)",
                                color: "var(--text-primary)",
                              }}
                            />
                          </td>
                          <td className="py-3 px-2">
                            <input
                              type="number"
                              step="0.01"
                              min={0}
                              max={10}
                              value={sem.sgpa}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setSemesters((prev) => prev.map((s) => (s.id === sem.id ? { ...s, sgpa: val } : s)));
                              }}
                              className="w-24 px-2.5 py-1.5 rounded border font-body text-sm focus:outline-none"
                              style={{
                                backgroundColor: "var(--bg-warm)",
                                borderColor: "var(--border-warm)",
                                color: "var(--text-primary)",
                              }}
                            />
                          </td>
                          <td className="py-3 px-2">
                            <input
                              type="number"
                              min={1}
                              value={sem.credits}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 1;
                                setSemesters((prev) => prev.map((s) => (s.id === sem.id ? { ...s, credits: val } : s)));
                              }}
                              className="w-24 px-2.5 py-1.5 rounded border font-body text-sm focus:outline-none"
                              style={{
                                backgroundColor: "var(--bg-warm)",
                                borderColor: "var(--border-warm)",
                                color: "var(--text-primary)",
                              }}
                            />
                          </td>
                          <td className="py-3 px-2 text-right">
                            <button
                              onClick={() => removeSemester(sem.id)}
                              disabled={semesters.length <= 1}
                              className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 disabled:opacity-20"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: Converter */}
            {activeTab === "converter" && (
              <div
                className="rounded-xl border p-6 flex flex-col gap-6"
                style={{
                  backgroundColor: "var(--surface)",
                  borderColor: "var(--border-warm)",
                }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
                  <div>
                    <label htmlFor="gpa-input" className="block font-body text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
                      Enter CGPA / SGPA (10-Point Scale)
                    </label>
                    <input
                      id="gpa-input"
                      type="number"
                      step="0.01"
                      min={0}
                      max={10}
                      value={gpaInput}
                      onChange={(e) => setGpaInput(Math.min(10, Math.max(0, parseFloat(e.target.value) || 0)))}
                      className="w-full px-3.5 py-2.5 rounded-lg border font-body text-lg font-semibold focus:outline-none"
                      style={{
                        backgroundColor: "var(--bg-warm)",
                        borderColor: "var(--border-warm)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>

                  <div>
                    <label htmlFor="formula-select" className="block font-body text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
                      Conversion Formula
                    </label>
                    <select
                      id="formula-select"
                      value={formulaType}
                      onChange={(e) => setFormulaType(e.target.value as "9.5" | "10" | "aicte")}
                      className="w-full px-3.5 py-2.5 rounded-lg border font-body text-sm focus:outline-none"
                      style={{
                        backgroundColor: "var(--bg-warm)",
                        borderColor: "var(--border-warm)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <option value="9.5">Standard CBSE/University (CGPA × 9.5)</option>
                      <option value="10">Direct Percentage (CGPA × 10)</option>
                      <option value="aicte">AICTE Standard ((CGPA - 0.75) × 10)</option>
                    </select>
                  </div>
                </div>

                {/* Percentage result */}
                <div
                  className="p-8 rounded-xl border text-center"
                  style={{
                    backgroundColor: "var(--surface-tinted)",
                    borderColor: "var(--border-warm)",
                  }}
                >
                  <p className="font-body text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    Equivalent Percentage
                  </p>
                  <p className="font-headline font-bold text-5xl sm:text-6xl mt-2" style={{ color: "var(--amber-primary)" }}>
                    {getConvertedPercentage()}%
                  </p>
                  <p className="font-body text-sm mt-3" style={{ color: "var(--text-secondary)" }}>
                    Calculated using {formulaType === "9.5" ? "CGPA × 9.5" : formulaType === "10" ? "CGPA × 10" : "(CGPA - 0.75) × 10"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div
              className="rounded-xl border p-6"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <h3 className="font-headline font-semibold text-lg mb-4" style={{ color: "var(--text-primary)" }}>
                Standard Grading Scale
              </h3>
              <div className="space-y-2 font-body text-xs" style={{ color: "var(--text-secondary)" }}>
                <div className="flex justify-between py-1 border-b" style={{ borderColor: "var(--border-warm)" }}>
                  <span className="font-medium text-[var(--text-primary)]">O (Outstanding)</span>
                  <span className="font-semibold text-[var(--amber-primary)]">10 Points</span>
                </div>
                <div className="flex justify-between py-1 border-b" style={{ borderColor: "var(--border-warm)" }}>
                  <span className="font-medium text-[var(--text-primary)]">A+ (Excellent)</span>
                  <span className="font-semibold text-[var(--amber-primary)]">9 Points</span>
                </div>
                <div className="flex justify-between py-1 border-b" style={{ borderColor: "var(--border-warm)" }}>
                  <span className="font-medium text-[var(--text-primary)]">A (Very Good)</span>
                  <span className="font-semibold text-[var(--amber-primary)]">8 Points</span>
                </div>
                <div className="flex justify-between py-1 border-b" style={{ borderColor: "var(--border-warm)" }}>
                  <span className="font-medium text-[var(--text-primary)]">B+ (Good)</span>
                  <span className="font-semibold text-[var(--amber-primary)]">7 Points</span>
                </div>
                <div className="flex justify-between py-1 border-b" style={{ borderColor: "var(--border-warm)" }}>
                  <span className="font-medium text-[var(--text-primary)]">B (Above Average)</span>
                  <span className="font-semibold text-[var(--amber-primary)]">6 Points</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="font-medium text-[var(--text-primary)]">C / P (Pass)</span>
                  <span className="font-semibold text-[var(--amber-primary)]">4-5 Points</span>
                </div>
              </div>
            </div>

            <div
              className="rounded-xl border p-6"
              style={{
                backgroundColor: "var(--amber-tint)",
                borderColor: "rgba(200, 123, 58, 0.25)",
              }}
            >
              <div className="flex items-center gap-2 mb-2 font-headline font-semibold text-base" style={{ color: "var(--amber-primary)" }}>
                <Shield size={18} />
                <h4>Privacy Safe</h4>
              </div>
              <p className="font-body text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                All academic records and course scores remain exclusively in your local session. Nothing is ever sent to or stored on a database.
              </p>
            </div>

            <div
              className="rounded-xl border p-6"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <h3 className="font-headline font-semibold text-base mb-4" style={{ color: "var(--text-primary)" }}>
                Related Student Tools
              </h3>
              <div className="divide-y" style={{ borderColor: "var(--border-warm)" }}>
                {relatedTools.map((tool) => {
                  const ToolIcon = tool.icon;
                  return (
                    <Link
                      key={tool.name}
                      href={tool.href}
                      className="py-3 flex items-center justify-between group transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <ToolIcon size={16} style={{ color: "var(--amber-primary)" }} />
                        <span
                          className="font-body text-sm group-hover:text-[var(--amber-primary)] transition-colors"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {tool.name}
                        </span>
                      </div>
                      <ChevronRight
                        size={16}
                        className="transition-transform group-hover:translate-x-0.5"
                        style={{ color: "var(--text-muted)" }}
                      />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
