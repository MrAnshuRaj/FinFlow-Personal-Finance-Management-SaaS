export const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);
export const addWeeks = (d: Date, n: number) => addDays(d, n * 7);
export const addMonths = (d: Date, n: number) => { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; };
export const addYears = (d: Date, n: number) => { const x = new Date(d); x.setFullYear(x.getFullYear() + n); return x; };
