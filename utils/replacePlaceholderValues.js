/**
 * Replaces all occourences of something in a message with another thing.
 * @param {String} message The string to replace values
 * @param {object} replaceObject 
 */
function replacePlaceholderValues(message, replaceObject) {
    Object.keys(replaceObject).forEach(key => {
        message = message.replaceAll(key, replaceObject[key])
    })
    return message
}

module.exports = replacePlaceholderValues