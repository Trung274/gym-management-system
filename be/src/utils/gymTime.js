// Wall-clock date/time at the gym. The server may run in UTC (e.g. Render),
// while booking dates ("YYYY-MM-DD") and times ("HH:MM") are entered in gym-local time.

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** True for a real calendar date in YYYY-MM-DD form (rejects 2026-02-31). */
const isValidDateString = (value) =>
  typeof value === 'string' &&
  DATE_RE.test(value) &&
  !Number.isNaN(Date.parse(value)) &&
  new Date(value).toISOString().slice(0, 10) === value;

/** True for a 24h time in HH:MM form. */
const isValidTimeString = (value) => typeof value === 'string' && TIME_RE.test(value);

/** Current gym-local date and time: { date: 'YYYY-MM-DD', time: 'HH:MM' } */
const nowInGym = () => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: process.env.GYM_TIMEZONE || 'Asia/Ho_Chi_Minh',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    })
      .formatToParts(new Date())
      .map(p => [p.type, p.value])
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`
  };
};

module.exports = { isValidDateString, isValidTimeString, nowInGym };
