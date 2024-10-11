const { SlashCommandOptionsOnlyBuilder } = require("discord.js")
/**
 * Gets an array of choices and apply those choices to an option builder.
 * @param {SlashCommandOptionsOnlyBuilder} slashCommandBuilderOption 
 * @param {{name: string, value: any}[]} choicesArray
 * @returns {SlashCommandOptionsOnlyBuilder}
 */
function applyChoicesFromArray(slashCommandBuilderOption, choicesArray) {
    if(!Array.isArray(choicesArray)) throw `choices array is NOT an array! (choicesArray value: ${choicesArray})`
    if(!slashCommandBuilderOption) throw "slashCommandBuilderOption is missing!"

    choicesArray.forEach(choice => {
        slashCommandBuilderOption.addChoices(choice)
    })

    return slashCommandBuilderOption
}

module.exports = applyChoicesFromArray