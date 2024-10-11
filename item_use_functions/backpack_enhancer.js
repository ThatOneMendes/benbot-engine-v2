const { Client, ChatInputCommandInteraction, userMention } = require("discord.js");
const { backpack_enhancer } = require("../config/messages.json");
const replacePlaceholderValues = require("../utils/replacePlaceholderValues");
const { loadUserData, bufferToJSON, JSONtoBuffer, getMemberMaxInventorySlots } = require("../utils/database_functions.js")

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
        const userData = await loadUserData(interaction.user);
        let userInventory = bufferToJSON(userData.inventory);
        if(userInventory.inventorySpaceBoosts >= 5) return {
            success: true,
            responseMessage: backpack_enhancer.cantUseAnymore,
            consumeItem: false
        };
        userInventory.inventorySpaceBoosts += 1
        userData.inventory = JSONtoBuffer(userInventory);
        return {
            success: true,
            responseMessage: replacePlaceholderValues(backpack_enhancer.itemUsed, {
                "{slots}": await getMemberMaxInventorySlots(interaction.member, userInventory.inventorySpaceBoosts)
            }),
            consumeItem: true
        }
    }
}

