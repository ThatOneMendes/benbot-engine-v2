const { defaultInventory } = require("../config/main.json")
const { stats } = defaultInventory
/**
 * 
 * @param {defaultInventory} inventory 
 * @param {*} userData 
 */
function determine(inventory, userData) {
    if(typeof(inventory.stats) === "undefined") {
        inventory.stats = stats
    }
    Object.keys(stats).forEach((stat, _i, arr) => {
        if(typeof(inventory.stats[stat]) === "undefined") inventory.stats[stat] = -1
        if(inventory.stats[stat] > -1) return
        inventory.stats[stat] = Math.floor( Math.random() * 13 ) + Math.floor(userData.level / arr.length)
        console.log(`stat ${stat} is now ${inventory.stats[stat]}`)
        if(stat !== "freePoints") return
        inventory.stats[stat] = userData.level + Math.floor( Math.random() * (userData.level * 4) )
    })
    return inventory
}

module.exports = determine