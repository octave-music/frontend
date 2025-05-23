// src/lib/utils/uiUtils.ts
export function getDynamicGreeting(): string {
  const now = new Date();
  const currentHour = now.getHours();

  if (currentHour >= 5 && currentHour < 12) return "Good Morning!";
  if (currentHour >= 12 && currentHour < 17) return "Good Afternoon!";
  if (currentHour >= 17 && currentHour < 21) return "Good Evening!";
  return "Good Night!";
}