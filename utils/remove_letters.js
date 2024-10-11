const { log } = require("./logger")

/**
 * Removes all letters from a string, only leaving the numbers, it also converts the resulting string into a number
 * @param {string} string The string to manipulate
 * @returns {number}
 */
function removeLetters(string) {
    const str = string.replace(/[^0-9]/g, "")
    return Number(str)
}

module.exports = removeLetters