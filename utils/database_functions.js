const UserData = require('../modules/user')
const fs = require('node:fs')
const { defaultValues } = require('../config/models/user.json')
const { log, logPriority } = require('./logger')
const { defaultInventory, boosterRoleID, ignoreUsersLeaderboard, shutdown_upon_exception } = require("../config/main.json")
const items = require('../config/items.json')
const onUserInventoryUpdated = require('../utils/on_user_inventory_updated.js')
const { Collection, GuildMember, GuildMemberRoleManager, Client, ShardingManager } = require('discord.js')
const { Op } = require('sequelize');
const itemFlags = require("../config/item_flags.json")
const sendMessageToLogs = require("./send_message_in_logs.js")
const _ = require('lodash')
const replacePlaceholderValues = require('./replacePlaceholderValues.js')
const userDataMap = new Collection()
const { shutdown_after_error, error_but_not_shutdown } = require("../config/messages.json")

/**
 * Loads and returns an user's data
 * @param {User} user An ```User``` object.
 * @returns {any}
 */
async function loadUserData(user) {
    if(userDataMap.has(user.id)) {
        const userData = userDataMap.get(user.id)
        userData.inventory = await validateInventory(userData.inventory, userData)
        return userData
    }
    const [userData, created] = await UserData.findOrCreate({
        where: { id: user.id },
        defaults: defaultValues
    })
    if(created) {
        userData.inventory = JSONtoBuffer(defaultInventory)
        await userData.save()
    } else {
        userData.inventory = await validateInventory(userData.inventory, userData)
    }
    userDataMap.set(user.id, userData)
    return userData
}

/**
 * 
 * @param {Buffer} inventoryBuffer 
 * @param {*} userData 
 * @returns {Promise<defaultInventory>}
 */
function validateInventory(inventoryBuffer, userData) {
    return new Promise(res => {
        let userInventory = bufferToJSON(inventoryBuffer)
        Object.keys(defaultInventory).forEach(async key => {
            if(fs.existsSync(`./inventory_validation/${key}.js`)) {
                const value = await (require(`../inventory_validation/${key}.js`)(userInventory, userData));
                if(typeof(value) === "undefined") return;
                userInventory[key] = value
                return
            }
            if(typeof(userInventory[key]) === "undefined") {
                log(key+" is undefined!")
                userInventory[key] = defaultInventory[key]
            }
        })
        res(JSONtoBuffer(userInventory))
    })
}

/*if (process.platform === "win32") {
    var rl = require("readline").createInterface({
        input: process.stdin,
        output: process.stdout
    });
  
    rl.on("SIGINT", function () {
        process.emit("SIGINT");
    });
}*/

let SAVINGDATA = false

/**
 * 
 * @param {boolean} shutDown shall the bot shutdown after saving?
 */
const saveData = async (shutDown = true, client, saveData = true) => {
    if(SAVINGDATA) return
    if(shutDown && client?.constructor === Client) await client.destroy()
    SAVINGDATA = saveData
    if(saveData === false) {
        if(shutDown) process.exit(0);
        return
    }

    return new Promise(async res => {
        log(`Saving user data...`, logPriority.log)
        if(userDataMap.size == 0) return process.exit(0)
        const delay = time => new Promise(res=>setTimeout(res,time));

        for(let i = 0; i < userDataMap.size; i++) {
            log(i)
            const userData = userDataMap.at(i)
            userData.benCoins = Math.round(userData.benCoins)
            await userData.save().catch(e => {
                log("Error when saving data for entry with ID: "+userData.id)
                log(e)
            })
            await delay(1000)
        }

        if(shutDown === true) return res(process.exit(0))

        SAVINGDATA = false

        return res()
    })
}

setInterval(() => {
    saveData(false, null, true)
}, 600000);

const errorLog = async (client, e) => {
    const error = log(e)
    const errorMessage = {
        content: replacePlaceholderValues(
            shutdown_upon_exception === true ? shutdown_after_error : error_but_not_shutdown,
            {
                "{error}": error
            }
        )
    }
    if (client?.constructor === Client) await sendMessageToLogs(errorMessage, client)
    saveData(shutdown_upon_exception, client, shutdown_upon_exception)
}

