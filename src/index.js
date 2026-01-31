import { config } from './config.js';
import { createClient, loadCommands } from './bot/client.js';
import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Initialize database (import để chạy schema)
import db from './database/db.js';

// Cleanup expired trades on startup
const cleanupResult = db.prepare(`
    UPDATE trades SET status = 'expired' 
    WHERE status IN ('pending', 'selecting', 'confirming')
`).run();
if (cleanupResult.changes > 0) {
    console.log(`[Cleanup] Expired ${cleanupResult.changes} stuck trades`);
}

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
    // Validate config
    if (!config.token) {
        console.error('[Error] DISCORD_TOKEN is not set in .env file!');
        process.exit(1);
    }

    console.log('[Bot] Starting Anime TCG Bot...');

    // Create client
    const client = createClient();

    // Load commands
    await loadCommands(client);

    // Load events
    const eventsPath = join(__dirname, 'bot', 'events');
    const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        const event = await import(`./bot/events/${file}`);

        if (event.once) {
            client.once(event.name, (...args) => event.execute(client, ...args));
        } else {
            client.on(event.name, (...args) => event.execute(client, ...args));
        }

        console.log(`[Events] Loaded: ${event.name}`);
    }

    // Login
    await client.login(config.token);
}

main().catch(console.error);
