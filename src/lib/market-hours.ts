/**
 * Determines if the US stock market (NYSE/NASDAQ) is currently open.
 * Hours: Monday-Friday, 9:30 AM - 4:00 PM Eastern Time.
 * Does not account for US holidays.
 */
export function isMarketOpen(date?: Date): boolean {
  const now = date ?? new Date();

  // Convert to Eastern Time
  const et = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );

  const day = et.getDay(); // 0 = Sunday, 6 = Saturday
  if (day === 0 || day === 6) return false;

  const hours = et.getHours();
  const minutes = et.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  const marketOpen = 9 * 60 + 30; // 9:30 AM = 570 minutes
  const marketClose = 16 * 60; // 4:00 PM = 960 minutes

  return timeInMinutes >= marketOpen && timeInMinutes < marketClose;
}
