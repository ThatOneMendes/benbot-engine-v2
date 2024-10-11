const { Client, StringSelectMenuInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const items = require("../config/items.json");
const { loadUserData, addItemToInventory, bufferToJSON, JSONtoBuffer } = require("../utils/database_functions");
const { currencyName } = require("../config/main.json")
const wallpapers = require("../config/wallpapers.json");
const { generateUserCard } = require("../subcommands/economy/user_info");
const { log } = require("../utils/logger");
const { notEnoughBenCoins, inventoryFull, unknownErrorAddingItem, canOnlyHoldOneItemAtATime, shop_select } = require('../config/messages.json');
const replacePlaceholderValues = require("../utils/replacePlaceholderValues");

/**
 * 
 * @param {Client} client 
 * @param {Object} indexModules 
 * @param {StringSelectMenuInteraction} interaction 
 */
async function execute(client, indexModules, interaction) {
    await interaction.deferReply({ephemeral: true})
    const commandData = interaction.customId.split("|")
    const userData = await loadUserData(interaction.user)
    let userInventory = bufferToJSON(userData.inventory)
    log(userInventory)

    switch(commandData[1]) { //commandData[0] is always "roast_battle"
        case 'items':
            const itemData = interaction.values[0].split("|")
            if(!indexModules.shopItems.get(interaction.values[0])) return await interaction.editReply(shop_select.items.errors.itemNotOnSale)
            if(indexModules.shopItems.get(interaction.values[0]) <= 0) return await interaction.reply(
                replacePlaceholderValues(shop_select.items.errors.itemStockEnded,
                    {
                        "{itemName}": items[itemData[0]].subtypes[itemData[1]].itemName
                    }  
                )
            )
            const itemPrice = items[itemData[0]].subtypes[itemData[1]].price
            if(userData.benCoins < itemPrice) return await interaction.editReply(
                replacePlaceholderValues(notEnoughBenCoins,
                    {
                        "{currencyName}": currencyName
                    }
                )
            )
            const inventory = await addItemToInventory(userInventory, itemData[0], itemData[1], undefined, interaction.member)
            if(typeof(inventory) == "number") {
                switch(inventory) {
                    case -1:
                        return await interaction.editReply(unknownErrorAddingItem)
                    break;
                    case 0:
                        return await interaction.editReply(inventoryFull)
                    break;
                    case 1:
                        return await interaction.editReply(replacePlaceholderValues(
                            canOnlyHoldOneItemAtATime,
                            {
                                "{itemName}": items[itemData[0]].generalName
                            }
                        ))
                    break;
                }
                return;
            }
            userInventory = inventory
            userData.inventory = JSONtoBuffer(userInventory)
            return await interaction.editReply(replacePlaceholderValues(
                shop_select.items.itemBought,
                {
                    "{itemName}": items[itemData[0]].subtypes[itemData[1]].itemName
                } 
            ))
        break;
        case 'wallpapers':
            const wallpaperID = interaction.values[0]
            if(indexModules.shopWallpapers.indexOf(wallpaperID) == -1) return await interaction.editReply(shop_select.wallpapers.errors.wallpaperNotOnSale)
            const wallpaperPrice = wallpapers[wallpaperID].price
            if(userData.benCoins < wallpaperPrice) return await interaction.editReply(
                replacePlaceholderValues(notEnoughBenCoins,
                    {
                        "{currencyName}": currencyName
                    }
                )
            )
            if(userInventory.boughtWallpapers.indexOf(wallpaperID) != -1) return await interaction.editReply(shop_select.wallpapers.errors.alreadyHasWallpaper)
            const confirmRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setCustomId("confirmPurchase")
                .setEmoji('✅')
                .setStyle(ButtonStyle.Success)
            )
            const userCard = await generateUserCard(userData, interaction.member, wallpaperID)
            const message = await interaction.editReply({content: shop_select.wallpapers.confirmation, components: [confirmRow], files:[userCard]})
            confirmRow.components[0].setDisabled(true)
            try {
                const confirm = await message.awaitMessageComponent({time: 20000})
                await confirm.deferReply({ephemeral: true})
                await interaction.editReply({components: [confirmRow]})
                userInventory.currentWallpaper = wallpaperID
                userInventory.boughtWallpapers.push(wallpaperID)
                userData.inventory = JSONtoBuffer(userInventory)
                return await confirm.editReply(shop_select.wallpapers.wallpaperBought)
            } catch(e) {
                log(e)
                await interaction.editReply({components: [confirmRow]})
            }
        break;
    }
}

module.exports = {
    execute: execute
}