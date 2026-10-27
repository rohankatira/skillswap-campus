/**
 * roadmapGenerator.js — Generates tailored, structured exchange roadmaps
 * based on the mutual skills of two participating students.
 */

function clean(skills = []) {
  return skills.map((s) => String(s).trim()).filter(Boolean);
}

function findExchangePair(studentA, studentB) {
  const teachA = clean(studentA?.teachSkills || studentA?.skillsToTeach || []);
  const learnA = clean(studentA?.learnSkills || studentA?.skillsToLearn || []);
  const teachB = clean(studentB?.teachSkills || studentB?.skillsToTeach || []);
  const learnB = clean(studentB?.learnSkills || studentB?.skillsToLearn || []);

  const learnBSet = new Set(learnB.map((s) => s.toLowerCase()));
  const learnASet = new Set(learnA.map((s) => s.toLowerCase()));

  // What A can teach B
  const aTeaches = teachA.find((s) => learnBSet.has(s.toLowerCase())) || teachA[0] || 'Technical Skill';
  // What B can teach A
  const bTeaches = teachB.find((s) => learnASet.has(s.toLowerCase())) || teachB[0] || 'Practical Skill';

  return { aTeaches, bTeaches };
}

/**
 * Generates an intelligent 3-session syllabus tailored to two students.
 */
export function generateSwapRoadmap(studentA, studentB) {
  const nameA = studentA?.name || 'Partner A';
  const nameB = studentB?.name || 'Partner B';
  const { aTeaches, bTeaches } = findExchangePair(studentA, studentB);

  return [
    {
      id: 'session-1',
      title: 'Session 1: Foundations & Environment Setup',
      duration: '45 mins',
      completed: false,
      goals: [
        `${nameA} introduces key mental models and setup for ${aTeaches}`,
        `${nameB} walks through essential principles and tools for ${bTeaches}`,
        'Set up development/design environment or study workspace',
      ],
      deliverable: `Working starter template or cheat sheet for both ${aTeaches} & ${bTeaches}`,
    },
    {
      id: 'session-2',
      title: 'Session 2: Core Techniques & Hands-On Practice',
      duration: '50 mins',
      completed: false,
      goals: [
        `Deep dive into intermediate workflows in ${aTeaches} led by ${nameA}`,
        `Practical walkthrough of real-world patterns in ${bTeaches} led by ${nameB}`,
        'Live peer troubleshooting and Q&A on tricky concepts',
      ],
      deliverable: `A mini exercise or working component combining both disciplines`,
    },
    {
      id: 'session-3',
      title: 'Session 3: Live Co-Building & Review',
      duration: '40 mins',
      completed: false,
      goals: [
        `Co-build a small combined portfolio piece or solve an exam challenge together`,
        `Peer code/work review: exchange constructive feedback`,
        'Plan ongoing learning resources and next milestones',
      ],
      deliverable: `Finished mini-project or study summary card ready for portfolio/resume`,
    },
  ];
}
