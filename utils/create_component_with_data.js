const { ActionRowComponent } = require("discord.js")
/**
 * 
 * @param {*} component 
 * @param {*} data
 */
function createComponentWithData(component, data) {
    Object.keys(data).forEach(key => {
        component.data[key] = data[key]
    })
    return component
}

module.exports = createComponentWithData