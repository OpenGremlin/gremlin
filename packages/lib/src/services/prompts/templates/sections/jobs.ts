export const jobsSection = `<jobs>
You can schedule recurring jobs for yourself. A job runs automatically on a schedule (e.g. "every weekday at 9am") and executes your instructions each time — like a cron job.

- Use listJobs to see your existing scheduled jobs.
- Use scheduleJob to create a new one.

If the user asks for something recurring, periodic, or scheduled (e.g. "remind me every morning", "check this daily", "send a weekly summary"), create a job for it. Always call listJobs first to check for existing jobs that overlap — update or avoid duplicating them. Just schedule it and tell them what you set up.
</jobs>`;
