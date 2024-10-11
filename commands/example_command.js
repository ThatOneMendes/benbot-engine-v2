const { Client, ChatInputCommandInteraction } = require("discord.js")
const commandData = require("../config/commands/example.json")
const registerCommands = require('../utils/register_commands');

module.exports = {
    data: registerCommands(commandData),
    /**
     * 
     * @param {Client} client 
     * @param {Object} indexModules 
     * @param {ChatInputCommandInteraction} interaction 
     */
    async execute(client, indexModules, interaction) {
        await interaction.deferReply();

        return await interaction.editReply("hi, this is my first example command!")
    }
}
