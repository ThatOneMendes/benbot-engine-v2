const { log, logPriority } = require("../utils/logger");

const { stringSelectCommandsPath, autocompletesPath, buttonInteractionsPath } = require("../config/main.json");

const fs = require('node:fs');
const { Client, ChatInputCommandInteraction } = require("discord.js");

/**
 * 
 * @param {Client} client 
 * @param {Object} indexModules 
 * @param {ChatInputCommandInteraction} interaction 
 * @returns 
 */
module.exports = async (client, indexModules, interaction) => {
    try{
        if(interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) {
                log(`No command matching ${interaction.commandName} was found.`, logPriority.warn);
                return;
            }
            await command.execute(client, indexModules, interaction);
        }
        if(interaction.isStringSelectMenu()) {
            const commandName = interaction.customId.split("|")[0]
            if(interaction.customId.split("|").length <= 1) return;
            if(!fs.existsSync(`${stringSelectCommandsPath}${commandName}.js`)) {
                log(`No string select menu command matching ${commandName} was found.`, logPriority.warn);
                return;
            }
            require(`.${stringSelectCommandsPath}${commandName}.js`).execute(client, indexModules, interaction)
        }
        if(interaction.isAutocomplete()) {
            if (!fs.existsSync(`${autocompletesPath}${interaction.commandName}.js`)) {
                log(`No autocomplete matching ${interaction.commandName} was found.`, logPriority.warn);
                return;
            }
            require(`.${autocompletesPath}${interaction.commandName}.js`).execute(client, indexModules, interaction)
        }
        if(interaction.isButton()) {
            const commandName = interaction.customId.split("|")[0]
            if(interaction.customId.split("|").length <= 1) return;
            if(!fs.existsSync(`${buttonInteractionsPath}${commandName}.js`)) {
                log(`No button command matching ${commandName} was found.`, logPriority.warn);
                return;
            }
            require(`.${buttonInteractionsPath}${commandName}.js`).execute(client, indexModules, interaction)
        }
    } catch(e) {
        const errorLog = log(e)
        if(interaction.replied || interaction.deferred) {
            interaction.editReply({content: `Whoops! Something went wrong!\n\`\`\`ansi\n${errorLog}\`\`\``}).catch(log)
        } else interaction.reply({content: `Whoops! Something went wrong!\n\`\`\`ansi\n${errorLog}\`\`\``}).catch(log)
    }
}
