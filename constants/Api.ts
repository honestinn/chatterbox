// Base API URL for the backend server
export const API_URL = 'http://localhost:3000';

// API endpoints
export const ENDPOINTS = {
  LOGIN: '/login',
  REGISTER: '/register',
  USERS: '/users',
  CONVERSATIONS: '/conversations',
  CONVERSATION: '/conversations/:id',
  MESSAGES: (conversationId: string) => `/conversations/${conversationId}/messages`,
  READ_MESSAGES: (conversationId: string) => `/conversations/${conversationId}/read`,
  UPLOAD_AVATAR: '/users/avatar',
};