const {
  disabledLoggerPriorities,
  loggerEnabled,
} = require("../config/main.json");
const { formatWithOptions } = require("node:util");

const logPriority = Object.freeze({
    error: "\u001b[31m",
    warn: "\u001b[33m",
    log: "\u001b[32m",
});

/**
 * logs a message.
 * @deprecated Use logMessage instead.
 * @param {string} message the message to print
 * @param {*} priority the priority
 * @param {*} dontColorLog color?
 * @returns 
 */
function log(message, priority = logPriority.log, dontColorLog = false) {
    if (!loggerEnabled) return;
    if (disabledLoggerPriorities.indexOf(priority) !== -1) return;
    
    const formattedLog = formatWithOptions(
        {
            colors: dontColorLog === true ? false : true
        },
        message
    )

    process.stdout.write(`${formattedLog}\n`)

    return formattedLog
}

/**
 * The new, superior way of logging messages!
 * @param {logPriority} priority What color will the log have, and if it can be logged at all (can be changed in the config file)
 * @param {boolean} dontColorLog Do we put color in the log?
 * @param  {...any} messages All the messages you want to print!
 * @returns {string[]} An array of the logged strings, WITH color if specified!
 */
function logMessage(settings = {priority: logPriority.log, dontColorLog: false}, ...messages) {
    if(!loggerEnabled) return
    let priority = logPriority.log
    let dontColorLog = false
    if(settings?.constructor == Object) {
        priority = settings.priority ?? logPriority.log
        dontColorLog = settings.dontColorLog ?? false
        if(disabledLoggerPriorities.includes(priority) === true) return;
    } else {
        messages = [settings].concat(messages)
    }

    const formattedMessages = []

    messages.forEach((message) => {
        const formattedLog = formatWithOptions(
            {
                colors: dontColorLog
            },
            message
        )
        
        let printMessage = `${dontColorLog === true ? "" : priority}${formattedLog}\u001b[0m `

        process.stdout.write(printMessage)
        formattedMessages.push(printMessage)
    })

    process.stdout.write("\n")

    return formattedMessages
}

module.exports = {
    logPriority,
    log,
    logMessage
};