/**
 * Reads or write from ```bot.json```
 * @param {String} request What action will be done? (Write or read?)
 * @param {{property: String, value: any} | String} value An object (or ```String``` if ```request``` is set to ```"get"```) with 2 keys: ```property``` and ```value```.
 * 
 * If ```request``` is equal to ```"set"```, ```value.property``` points to a key in ```bot.json```, and ```value.value``` is the new value to be written.
 * 
 * If ```request``` is equal to ```"get"``` however, ```value``` is a string that points to a key in ```bot.json```
 * @returns {any}
 */
async function botDataManager(request, value) {
    const botData = JSON.parse(fs.readFileSync(`./config/bot.json`, {flag: 'rs'}).toString('utf8'))
    switch(request) {
        case "get":
            if(!value) return botData
            return botData[value]
        case "set":
            botData[value.property] = value.value
            fs.writeFileSync('./config/bot.json', JSON.stringify(botData, null, 4), {flag: 'rs'})
        break;
    }
}
/**
 * Converts a ```Object``` into a ```Buffer```. This function is used to convert a object into a buffer that then can be stored in the database.
 * @param {defaultInventory} json 
 * @returns {Buffer}
 */
function JSONtoBuffer(json) {
    const stringJSON = JSON.stringify(json)
    const base64Buffer = Buffer.from(stringJSON)
    //log(stringJSON)
    return base64Buffer
}

/**
 * Converts a ```Buffer``` into a ```Object```.
 * @param {Buffer} buffer 
 * @returns {defaultInventory}
 */
function bufferToJSON(buffer) {
    const stringJSON = buffer.toString()
    //log(stringJSON)
    return JSON.parse(stringJSON)
}

/**
 * Gets a number and then rounds it to the closer multiple of five.
 * 
 * @param {Number} number 
 * @param {Boolean} floorNumber 
 * @returns {Promise<Number>}
 */
function makeNumberDivisibleBy5(number, floorNumber) {
    if(typeof(number) !== "number") throw "number is not a number!"
    while(number % 5 !== 0) {
        if(floorNumber) {
            number = Math.floor(number) -1
        } else {
            number = Math.ceil(number) + 1
        }
    }
    return number
}

/**
 * Takes a ```GuildMember``` and a ```Number``` and returns another number which is how many slots that ```GuildMember``` has.
 * @param {GuildMember} guildMember The ```GuildMember``` to check, if said member is a server booster, that member will get + 10 extra slots.
 * @param {Number} inventorySpaceBoosts A number that dictates how many inventory space boosts an user has. Each boost gives 2 extra slots.
 * @returns {Promise<Number>} How many inventory slots that user has.
*/
async function getMemberMaxInventorySlots(guildMember, inventorySpaceBoosts = 0) {
    return new Promise(async resolve => {
        if(!(guildMember instanceof GuildMember) || typeof(inventorySpaceBoosts) != 'number') return resolve(25);
        let defaultMaxSlots = 25
        guildMember = await guildMember.fetch()
        const memberRoles = guildMember.roles

        memberRoles.cache.forEach(role => {
            if(role.id == boosterRoleID) defaultMaxSlots += 10
        })

        defaultMaxSlots += 2 * inventorySpaceBoosts

        resolve(defaultMaxSlots)
    })
}

/**
 * Adds an item to an user's inventory. Returns numbers to represent errors (if an item is added with success this function returns an object instead).
 *
 * **CODES:**
 * 
 * **-1** - Invalid argument(s)
 * 
 * **0** - Inventory full!
 * 
 * **1** - You can only have one of (x) item!
 * 
 * @returns {Promise<defaultInventory|Number>}
 * @param {defaultInventory} [inventory] The users inventory data
 * @param {String} itemID The ID of the item
 * @param {String} itemSubtype The item subtype, will default to ```item.mainSubtype``` if ommited or if invalid
 * @param {Object} subtypeModifications An object containing values that will get written to the subtype data of the item being added.
 * 
 * Lets assume that you want to give x person a xp boost with 90 uses, then this argument should be an object like this: ```{uses: 90}```.
 * 
 * When creating the item, if ```subtypeModifications``` is not undefined, the function will loop through all keys in an item's subtype data, if it finds a key in the ```subtypeModifications``` argument, it will overwrite the default value with the one in ```subtypeModifications```.
 * @param {GuildMember} guildMember An GuildMember object from the user.
 */
