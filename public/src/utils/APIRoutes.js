// API Base URL (works for both dev + production)
export const host =
  process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

// AUTH ROUTES
export const loginRoute = `${host}/api/auth/login`;
export const registerRoute = `${host}/api/auth/register`;
export const logoutRoute = `${host}/api/auth/logout`;
export const allUsersRoute = `${host}/api/auth/allusers`;
export const setAvatarRoute = `${host}/api/auth/setavatar`;

// MESSAGE ROUTES
export const sendMessageRoute = `${host}/api/messages/addmsg`;
export const receiveMessageRoute = `${host}/api/messages/getmsg`; // ✅ fixed spelling
export const deleteMessageRoute = `${host}/api/messages/deletemsg`;
export const markAsReadRoute = `${host}/api/messages/markasread`;