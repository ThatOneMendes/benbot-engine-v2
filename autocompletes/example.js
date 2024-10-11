const { Client, AutocompleteInteraction } = require("discord.js");

module.exports = {
    /**
     * 
     * @param {Client} client 
     * @param {object} indexModules 
     * @param {AutocompleteInteraction} interaction 
     */
    async execute(_client, _indexModules, interaction) {
        // This is an example autocomplete handler
        // if you dont know what you're reading then you better start readin'
        // discord js' API docs!
        const focusedOption = interaction.options.getFocused(true)

        switch(focusedOption.name) {
            case "example":
                const miProducts = [
                    {
                        name: "mi car",
                        value: "fastboot_erase_abl"
                    },
                    {
                        name: "ximi rat",
                        value: "bricked"
                    }
                ]
                let miProductsFiltered = miProducts.filter(miProduct => miProduct.name.toLowerCase().startsWith(focusedOption.value.toLowerCase()))
                let miProductsParsed = []
                miProductsFiltered.forEach(miProduct => {
                    miProductsParsed.push(
                        {
                            name: miProduct.name,
                            value: miProduct.value
                        }
                    )
                })
                await interaction.respond(miProductsParsed.slice(0, 25))
            break;
        }
    }
}