async function addItemToInventory(inventory = null, itemID, itemSubtype, subtypeModifications, guildMember) {
    if(inventory?.constructor !== Object) {
        log("Inventory is NOT an object");
        return -1;
    }
    if(typeof(itemID) !== "string") {
        log("Item ID is NOT a string")
        return -1
    }
    if(typeof(itemSubtype) !== "undefined" && typeof(itemSubtype) != "string") {
        log("Item subtype is NOT a string");
        return -1
    }
    if(typeof(guildMember) !== "undefined" && !(guildMember instanceof GuildMember)) {
        log("Guild member is NOT a GuildMember")
        return -1
    }
    if(typeof(subtypeModifications) !== "undefined" && subtypeModifications?.constructor !== Object) {
        log("subtypeModifications is NOT an object!")
        return -1
    }
    if(!items[itemID]) return -1;

    return new Promise(async resolve => {
        const itemData = items[itemID]
        let subtypeData = subtypeModifications ?? itemData.subtypes[itemSubtype ?? itemData.mainSubtype].subtypeData
        log(subtypeData)

        if(itemData.flags.find(flag => flag == itemFlags.canOnlyHaveOne)&& itemExist(inventory, itemID)) {
            log("Can only have one of item")
            return resolve(1)
        }

        const maxInventorySpace = await getMemberMaxInventorySlots(guildMember, inventory.inventorySpaceBoosts)

        let addedItem = false

        for (let i = 0; i < inventory.items.length; i++) {
            const item = inventory.items[i];
            if(!items[item.itemID] || !items[item.itemID].subtypes[item.itemSubtype]) continue;
            const itemStackable = items[item.itemID].stackable
            const itemIDIsTheSame = item.itemID === itemID
            const subtypeDataMatchesItem = _.isEqual(subtypeData, item.data)
            const itemSubtypeIDMatches = item.itemSubtype === (itemSubtype ?? itemData.mainSubtype)
            const itemMaxStackReached = item.itemCount + 1 > itemData.maxStack

            if(itemIDIsTheSame && subtypeDataMatchesItem && itemSubtypeIDMatches && itemStackable && !itemMaxStackReached) {
                log("Found item to add")
                addedItem = true;
                inventory.items[i].itemCount++
                break;
            }
        }

        let createdItem = {
            itemID: itemID,
            data: subtypeData,
            itemSubtype: itemSubtype ?? itemData.mainSubtype,
            itemCount: 1
        }

        if(guildMember && onUserInventoryUpdated.add[itemID]) {
            const itemModifications = await onUserInventoryUpdated.add[itemID](guildMember, itemSubtype, subtypeModifications)
            if(itemModifications?.constructor == Object) {
                Object.keys(itemModifications).forEach(itemMod => {
                    createdItem[itemMod] = itemModifications[itemMod]
                })
            }
        }

        if(!addedItem) {
            log("Creating item from thin air")
            //if we didnt found an already existing item to add up, create said item in inventory.
            inventory.items.push(createdItem)
        }

        if(inventory.items.length > maxInventorySpace) return resolve(0)

        resolve(inventory)
    })
}

