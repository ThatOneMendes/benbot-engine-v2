const abbreviations = {
    N: 10 ** 30,
	O: 10 ** 27,
	Sp: 10 ** 24,
	Sx: 10 ** 21,
	Qn: 10 ** 18,
	Qd: 10 ** 15,
	T: 10 ** 12,
	B: 10 ** 9,
	M: 10 ** 6,
	K: 10 ** 3
}
/**
 * Abbreviates a number.
 * @param {number} number
 * @example
 * const bigNumber = 13000000
 * console.log(abbreviateNumber(bigNumber)) // Logs "13M" 
 * @returns {string}
 */
function abbreviateNumber(number) {
    let numberNegative = number < 0
    number = numberNegative ? -number : number
    let abbreviatedNumber = number
    let abbreviationChosen = 0
    Object.keys(abbreviations).forEach(abbreviation => {
        const abvreviationNumber = abbreviations[abbreviation]
        if(number >= abvreviationNumber && abvreviationNumber > abbreviationChosen) {
            let shortNum = (number / abvreviationNumber).toFixed(1).toString()
            if(shortNum.charAt(shortNum.length - 1) == "0") {
                shortNum = shortNum.substring(0, shortNum.length - 2)
            }
            abbreviatedNumber = `${shortNum}${abbreviation}`
            abbreviationChosen = abvreviationNumber 
        }
    })

    return `${numberNegative ? "-" : ""}${abbreviatedNumber}`
}

module.exports = abbreviateNumber