import 'dotenv/config';
import { LMStudioClient } from '@lmstudio/sdk';
import { Client, GatewayIntentBits } from 'discord.js';

// ! in typescript just says these are not null
const CLIENT_TOKEN = process.env.CLIENT_TOKEN!;
const CLIENT_ID = process.env.CLIENT_ID!;
const GUILD_ID = process.env.GUILD_ID!;

async function main() {
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.on('ready', () => {
    console.log(`Logged in as ${client.user?.tag}!`);
  });

  client.login(CLIENT_TOKEN);
}

main();