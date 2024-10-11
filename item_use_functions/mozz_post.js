const { Client, ChatInputCommandInteraction, userMention } = require("discord.js");
const { paidMozzPostMessage } = require("../config/messages.json");
const replacePlaceholderValues = require("../utils/replacePlaceholderValues");


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
    async useItem(client, interaction, indexModules, itemID, itemSubtype) {
       return {
            success: true,
            responseMessage: replacePlaceholderValues(paidMozzPostMessage, {
                "{user}": userMention(interaction.user.id)
            }),
            consumeItem: true
        }
    }
}

