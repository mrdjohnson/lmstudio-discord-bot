import 'dotenv/config';
import { LMStudioClient } from '@lmstudio/sdk';
import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js';

// ! in typescript just says these are not null
const CLIENT_TOKEN = process.env.CLIENT_TOKEN!;
const CLIENT_ID = process.env.CLIENT_ID!;
const GUILD_ID = process.env.GUILD_ID!;

function createDiscordSlashCommands() {
  const pingCommand = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('A simple check to see if I am available')
    .toJSON();

  const allCommands = [
    pingCommand
  ];

  // Gives a pretty-print view of the commands
  console.log();
  console.log(JSON.stringify(allCommands, null, 2));
  console.log();

  return allCommands;
}

// We send our commands to discord so it knows what to look for
async function activateDiscordSlashCommands() {
  const rest = new REST({ version: '10' }).setToken(CLIENT_TOKEN);

  try {
    console.log('Started refreshing bot (/) commands.');

    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: createDiscordSlashCommands()
    });

    console.log('Successfully reloaded bot (/) commands.');
  } catch (error) {
    console.error(error);

    return false;
  }

  console.log();

  return true;
}


async function main() {
  const slashCommandsActivated = await activateDiscordSlashCommands();

  if (!slashCommandsActivated) throw new Error('Unable to create or refresh bot (/) commands.');

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.on('ready', () => {
    console.log(`Logged in as ${client.user?.tag}!`);
  });

  // this is for responding to slash commands, not individual messages
  client.on('interactionCreate', async interaction => {
    // if we did not receive a command, lets ignore it
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'ping') {
      await interaction.reply('Pong!');
    }
  });

  client.login(CLIENT_TOKEN);
}

// // uncomment this if you want to test the slash command activation
// activateDiscordSlashCommands().then(() => {
//   console.log('Finished activating Discord / Commands');
// });

main();