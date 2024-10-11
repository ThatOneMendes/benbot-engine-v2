const items = require("../config/items.json")

const itemNames = {}

Object.keys(items).forEach(itemID => {
    const item = items[itemID]
    Object.keys(item.subtypes).forEach(itemSubtype => {
        const itemSubtypeData = item.subtypes[itemSubtype]
        itemNames[itemSubtypeData.itemName] = `${itemID}|${itemSubtype}`
    })
})

/**
 * Filters all items and returns an array containing the ID of every item that passed through the filter
 * @param  {...(itemName : string, itemData: object) => boolean} filters An array containing functions to be run by the filter, if the result of the function is true, it will get included on the return array.
 * @returns {string[]}
*/
function autocompleteFilterItems(...filters) {
    let itemsFiltered = []
    filters.forEach(filter => {
        const itemNamesArray = Object.keys(itemNames)
        itemNamesArray.forEach(itemName => {
            const itemData = itemNames[itemName]
            const success = filter(itemName, itemData);
            if(success) itemsFiltered.push(itemData)
        })
    })
    let choicesArray = []

    itemsFiltered.forEach(itemData => {
        const [itemID, itemSubtype] = itemData.split("|")
        const choice = {
            name: items[itemID].subtypes[itemSubtype].itemName,
            value: itemData
        }
        choicesArray.push(choice)
    })

    return choicesArray
}

module.exports = autocompleteFilterItems