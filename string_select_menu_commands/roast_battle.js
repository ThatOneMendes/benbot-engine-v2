const { Client, ChatInputCommandInteraction, StringSelectMenuInteraction } = require("discord.js");
const { activeRoastBattles } = require("../subcommands/fun/start_roast_battle");

/**
 * 
 * @param {Client} client 
 * @param {Object} indexModules 
 * @param {StringSelectMenuInteraction} interaction 
 */
async function execute(client, indexModules, interaction) {
    await interaction.deferReply({ephemeral: true})
    const commandData = interaction.customId.split("|")

    switch(commandData[1]) { //commandData[0] is always "roast_battle"
        case 'vote':
            const rating = Number(interaction.values[0])
            const gameID = commandData[2]
            const votationTowards = Number(commandData[3])
            const roastBattle = activeRoastBattles.get(gameID)

            if(roastBattle.host.id == interaction.user.id || roastBattle.challengedUser.id == interaction.user.id) return await interaction.editReply(`A contestant cannot vote!`)
            if(roastBattle.peopleWhoVoted.indexOf(interaction.user.id) != -1) return await interaction.editReply("You already voted!")
            roastBattle.peopleWhoVoted.push(interaction.user.id)
            
            roastBattle.votes[votationTowards].push(rating)
            return await interaction.editReply(`Your rating was successfully registred!`)
        break;
    }
}

module.exports = {
    execute: execute
}