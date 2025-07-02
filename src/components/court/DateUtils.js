export const formatTime = (time) => {
  if (!time) return '';
  
  // Handle full time strings (HH:mm:ss)
  const timeParts = time.split(':');
  const hours = parseInt(timeParts[0]);
  const minutes = timeParts[1];
  
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  
  return `${displayHours}:${minutes} ${period}`;
};

// Add this new function for backend-compatible time parsing
export const parseBackendTime = (time) => {
  if (!time) return '';
  return time.substring(0, 5); // Extract HH:mm from HH:mm:ss
};

// Format date to short format (MON 23)
export const formatDateShort = (date) => {
  const shortDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const day = date.getDay();
  const dateNum = date.getDate();
  return `${shortDays[day]} ${dateNum}`;
};

// Format date to long format (Thursday, June 26, 2025)
export const formatDateLong = (date) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const day = date.getDay();
  const month = date.getMonth();
  const dateNum = date.getDate();
  const year = date.getFullYear();
  
  return `${days[day]}, ${months[month]} ${dateNum}, ${year}`;
};

// Format date to M/D/YYYY (6/26/2025)
export const formatDateNumeric = (date) => {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};