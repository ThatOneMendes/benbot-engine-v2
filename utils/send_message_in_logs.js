const { Client, Message } = require("discord.js");
const { logChannelID } = require("../config/main.json");
const { log } = require("./logger");

/**
 * Sends a message in the server logs
 * @param {object} messageObject 
 * @param {Client} client 
 * @returns {Promise<Message}
 */
async function sendMessageInLogs(messageObject, client) {
    const channel = await client.channels.fetch(logChannelID).catch(e => {
        log(e)
        return null
    })
    if(!channel) return null;
    const message = await channel.send(messageObject).catch(e => {
        log(e)
        return null
    })
    return message
}

module.exports = sendMessageInLogs