const { loadUserData, botDataManager, makeNumberDivisibleBy5, bufferToJSON, JSONtoBuffer} = require('../utils/database_functions')
const { imagePermsRoleID, itemAddFailureReward, messagesRequirement, messagesRequirementReward, hackDropsChannelID, everyoneRoleID, fixedEXPGain, privilegedRoles } = require('../config/main.json');
const { levelUp, hackLinks, levelUpItemAdd } = require('../config/messages.json')
const { EmbedBuilder, Message, TextChannel, ButtonBuilder, ButtonStyle, ActionRowBuilder, Client } = require('discord.js');
const { log, } = require('../utils/logger');
const replacePlaceholderValues = require('../utils/replacePlaceholderValues.js')
const percentChance = require('../utils/percent_chance.js')
const levelUpRewardsTable = require('../config/level_up_loot_tables.json')
const items = require("../config/items.json");

module.exports.warsPunishmentEnabled = true

/**
 * 
 * @param {Client} client 
 * @param {Object} indexModules 
 * @param {Message} message 
 * @returns 
 */
module.exports.run = async (client, indexModules, message) => {
    if(message.author.bot) return;
    const authorData = await loadUserData(message.author)
    const botData = await botDataManager("get")
    let userInventory = bufferToJSON(authorData.inventory)

    authorData.messagesSent++;
    
    if(authorData.messagesSent >= messagesRequirement) {
        authorData.benCoins += messagesRequirementReward
        authorData.messagesSent = 0
    }

    if((authorData.level + 1) * 1000 <= authorData.experience) {
        // Rewarding the user
        authorData.experience = 0
        authorData.level++;
        authorData.benCoins += 200 + ((authorData.level - 1) * 5)
        
        // Figuring out the correct loot table to get items from.

        const userCurrentRewardsTable = (() => {
            let lootTable = undefined
            Object.keys(levelUpRewardsTable).forEach(key => {
                const [minLevel, maxLevel] = key.split('|').map(e => Number(e))
                if(authorData.level >= minLevel && authorData.level <= maxLevel && !lootTable) lootTable = levelUpRewardsTable[key]
            })
            return lootTable || levelUpRewardsTable["20|39"]
        })(); 

        // Choosing the item to give.

        const [chosenItemId, chosenItemSubtype] = (() => {
            let itemToGive = ''
            while(itemToGive == '') {
                Object.keys(userCurrentRewardsTable).forEach(item => {
                    const chance = userCurrentRewardsTable[item]
                    if(itemToGive == '' && percentChance(chance)) {
                        itemToGive = item
                    }
                })
            }
            return itemToGive
        })().split("|");

        // Giving the item to the user.
        let levelUpMessage = replacePlaceholderValues(
            levelUpItemAdd.normal,
            {
                "{itemName}": items[chosenItemId].subtypes[chosenItemSubtype].itemName
            }
        )
        giveItemToUser: {    
            const benCoinsReward = await makeNumberDivisibleBy5(Math.floor(Math.random() * (itemAddFailureReward.max - itemAddFailureReward.min)) + itemAddFailureReward.min)
            if(chosenItemId == "image_perms" && message.member.roles.cache.has(imagePermsRoleID)) {
                levelUpMessage = replacePlaceholderValues(
                    levelUpItemAdd.alreadyHasImagePerms,
                    {
                        "{itemName}": items[chosenItemId].subtypes[chosenItemSubtype].itemName,
                        "{benCoins}": benCoinsReward
                    }
                );
                authorData.benCoins += benCoinsReward
                break giveItemToUser; // Get outta here! No attempt of giving the item will be made.
            }
        
            const success = await addItemToInventory(userInventory, chosenItemId, chosenItemSubtype, undefined, await message.member.fetch())
            if(typeof(success) == "number") {
                authorData.benCoins += benCoinsReward
                switch(success) {
                    case -1:
                        levelUpMessage = replacePlaceholderValues(
                            levelUpItemAdd['errorCode-1'],
                            {
                                "{itemName}": items[chosenItemId].subtypes[chosenItemSubtype].itemName,
                                "{benCoins}": benCoinsReward
                            }
                        );
                    break;
                    case 0:
                        levelUpMessage = replacePlaceholderValues(
                            levelUpItemAdd.errorCode0,
                            {
                                "{itemName}": items[chosenItemId].subtypes[chosenItemSubtype].itemName,
                                "{benCoins}": benCoinsReward
                            }
                        )
                    break;
                    case 1:
                        levelUpMessage = replacePlaceholderValues(
                            levelUpItemAdd.errorCode1,
                            {
                                "{itemName}": items[chosenItemId].subtypes[chosenItemSubtype].itemName,
                                "{benCoins}": benCoinsReward
                            }
                        )
                    break;
                }
            } else {
                userInventory = success
                authorData.inventory = JSONtoBuffer(userInventory)
            }
        }

        const extraFreePoints = 1 + Math.floor(Math.random() * 8)

        userInventory.stats.freePoints += extraFreePoints

        // Sending the level up message!

        const chosenLevelUpMessage = replacePlaceholderValues(
            levelUp[Math.floor(Math.random() * levelUp.length)],
            {
                "{user}": `<@${message.author.id}>`,
                "{level}": authorData.level,
                "{freePoints}": extraFreePoints
            }
        ) + levelUpMessage

        await message.channel.send(chosenLevelUpMessage).catch(log)
    }

    if(botData.hackLinks.enabled && percentChance(botData.hackLinks.chance)) {
        invokeHack(client, Math.floor(Math.random() * botData.hackLinks.maxAmount), percentChance(botData.hackLinks.chanceToBeInfested))
    }
}

