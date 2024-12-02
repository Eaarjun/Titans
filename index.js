const { Client, Collection, Events, GatewayIntentBits } = require("discord.js");
const fs = require("fs");
const path = require("path");
const { token } = require("./config.json");
const mongoose = require("mongoose");

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, // Required to join servers and track the bot's guilds
    GatewayIntentBits.GuildMessages, // Required to read messages in text channels
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  // Grab all the command files from the commands directory you created earlier
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));
  // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ("data" in command && "execute" in command) {
      commands.push(command.data.toJSON());
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  }
});

//MongoDB

mongoose.connect("mongodb://localhost:27017/rpg-game", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});
//Temporary data for bot
const Player = require("./models/Player");

client.on("messageCreate", async (message) => {
  if (message.content === "!start") {
    const playerId = message.author.id;

    // Check if the player already exists
    const existingPlayer = await Player.findOne({ player_id: playerId });
    if (existingPlayer) {
      message.reply("You have already started your journey!");
      return;
    }

    // Create and save a new player
    const newPlayer = new Player({
      player_id: playerId,
      name: message.author.username,
    });

    try {
      await newPlayer.save();
      message.reply("Welcome to the dungeon, brave adventurer!");
    } catch (error) {
      console.error(error);
      message.reply("Something went wrong while creating your character.");
    }
  }
});

client.on("messageCreate", async (message) => {
  if (message.content === "!stats") {
    const playerId = message.author.id;
    const player = await Player.findOne({ player_id: playerId });

    if (!player) {
      message.reply("You haven’t started your journey yet! Use `!start`.");
      return;
    }

    message.reply(`Stats for ${player.name}:
        Level: ${player.level}
        Experience: ${player.experience}
        Gold: ${player.gold}
        Health: ${player.current_health}/${player.max_health}`);
  }
});

client.on("messageCreate", async (message) => {
  if (message.content === "!earn") {
    const playerId = message.author.id;
    const player = await Player.findOne({ player_id: playerId });

    if (!player) {
      message.reply("You haven’t started your journey yet! Use `!start`.");
      return;
    }

    // Add gold
    player.gold += 50;

    // Save changes
    await player.save();

    message.reply(`You earned 50 gold! You now have ${player.gold} gold.`);
  }
});

// When the bot is ready
client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// Login to Discord with your app's token
client.login(token);
