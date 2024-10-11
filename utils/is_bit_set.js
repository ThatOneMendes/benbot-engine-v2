/**
 * Returns true if bit at position is set, used for item flags.
 * @param {number} num 
 * @param {number} pos 
 * @returns {boolean}
 */
const isBitSet = (num, pos) => ((num >> pos) & 1) == 1
module.exports = isBitSet