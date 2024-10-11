const { Client, ButtonInteraction } = require("discord.js");

/**
 * 
 * @param {Client} client 
 * @param {Object} indexModules 
 * @param {ButtonInteraction} interaction 
 */
async function execute(_client, _indexModules, interaction) {
    // example button interaction thing
    await interaction.deferReply({ephemeral: true})
    
    return await interaction.editReply("we have detected a button press!")
}

module.exports = {
    execute: execute
}
