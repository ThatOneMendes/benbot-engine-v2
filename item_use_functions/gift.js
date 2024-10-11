const { Client, ChatInputCommandInteraction } = require("discord.js");
const { addItemToInventory, makeNumberDivisibleBy5, loadUserData, bufferToJSON, findSlotByItem, removeItemFromInventory, JSONtoBuffer } = require("../utils/database_functions");
const { giftItem } = require("../config/messages.json");
const items = require('../config/items.json');
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
    async useItem(client, interaction, indexModules, itemID, itemSubtype, itemSlot) {
        let giftMessage = ""
        const returnObject = {
            success: true,
            responseMessage: giftMessage,
            consumeItem: false
        }
        const userData = await loadUserData(interaction.user)
        let userInventory = bufferToJSON(userData.inventory)
        const [lootID, lootSubtype] = userInventory.items[itemSlot].data.giftLoot.split("|")
        userInventory = await removeItemFromInventory(userInventory, itemID, itemSubtype, 1, interaction.member, itemSlot)
        if(lootID == "bencoins") {
            const [minAmount, maxAmount] = lootSubtype.split("-").map(e => Number(e))
            const bencoinsReward = await makeNumberDivisibleBy5(Math.floor(Math.random() * (maxAmount - minAmount)) + minAmount)
            userData.benCoins += bencoinsReward
            giftMessage = replacePlaceholderValues(giftItem.benCoinsLoot, {
                "{benCoins}": bencoinsReward
            })
        } else {
            const success = await addItemToInventory(userInventory, lootID, lootSubtype, undefined, interaction.member)
            if(typeof(success) == "number") {
                switch(success) {
                    case -1:
                        returnObject.success = false
                    break;
                    case 0:
                        giftMessage = giftItem.errors.inventoryFull 
                    break;
                    case 1:
                        giftMessage = replacePlaceholderValues(giftItem.errors.carryOneError, {
                            "{itemName}": items[lootID].subtypes[lootSubtype].itemName
                        }) 
                    break;
                }
            } else {
                giftMessage = replacePlaceholderValues(giftItem.itemReveal, {
                    "{itemName}": items[lootID].subtypes[lootSubtype].itemName
                }) 
                userInventory = success
            }
        }
        userData.inventory = JSONtoBuffer(userInventory)
        returnObject.responseMessage = giftMessage
        return returnObject
    }
}
