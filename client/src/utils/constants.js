
export const APP_NAME = 'SkillSwap Campus';

export const API_ENDPOINTS = {
  STUDENTS: '/students',
  REQUESTS: '/requests',
};

export const REQUEST_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
};

export const REQUEST_STATUS_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: REQUEST_STATUS.PENDING },
  { label: 'Accepted', value: REQUEST_STATUS.ACCEPTED },
  { label: 'Declined', value: REQUEST_STATUS.DECLINED },
];

export const SKILL_CATEGORIES = [
  'Programming',
  'Web Development',
  'Mobile App Development',
  'Database Management',
  'UI/UX Design',
  'Graphic Design',
  'Video Editing',
  'Photography',
  'Communication',
  'Mathematics',
  'Languages',
  'Business',
];

export const DEFAULT_PAGE_SIZE = 9;

export const MAX_BIO_LENGTH = 500;

export const MAX_REQUEST_MESSAGE_LENGTH = 500;