/**
 * Removes an item from one's inventory, returns a modified inventory if successful, if not successful, this function returns numbers instead.
 * 
 * **CODES:**
 * 
 * **-1** - Invalid argument(s)
 * 
 * **0** - Inventory empty!
 * 
 * **1** - Item not found.
 * 
 * @param {defaultInventory} inventory One's inventory
 * @param {String} itemID The ID of the item thats going to be deleted.
 * @param {String} itemSubtype The subtype of that item, if this is not ommited, the function will only erase items with that subtype. 
 * 
 * However, if this value is ommited, the function will delete any item with that id, regardless of the subtype ID.
 * @param {Number} amount The amount of the item to be erased.
 * @param {GuildMember} guildMember A GuildMember object from the user. 
 * @returns {Promise<defaultInventory|Number>} 
 */
function removeItemFromInventory(inventory = null, itemID, itemSubtype, amount = 1, guildMember, atSlot) {
    if(amount <= 0) return -1;
    if(inventory?.constructor != Object) {
        log("Inventory is NOT an object");
        return -1;
    }
    if(typeof(itemID) != "string") {
        log("Item ID is NOT a string")
        return -1
    }
    if(typeof(itemSubtype) != "undefined" && typeof(itemSubtype) != "string") {
        log("Item subtype is NOT a string");
        return -1
    }
    if(typeof(guildMember) != "undefined" && !(guildMember instanceof GuildMember)) {
        log("Guild member is NOT a GuildMember")
        return -1
    }
    if(typeof(atSlot) == "number" && (atSlot < 0 || atSlot % 1 !== 0)) {
        log("atSlot argument is NOT a integer, or its a negative number!")
        return -1
    }
    if(inventory.items.length == 0) return 0;

    let removedItem = false;

    return new Promise((resolve) => {
        if(typeof(atSlot) == "number") {
            inventory.items = inventory.items.map((e, index) => {
                if(index === atSlot) {
                    log("Slot found!")
                    e.itemCount -= amount
                }
                return e
            }).filter(e => e.itemCount > 0)
            removedItem = true
        } else {
            for (let i = 0; i < inventory.items.length; i++) {
                const item = inventory.items[i]
                
                if(item.itemID == itemID) {
                    if(itemSubtype != undefined && item.itemSubtype != itemSubtype) continue;

                    removedItem = true
        
                    if(item.itemCount - amount <= 0) {
                        inventory.items = inventory.items.filter((e, index) => index != i)
                    } else {
                        inventory.items[i].itemCount -= amount
                    }
        
                    amount -= item.itemCount
        
                    if(amount <= 0) break;
                }
            }
        }

        if(!removedItem) {
            return resolve(1)
        } else {
            if(guildMember && onUserInventoryUpdated.remove[itemID]) onUserInventoryUpdated.remove[itemID](guildMember)
            return resolve(inventory)
        }
    })
}

/**
 * Checks if an item exists in one's inventory.
 * 
 * @param {defaultInventory} inventory
 * @param {String} itemID
 * @param {String | undefined} itemSubtype
 * @returns {Boolean}
 */
function itemExist(inventory, itemID, itemSubtype) {
    if(inventory?.constructor != Object) return false;
    if(typeof(itemID) != "string") return false;
    if(typeof(itemSubtype) != "undefined" && typeof(itemSubtype) != "string") return false;
    if(inventory.items.length == 0) return false;
    let itemExists = false

    for (let i = 0; i < inventory.items.length; i++) {
        const item = inventory.items[i]
        
        if(item.itemID == itemID) {
            if(typeof(itemSubtype) != "undefined" && item.itemSubtype != itemSubtype) continue;

            itemExists = true

            break;
        }
    }

    return itemExists
}

/**
 * Returns how many items of the same id or subtype there is on one's inventory.
 * 
 * @param {defaultInventory} inventory 
 * @param {String} itemID 
 * @param {String | undefined} itemSubtype 
 * @returns {Number}
 */
function getItemCount(inventory, itemID, itemSubtype) {
    if(inventory?.constructor != Object) return 0;
    if(typeof(itemID) != "string") return 0;
    if(typeof(itemSubtype) != "undefined" && typeof(itemSubtype) != "string") return 0;
    if(inventory.items.length == 0) return 0;
    let itemCount = 0

    for (let i = 0; i < inventory.items.length; i++) {
        const item = inventory.items[i]
        
        if(item.itemID == itemID) {
            if(typeof(itemSubtype) != "undefined" && item.itemSubtype != itemSubtype) continue;

            itemCount += item.itemCount;
        }
    }

    return itemCount
}

