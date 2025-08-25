import { useEffect, useState } from "react";

export interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

export function useCountdown(
  createdAt: string,
  durationDays: number
): CountdownTime {
  const [timeRemaining, setTimeRemaining] = useState<CountdownTime>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const created = new Date(createdAt).getTime();
      const endTime = created + durationDays * 24 * 60 * 60 * 1000;
      const difference = endTime - now;

      // // DEBUG: Log semua nilai untuk debugging
      // console.log("=== COUNTDOWN DEBUG ===");
      // console.log("createdAt string:", createdAt);
      // console.log("durationDays:", durationDays);
      // console.log("now:", now, "(", new Date(now).toLocaleString(), ")");
      // console.log(
      //   "created:",
      //   created,
      //   "(",
      //   new Date(created).toLocaleString(),
      //   ")"
      // );
      // console.log(
      //   "endTime:",
      //   endTime,
      //   "(",
      //   new Date(endTime).toLocaleString(),
      //   ")"
      // );
      // console.log("difference:", difference, "ms");
      // console.log("difference in hours:", difference / (1000 * 60 * 60));
      // console.log("isExpired:", difference <= 0);
      // console.log("=====================");

      if (difference <= 0) {
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true,
        });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeRemaining({
        days,
        hours,
        minutes,
        seconds,
        isExpired: false,
      });
    };

    // Calculate immediately
    calculateTimeRemaining();

    // Update every minute
    const interval = setInterval(calculateTimeRemaining, 60000);

    return () => clearInterval(interval);
  }, [createdAt, durationDays]);

  return timeRemaining;
}
