export const isValidIsoDate = (isoDate: string) => {
  const selected = new Date(`${isoDate}T00:00:00`);
  return !Number.isNaN(selected.getTime());
};

export const isWeekday = (isoDate: string) => {
  const selected = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(selected.getTime())) return false;
  const day = selected.getDay();
  return day !== 0 && day !== 6;
};

export const isTomorrowOrLater = (isoDate: string) => {
  const selected = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(selected.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return selected >= tomorrow;
};

