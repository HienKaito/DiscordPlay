import { registerCommands } from '../client.js';
import cron from 'node-cron';
import { spawnCharacter } from '../../services/spawn.service.js';
import { config } from '../../config.js';

export const name = 'ready';
export const once = true;

export async function execute(client) {
    console.log(`[Bot] Logged in as ${client.user.tag}`);

    // Register slash commands
    await registerCommands(client);

    // Setup spawn scheduler
    const cronExpression = `*/${config.spawnIntervalMinutes} * * * *`;
    cron.schedule(cronExpression, () => {
        console.log('[Spawn] Triggering spawn...');
        spawnCharacter(client);
    });

    console.log(`[Spawn] Scheduler started: every ${config.spawnIntervalMinutes} minutes`);

    // Set bot status
    client.user.setActivity('React ❤️ để thu thập!', { type: 3 }); // Watching
}
