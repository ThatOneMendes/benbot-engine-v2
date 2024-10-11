const { SlashCommandBuilder } = require("discord.js");
const applyChoicesFromArray = require("./apply_choices_from_array")
const { log } = require("./logger")

/**
 * Returns a `SlashCommandBuilder` if given a command `json`
 * @param {object} commandData
 * @returns {SlashCommandBuilder}
*/
function registerCommands(commandData) {
    const slashCommand = new SlashCommandBuilder()
    slashCommand.setName(commandData.commandName ?? errorOut("Property \"commandName\" is missing!"))
    slashCommand.setDescription(commandData.commandDesc ?? errorOut("Property \"commandDesc\" is missing!"))
    if(typeof(commandData.subcommandData) !== "undefined") {
        Object.values(commandData.subcommandData).forEach(addSubcommand.bind(null, slashCommand))
    } else if(typeof(commandData.options) !== "undefined") {
        sortOps(Object.values(commandData.options)).forEach(addOption.bind(null, slashCommand))
    }
    return slashCommand
}

/**
 * Sorts all options, required options first, then non required ones! (its needed because discord api.)
 * @param {object[]} options
 * @returns {object[]}
*/
function sortOps(options) {
    return options.sort((a, b) => {
        if((a.required ?? false) === true && (b.required ?? false) === false) return -1;
        if((a.required ?? false) === false && (b.required ?? false) === true) return 1;
        return -2;
    })
}

/**
 * @param {object} commandData 
 * @param {SlashCommandBuilder} slashCommand
*/
function addSubcommand(slashCommand, subcommand) {
    slashCommand.addSubcommand(subc => {
        subc.setName(subcommand.commandName ?? errorOut(`Subcommand with data ${JSON.stringify(subcommand, null, 4)} missing "commandName" property!`))
        subc.setDescription(subcommand.commandDesc ?? errorOut(`Subcommand with name ${subcommand.commandName} missing "commandDesc" property!`))
        if(typeof(subcommand.options) === "undefined") return subc;
        sortOps(Object.values(subcommand.options)).forEach(option => {
            subc = addOption(subc, option)
        })
        return subc
    })
}

function addOption(subcommand, option) {
    if(typeof(option.optionType) === "undefined") errorOut(`Option with name ${option.optionName} (data: ${JSON.stringify(option, null, 4)}) is missing an option type!`)
    subcommand[`add${option.optionType}Option`](o => {
        o.setName(option.optionName ?? errorOut(`Option name for option ${JSON.stringify(option, null, 4)} is missing!`))
        o.setDescription(option.optionDesc ?? errorOut(`Option description for option ${option.optionName} is mising!`))
        o.setRequired(option.required ?? false)
        o = parseSpecialOptionTypes(option, o)
        if(typeof(option.choices) !== "undefined") {
            o = applyChoicesFromArray(o, option.choices)
        }
        if(option.autocomplete === true) {
            log("Autocomplete found for option: " + option.optionName)
            o.setAutocomplete(true)
        }
        return o
    })
    return subcommand 
}

function parseSpecialOptionTypes(option, o) {
    switch(option.optionType) {
        case "Number":
        case "Integer":
            if(typeof(option.minValue) !== "undefined") o.setMinValue(option.minValue);
            if(typeof(option.maxValue) !== "undefined") o.setMaxValue(option.maxValue);
        break;
        case "String":
            if(typeof(option.minLength) !== "undefined") o.setMinLength(option.minLength);
            if(typeof(option.maxLength) !== "undefined") o.setMaxLength(option.maxLength);
        break;
        case "Channel":
            if(typeof(option.channelTypes) !== "undefined") o.addChannelTypes(option.channelTypes);
        break;
    }
    return o
}

function errorOut(err) {
    throw err
}

module.exports = registerCommands
