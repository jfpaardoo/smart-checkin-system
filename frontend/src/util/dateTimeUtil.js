/**
 * Formats duration given in total minutes to a localized human-readable string (e.g., '2h 15min' or '45 min').
 *
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration string
 */
export function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '0 min';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hrs > 0 && mins > 0) {
    return `${hrs}h ${mins}min`;
  }
  if (hrs > 0) {
    return `${hrs}h`;
  }
  return `${mins} min`;
}
