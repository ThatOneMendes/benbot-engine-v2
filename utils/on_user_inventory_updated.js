const { log, logPriority } = require("./logger.js");
const giftLoot = require('../config/gifts_loot.json')


async function image_perms_add(guildMember) {
    log(`Image perms added to ${guildMember.user.username}!`)
    return await guildMember.roles.add('1146907463027793930').catch(log)
}

async function image_perms_remove(guildMember) {
    log(`Image perms removed from ${guildMember.user.username}!`)
    return await guildMember.roles.remove('1146907463027793930').catch(log)
}

async function gift_add(guildMember, itemSubtype, subtypeModifications) {
    log(subtypeModifications, itemSubtype)
    if(subtypeModifications) return null
    const itemModification = {
        data: {
            giftLoot: giftLoot[itemSubtype][Math.floor(Math.random() * giftLoot[itemSubtype].length)]
        }
    }
    log(`Chosen loot to be ${itemModification.data.giftLoot}`)
    return itemModification
}

module.exports = {
    add: {
        image_perms: image_perms_add,
        gift: gift_add
    },
    remove: {
        image_perms: image_perms_remove
    }
}
