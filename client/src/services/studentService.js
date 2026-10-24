
import { apiRequest } from './api.js';

function unwrapStudentList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.students)) return data.students;
  if (Array.isArray(data?.data)) return data.data;

  return [];
}

export async function getStudents() {
  const data = await apiRequest('/students');
  return unwrapStudentList(data);
}

export async function getStudentById(studentId) {
  if (!studentId) {
    throw new Error('Student ID is required.');
  }

  const data = await apiRequest(
    `/students/${encodeURIComponent(studentId)}`
  );

  return data?.student ?? data?.data ?? data;
}

export async function createStudent(studentData) {
  const data = await apiRequest('/students', {
    method: 'POST',
    body: JSON.stringify(studentData),
  });

  return data?.student ?? data?.data ?? data;
}

// Logged-in user's own profile. Resolves to null if they haven't created one.
export async function getMyProfile() {
  const data = await apiRequest('/students/me');
  return data?.student ?? null;
}

// Create or update the logged-in user's own profile.
export async function saveMyProfile(profileData) {
  const data = await apiRequest('/students/me', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });

  return data?.student ?? null;
}

export async function updateStudent(studentId, studentData) {
  if (!studentId) {
    throw new Error('Student ID is required.');
  }

  const data = await apiRequest(
    `/students/${encodeURIComponent(studentId)}`,
    {
      method: 'PUT',
      body: JSON.stringify(studentData),
    }
  );

  return data?.student ?? data?.data ?? data;
}

export async function deleteStudent(studentId) {
  if (!studentId) {
    throw new Error('Student ID is required.');
  }

  return apiRequest(`/students/${encodeURIComponent(studentId)}`, {
    method: 'DELETE',
  });
}
