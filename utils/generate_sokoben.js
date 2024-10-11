const sokobenConfig = require("../config/commands/fun/sokoben.json")
const Sokoban = require("sokoban-engine");

/**
 * Generates a sokoben game.
 * @param {{fieldX:number,fieldY:number,boxes:number}} gameInfo
 * @returns {Sokoban} 
 */
function generateSokoben(gameInfo) {
    const {fieldX, fieldY, boxes} = gameInfo
    let sokobenGame = new Sokoban(
        fieldX,
        fieldY,
        {
            boxes: boxes,
            entityAppearance: sokobenConfig.sokoOptions,
        }
    )
    return sokobenGame
}

module.exports = generateSokoben