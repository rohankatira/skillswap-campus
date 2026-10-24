
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getStudents } from '../services/studentService';

export default function useStudents() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getStudents();
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load students.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load once on mount
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await getStudents();
        if (!cancelled) {
          setStudents(Array.isArray(data) ? data : []);
          setError('');
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load students.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const courses = useMemo(
    () => [...new Set(students.map((s) => s.course).filter(Boolean))],
    [students]
  );

  const skills = useMemo(() => {
    const all = students.flatMap((s) => [
      ...(s.teachSkills || s.skillsToTeach || []),
      ...(s.learnSkills || s.skillsToLearn || []),
    ]);
    return [...new Set(all)].sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return students.filter((student) => {
      const teachSkills = student.teachSkills || student.skillsToTeach || [];
      const learnSkills = student.learnSkills || student.skillsToLearn || [];

      const matchesSearch =
        !query ||
        [student.name, student.course, student.bio, ...teachSkills, ...learnSkills]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(query));

      const matchesCourse = !selectedCourse || student.course === selectedCourse;

      const matchesSkill =
        !selectedSkill ||
        [...teachSkills, ...learnSkills].some(
          (sk) => String(sk).toLowerCase() === selectedSkill.toLowerCase()
        );

      return matchesSearch && matchesCourse && matchesSkill;
    });
  }, [students, search, selectedCourse, selectedSkill]);

  const clearFilters = useCallback(() => {
    setSearch('');
    setSelectedCourse('');
    setSelectedSkill('');
  }, []);

  return {
    students,
    filteredStudents,
    courses,
    skills,
    search,
    setSearch,
    selectedCourse,
    setSelectedCourse,
    selectedSkill,
    setSelectedSkill,
    loading,
    error,
    refreshStudents: fetchStudents,
    clearFilters,
  };
}
