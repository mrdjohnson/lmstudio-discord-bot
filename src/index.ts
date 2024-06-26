import 'dotenv/config';
import { LMStudioClient, LLMSpecificModel } from '@lmstudio/sdk';
import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js';

// ! in typescript just says these are not null
const CLIENT_TOKEN = process.env.CLIENT_TOKEN!;
const CLIENT_ID = process.env.CLIENT_ID!;
const GUILD_ID = process.env.GUILD_ID!;

async function getLLMSpecificModel() {
  // create the client
  const client = new LMStudioClient();

  // get all the pre-loaded models
  const loadedModels = await client.llm.listLoaded();

  if (loadedModels.length === 0) {
    throw new Error('No models loaded');
  }

  console.log('Using model:%s to respond!', loadedModels[0].identifier);

  // grab the first available model
  const model = await client.llm.get({ identifier: loadedModels[0].identifier });

  // alternative
  // const specificModel = await client.llm.get('lmstudio-community/gemma-1.1-2b-it-GGUF/gemma-1.1-2b-it-Q2_K.gguf')

  return model;
}

async function getModelResponse(userMessage: string, model: LLMSpecificModel) {
  // send a system prompt (tell the model how it should "act;"), and the message we want the model to respond to
  const prediction = await model.respond([
    { role: 'system', content: 'You are a helpful discord bot responding with short and useful answers. Your name is lmstudio-bot' },
    { role: 'user', content: userMessage },
  ]);

  // return what the model responded with
  return prediction.content;
}

function createDiscordSlashCommands() {
  const pingCommand = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('A simple check to see if I am available')
    .toJSON();

  const askCommand = new SlashCommandBuilder()
    .setName('ask')
    .setDescription('Ask LM Studio Bot a question.')
    // lets create a specific field to look for our question
    .addStringOption(option => (
      option.setName('question')
        .setDescription('What is your question.')
        .setRequired(true)
    ))
    .toJSON();

  const allCommands = [
    pingCommand,
    askCommand
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
  const model = await getLLMSpecificModel();

  if (!model) throw new Error('No models found');

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

    if (interaction.commandName === 'ask') {
      // this might take a while, put the bot into a "thinking" state
      await interaction.deferReply();

      // we can assume `.getString('question')` has a value because we marked it as required on Discord
      const question = interaction.options.getString('question')!;
      console.log('User asked: "%s"', question);

      try {
        const response = await getModelResponse(question, model);

        // replace our "deferred response" with an actual message
        await interaction.editReply(response);
      } catch (e) {
        await interaction.editReply('Unable to answer that question');
      }
    }
  });

  client.login(CLIENT_TOKEN);
}

// // uncomment this if you want to test the slash command activation
// activateDiscordSlashCommands().then(() => {
//   console.log('Finished activating Discord / Commands');
// });

// // uncomment this if you want to test the response
// getLLMSpecificModel().then(async model => {
//   const response = await getModelResponse('Hello how are you today', model);
//   console.log('responded with %s', response);
// });

main();