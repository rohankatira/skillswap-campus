
function normalizeSkills(skills = []) {
  if (!Array.isArray(skills)) return [];

  return [
    ...new Set(
      skills
        .filter((skill) => typeof skill === 'string')
        .map((skill) => skill.trim().toLowerCase())
        .filter(Boolean)
    ),
  ];
}

function getTeachSkills(student) {
  return normalizeSkills(
    student?.teachSkills || student?.skillsToTeach || []
  );
}

function getLearnSkills(student) {
  return normalizeSkills(
    student?.learnSkills || student?.skillsToLearn || []
  );
}

function calculateOverlap(firstSkills, secondSkills) {
  if (firstSkills.length === 0 || secondSkills.length === 0) {
    return 0;
  }

  const secondSet = new Set(secondSkills);

  return firstSkills.filter((skill) => secondSet.has(skill)).length;
}

/**
 * Calculates how well a student can teach another student
 * something they want to learn.
 *
 * Returns a percentage from 0 to 100.
 */
export function calculateOneWayMatch(teacher, learner) {
  const teachSkills = getTeachSkills(teacher);
  const learnSkills = getLearnSkills(learner);

  if (learnSkills.length === 0) return 0;

  const overlap = calculateOverlap(teachSkills, learnSkills);

  return Math.round((overlap / learnSkills.length) * 100);
}

/**
 * Calculates a mutual match between two students.
 * Both students must have skills the other wants to learn.
 */
export function calculateMatchScore(studentA, studentB) {
  const aToB = calculateOneWayMatch(studentA, studentB);
  const bToA = calculateOneWayMatch(studentB, studentA);

  return Math.round((aToB + bToA) / 2);
}

/**
 * Finds skills two students have in common.
 */
export function getCommonSkills(studentA, studentB) {
  const skillsA = getTeachSkills(studentA);
  const skillsB = getTeachSkills(studentB);
  const skillsBSet = new Set(skillsB);

  return skillsA.filter((skill) => skillsBSet.has(skill));
}

/**
 * Finds the skills one student can teach another.
 */
export function getExchangeSkills(teacher, learner) {
  const teachSkills = getTeachSkills(teacher);
  const learnSkills = getLearnSkills(learner);
  const learnSet = new Set(learnSkills);

  return teachSkills.filter((skill) => learnSet.has(skill));
}