/**
 * @param {Client} client 
 * @param {Message} message
*/
async function invokeHack(client, hackAmount = Math.floor(Math.random() * 12), badHack = percentChance(30), timeoutTimer = 6000, dissapearTimer = 10000) {
    /**
     * @type {TextChannel}
     */
    const botChannel = await client.channels.fetch(hackDropsChannelID).catch(e => {
        log(e)
        return null;
    })
    if(!botChannel) return "botChannel dosent exist!!!";
    const descAndButtonIndex = Math.floor(Math.random() * hackLinks.embed.descriptions.length)
    const hackEmbed = new EmbedBuilder()
    .setTitle(hackLinks.embed.titles[Math.floor(Math.random() * hackLinks.embed.titles.length)])
    .setDescription(replacePlaceholderValues(
        hackLinks.embed.descriptions[descAndButtonIndex],
        {
            "{hackValue}": hackAmount
        }
    ))
    .setColor(hackLinks.embed.color)
    .setTimestamp();
    const hackButton = new ButtonBuilder()
    .setCustomId("getHack")
    .setLabel(hackLinks.buttons[descAndButtonIndex])
    .setStyle(ButtonStyle.Secondary);
    const hackRow = new ActionRowBuilder()
    .setComponents(hackButton);
    const hackMessage = await botChannel.send({components: [hackRow], embeds: [hackEmbed]})
    hackButton.setDisabled(true)
    try {
        const getHackInteraction = await hackMessage.awaitMessageComponent({time: timeoutTimer})
        await getHackInteraction.deferUpdate()
        hackButton.setLabel(replacePlaceholderValues(
            hackLinks.taken[Math.floor(Math.random() * hackLinks.taken.length)],
            {
                "{user}": getHackInteraction.member.nickname ?? getHackInteraction.user.username
            }
        ))
        await getHackInteraction.editReply({components: [hackRow]})
        const hackedUserData = await loadUserData(getHackInteraction.user)
        if(badHack) {
            const badHackAmount = Math.floor(hackAmount * 1.5)
            log(hackedUserData.benCoins)
            log(hackedUserData.benCoins - badHackAmount)
            if(hackedUserData.benCoins > 0 && hackedUserData.benCoins - badHackAmount < 0) {
                hackedUserData.benCoins = 20
                hackMessage.reply(hackLinks.pity)
            } else {
                hackedUserData.benCoins -= badHackAmount
                hackMessage.reply(replacePlaceholderValues(
                    hackLinks.virusInfestedHack,
                    {
                        "{amount}": badHackAmount,
                        "{user}": `<@${getHackInteraction.user.id}>`
                    },
                ))
            }
        } else {
            hackedUserData.benCoins += hackAmount
            if(dissapearTimer === -1) return;
            setTimeout(() => {
                hackMessage.delete().catch(log)
            }, dissapearTimer)
        }
    } catch(e) {
        hackButton.setLabel(hackLinks.removed[Math.floor(Math.random() * hackLinks.removed.length)])
        await hackMessage.edit({components: [hackRow]})
        if(dissapearTimer === -1) return;
        setTimeout(() => {
            hackMessage.delete().catch(log)
        }, dissapearTimer)
    }
}

module.exports.invokeHack = invokeHack
