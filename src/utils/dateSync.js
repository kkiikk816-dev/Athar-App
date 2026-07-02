// Simple utility to format dates for filtering
export const getCurrentHijriDateStr = () => {
  const date = new Date();
  const options = { calendar: 'islamic', day: '2-digit', month: '2-digit' };
  const formatter = new Intl.DateTimeFormat('en-US', options);
  // Example output: "01/10" (month/day) depending on locale
  const parts = formatter.formatToParts(date);
  const day = parts.find(p => p.type === 'day')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  
  if (day && month) {
     return `${day}-${month}`;
  }
  return "";
};

export const getCurrentWeekday = () => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date().getDay()];
};
