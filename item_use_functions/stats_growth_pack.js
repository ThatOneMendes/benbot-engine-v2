const { Client, ChatInputCommandInteraction, userMention } = require("discord.js");
const replacePlaceholderValues = require("../utils/replacePlaceholderValues");
const { loadUserData, JSONtoBuffer, bufferToJSON } = require("../utils/database_functions");
const { stat_growth_pack } = require("../config/messages.json")

module.exports = {
    /**
     * 
     * @param {Client} client
     * @param {ChatInputCommandInteraction} interaction
     * @param {object} indexModules 
     * @param {string} itemID 
     * @param {string} itemSubtype
     * @returns {{success:boolean,responseMessage:string|null,consumeItem:boolean}} 
     */
    async useItem(client, interaction, indexModules, itemID, itemSubtype, itemSlot) {
        const userData = await loadUserData(interaction.user)
        const inventory = bufferToJSON(userData.inventory)

        inventory.stats.freePoints += inventory.items[itemSlot].data.amountFreePoints

        userData.inventory = JSONtoBuffer(inventory)

        return {
            success: true,
            responseMessage: replacePlaceholderValues(
                stat_growth_pack.done,
                {
                    "{freePoints}": inventory.stats.freePoints
                }
            ),
            consumeItem: true
        }
    }
}

