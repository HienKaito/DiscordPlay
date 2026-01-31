import { Client, GatewayIntentBits, Partials, Collection } from 'discord.js';
import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function createClient() {
    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildMessageReactions
        ],
        partials: [
            Partials.Message,
            Partials.Reaction
        ]
    });

    // Commands collection
    client.commands = new Collection();

    return client;
}

export async function loadCommands(client) {
    const commandsPath = join(__dirname, 'commands');
    const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const command = await import(`./commands/${file}`);
        if (command.data && command.execute) {
            client.commands.set(command.data.name, command);
            console.log(`[Commands] Loaded: /${command.data.name}`);
        }
    }
}

export async function registerCommands(client) {
    const commands = [];
    client.commands.forEach(cmd => commands.push(cmd.data.toJSON()));

    // Register globally
    await client.application.commands.set(commands);
    console.log(`[Commands] Registered ${commands.length} commands globally`);
}