/**
 * Finds an item and returns its index. Returns -1 if an item is not found.
 * 
 * @param {defaultInventory} inventory 
 * @param {String} itemID 
 * @param {String | undefined} itemSubtype 
 * @returns {Number}
 */
function findSlotByItem(inventory, itemID, itemSubtype) {
    if(inventory?.constructor != Object) return -1;
    if(typeof(itemID) != "string") return -1;
    if(typeof(itemSubtype) != "undefined" && typeof(itemSubtype) != "string") return -1;
    if(inventory.items.length == 0) return -1;
    let itemIndex = -1

    for (let i = 0; i < inventory.items.length; i++) {
        const item = inventory.items[i]
        
        if(item.itemID == itemID) {
            if(typeof(itemSubtype) != "undefined" && item.itemSubtype != itemSubtype) continue;

            itemIndex = i

            break;
        }
    }

    return itemIndex
}

async function generateLeaderboard() {
    bencoins: {
        /**
         * @type {Array}
         */
        let userDataArray = await UserData.findAll({
            where: {
                benCoins: {
                    [Op.gt]: 1
                },
                id: {
                    [Op.notIn]: ignoreUsersLeaderboard
                }
            }
        })
        userDataArray = userDataArray.map(userData => {
            if(userDataMap.has(userData.id)) return userDataMap.get(userData.id);
            return userData
        }).sort((a,b) => a.benCoins - b.benCoins).slice(19).reverse()
        const neededData = []
        userDataArray.forEach(userData => neededData.push({id: userData.id, value: userData.benCoins}))
        module.exports.leaderboard.benCoins.leaderStats = [].concat(neededData,[])
        module.exports.leaderboard.benCoins.updatedAt = Date.now()
    }
    level: {
        /**
         * @type {Array}
         */
        let userDataArray = await UserData.findAll({
            where: {
                level: {
                    [Op.gt]: 1
                },
                id: {
                    [Op.notIn]: ignoreUsersLeaderboard
                }
            }
        })
        userDataArray = userDataArray.map(userData => {
            if(userDataMap.has(userData.id)) return userDataMap.get(userData.id);
            return userData
        }).sort((a,b) => a.level - b.level).slice(19).reverse()
        const neededData = []
        userDataArray.forEach(userData => neededData.push({id: userData.id, value: userData.level}))
        module.exports.leaderboard.level.leaderStats = [].concat(neededData,[])
        module.exports.leaderboard.level.updatedAt = Date.now()
    }
}

/**
 * Runs a function for every single entry in the database.
 * @param {(userData, index, userDataArray) => void} func 
 */
async function everyDatabaseEntry(func) {
    /**
     * @type {Array}
     */
    const userDataArray = await UserData.findAll()
    userDataArray.map(userData => {
        if(userDataMap.has(userData.id)) return userDataMap.get(userData.id);
        return userData
    }).forEach(func)
    return true
}

generateLeaderboard()

setInterval(generateLeaderboard,1800000)

module.exports = {
    loadUserData: loadUserData,
    botDataManager: botDataManager,
    bufferToJSON: bufferToJSON,
    JSONtoBuffer: JSONtoBuffer,
    makeNumberDivisibleBy5: makeNumberDivisibleBy5,
    addItemToInventory: addItemToInventory,
    removeItemFromInventory: removeItemFromInventory,
    getMemberMaxInventorySlots: getMemberMaxInventorySlots,
    itemExist: itemExist,
    getItemCount: getItemCount,
    findSlotByItem: findSlotByItem,
    saveData: saveData,
    errorLog: errorLog,
    userDataMap: userDataMap,
    leaderboard: {
        benCoins: {
            updatedAt: Date.now(),
            leaderStats: []
        },
        level: {
            updatedAt: Date.now(),
            leaderStats: []
        }
    },
    everyDatabaseEntry: everyDatabaseEntry
}
