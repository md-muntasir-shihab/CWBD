import cron from 'node-cron';
import { runDueSourceIngestion, runScheduledNewsPublish } from '../controllers/newsV2Controller';

export function startNewsV2CronJobs(): void {
    cron.schedule('* * * * *', async () => {
        try {
            await runDueSourceIngestion();
            await runScheduledNewsPublish();
        } catch (error) {
            console.error('[CRON] news v2 jobs failed:', error);
        }
    });
}

