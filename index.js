const {
    Client,
    REST,
    Routes,
    Collection,
    GatewayIntentBits,
    Events,
    ActivityType,
    AllowedMentionsTypes
} = require('discord.js');

const {
    botToken,
    clientID,
    commandsFolderPath,
    clientEvents,
    clientEventsPath,
    botVersion,
    subcommandsFolder,
    privilegedRoles,
    allowedPings
} = require('./config/main.json');

const items = require("./config/items.json")

const wallpapers = require("./config/wallpapers.json")

const { statusArray } = require("./config/messages.json")
const Canvas = require('@napi-rs/canvas')

Canvas.GlobalFonts.registerFromPath('./media/fonts/fredoka_one.ttf', 'Fredoka One')
Canvas.GlobalFonts.registerFromPath('./media/fonts/noto_color_emoji.ttf', 'Noto Color Emoji')


const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences
    ],
    allowedMentions: {
        parse: [
            AllowedMentionsTypes.User
        ],
        roles: privilegedRoles.concat(allowedPings)
    }
});

const fs = require('node:fs');
const { log, logPriority } = require('./utils/logger');
const shuffle = require('./utils/shuffle_array');
const itemFlags = require('./config/item_flags.json');
const { errorLog, saveData } = require('./utils/database_functions');
const invalidateCache = require("./utils/invalidate_cache");
const { Worker } = require("node:worker_threads")

async function refreshCommands() {
    const subcommandsFolders = fs.readdirSync(subcommandsFolder, {withFileTypes: true})
    subcommandsFolders.forEach(folder => {
        const subcommands = fs.readdirSync(`${subcommandsFolder}/${folder.name}`)
        subcommands.forEach(subcommand => {
            log(`${subcommandsFolder}${folder.name}/${subcommand}`)
            invalidateCache(`${subcommandsFolder}/${folder.name}/${subcommand}`)
        })
    })

    client.commands = new Collection();

    const commandFiles = fs.readdirSync(commandsFolderPath, {flag: 'rs'}).filter(file => file.endsWith('.js'));
    log(commandsFolderPath)

    for(const file of commandFiles) {
        const filePath = `${commandsFolderPath}/${file}`;
        log(filePath)
        invalidateCache(filePath)
        const command = require(filePath);
        if('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            log(`The command at ${filePath} is missing a required "data" or "execute" property.`, logPriority.warn)
        }
    }
    const commands = [];

    for(const file of commandFiles) {
        const command = require(`${commandsFolderPath}/${file}`);
        command.data.setDMPermission(false);
        commands.push(command.data.toJSON());
    }

    const rest = new REST({
        version: '10'
    }).setToken(botToken);

    try {
        const data = await rest.put(
            Routes.applicationCommands(clientID), {
                body: commands
            }
        );

        log(`Registered ${data.length} commands in benco`, logPriority.log)
    } catch (err) {
        log(err)
        return false
    }

    return true
}

client.on(Events.ClientReady, async (client) => {
    process.once("SIGINT", () => {
        saveData(true, client)
    })
    process.once("SIGTERM", () => {
        saveData(true, client)
    })
    process.once("SIGQUIT", () => {
        saveData(true, client)
    })
    process.on("uncaughtException", errorLog.bind(null, client))
    process.on("unhandledRejection", errorLog.bind(null, client))
    await refreshCommands()
    clientEvents.forEach(event => {
        log(`Registring event ${event}!`)
        const eventPath = `${clientEventsPath}/${event}.js`
        if(!fs.existsSync(eventPath)) return log(`Registration failed! There is no path for this event!`, logPriority.warn);

        const eventScript = require(eventPath)
        client.on(event, (eventScript?.run ?? eventScript).bind(null, client, module.exports))
        log(`Registration at ${eventPath} successful!`)
    })
    log("Bot ready to go! Setting up status now...")
    changeStatus()
    log("Setting up status refresh interval...")
    setInterval(changeStatus, 300000)
})

client.login(botToken)

function changeStatus(customStatus) {
    const status = customStatus ?? statusArray[Math.floor(Math.random() * (statusArray.length - 1))]
    const statusConverted = {}
    statusConverted.type = ActivityType[status.type]
    statusConverted.name = botVersion+status.name

    client.user.setPresence(
        {
            activities: [
                statusConverted
            ],
            status: "dnd"
        }
    )
    /*client.user.setActivity({
        name: replacePlaceholderValues(customActivity ?? statusState, {"{version}": botVersion})
    })*/
}

module.exports = {
    shopItems: new Map(),
    shopLastUpdated: 0,
    itemsAutoComplete: {
        vanity: [],
        ids: []
    },
    shopWallpapers: [],
    wallpaperAutoComplete: {
        vanity: [],
        ids: []
    },
    refreshCommands: refreshCommands
}

Object.keys(items).forEach(itemID => { // add items and their names to an object with 2 arrays that are gonna be used
    // in autocompletes and such.
    const item = items[itemID]
    Object.keys(item.subtypes).forEach(subtypeID => {
        const subtype = item.subtypes[subtypeID]
        module.exports.itemsAutoComplete.vanity.push(subtype.itemName)
        module.exports.itemsAutoComplete.ids.push(`${itemID}|${subtypeID}`)
    })
})

Object.keys(wallpapers).forEach(wallpaperID => {
    const wallpaper = wallpapers[wallpaperID]
    module.exports.wallpaperAutoComplete.vanity.push(wallpaper.name)
    module.exports.wallpaperAutoComplete.ids.push(wallpaperID)
})

function stockShop() {
    log("Restock begin...", logPriority.log)
    module.exports.shopItems.clear()
    module.exports.shopWallpapers = []
    while(3 > module.exports.shopItems.size) {
        shuffle(Object.keys(items)).forEach(itemID => {
            if(module.exports.shopItems.size >= 3) return
            const item = items[itemID]
            log(itemID)
            log(
                item.flags
            )
            if(item.flags.find(flag => flag == itemFlags.unobtainable) || item.flags.find(flag => flag == itemFlags.cannotAppearInShop)) return;
            const itemSubtypes = Object.keys(item.subtypes)
            const chosenSubtype = itemSubtypes[Math.floor(Math.random() * itemSubtypes.length)]
            if(module.exports.shopItems.has(`${itemID}|${chosenSubtype}`)) return
            module.exports.shopItems.set(`${itemID}|${chosenSubtype}`, Math.floor(Math.random() * 9) + 1)
        })
    }
    while(4 > module.exports.shopWallpapers.length) {
        shuffle(Object.keys(wallpapers)).forEach(wallpaperID => {
            if(module.exports.shopWallpapers.length >= 4) return
            const wallpaper = wallpapers[wallpaperID]
            if(!wallpaper.obtainable) return;
            if(module.exports.shopWallpapers.indexOf(wallpaperID) != -1) return
            module.exports.shopWallpapers.push(wallpaperID)
        })
    }
    module.exports.shopLastUpdated = Date.now()
    log("Shop restocked!", logPriority.log)
    log("--------- SHOP MAP (ITEMS) ---------", logPriority.log, true)
    log(module.exports.shopItems)
    log("--------- SHOP MAP (WALLPAPERS) ---------", logPriority.log, true)
    log(module.exports.shopWallpapers)
}

stockShop() // stock shop when process starts

setInterval(stockShop, 1800000)