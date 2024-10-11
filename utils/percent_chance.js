function percentChance(chance) {
    return Math.fround(Math.random() * 100) <= chance // the thing needs to be a float in order to have chances like 0.2% :innocent:
    // fun fact: i "borrowed" this function from Streets of Rogue.
}

module.exports = percentChance