export function formatDuration(minutes) {
  if (!Number.isInteger(minutes) || minutes < 0) {
    throw new TypeError('minutes must be a non-negative integer');
  }

  return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
}
