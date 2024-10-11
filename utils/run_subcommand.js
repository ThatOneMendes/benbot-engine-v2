const fs = require("node:fs")
const { subcommandsFolder } = require("../config/main.json");
const { Client, ChatInputCommandInteraction } = require("discord.js");
const { runSubcommands } = require("../config/messages.json")
const replacePlaceholderValues = require("../utils/replacePlaceholderValues")

/**
 * 
 * @param {Client} client 
 * @param {Object} indexModules 
 * @param {ChatInputCommandInteraction} interaction 
 * @returns {any}
 */
async function runSubcommand(client, indexModules, interaction) {
    const subcommand = interaction.options.getSubcommand()
    if(!fs.existsSync(`${subcommandsFolder}${interaction.commandName}/${subcommand}.js`)) return await interaction.reply({content: replacePlaceholderValues(
        runSubcommands.subcommandPathMissing,
        {
            "{subcommand}": subcommand
        }
    ), ephemeral: true});
    if(!fs.existsSync(`./config/commands/${interaction.commandName}/main.json`)) return await interaction.reply({content: replacePlaceholderValues(
        runSubcommands.commandDataPathMissing,
        {
            "{commandName}": interaction.commandName
        }
    )})
    const commandData = require(`../config/commands/${interaction.commandName}/main.json`)
    await interaction.deferReply({ephemeral: commandData.subcommandData[subcommand].ephemeral});
    return await require(`.${subcommandsFolder}${interaction.commandName}/${subcommand}.js`).execute(client, indexModules, interaction)
}

module.exports = runSubcommand