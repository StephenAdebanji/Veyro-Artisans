interface AvailabilityRow {
  workingDays: string[];
  startTime: string | null;
  endTime: string | null;
  emergencyAvailable: boolean;
}

const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export function isAvailableNow(availability: AvailabilityRow | null, now = new Date()): boolean {
  if (!availability) return true;
  if (availability.emergencyAvailable) return true;

  const today = DAY_NAMES[now.getDay()];
  if (!availability.workingDays.includes(today)) return false;
  if (!availability.startTime || !availability.endTime) return true;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const start = toMinutes(availability.startTime);
  const end = toMinutes(availability.endTime);
  return currentMinutes >= start && currentMinutes <= end;
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}
