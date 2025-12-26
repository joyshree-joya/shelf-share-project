export function getBadgeFromPoints(points) {
  if (points >= 50) return 'gold';
  if (points >= 30) return 'silver';
  if (points >= 10) return 'bronze';
  return 'none';
}
