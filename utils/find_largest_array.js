/**
 * Compares the length of arrays and returns the largest one
 * @param  {...[]} arrays The arrays to compare
 * @returns {any[]}
 */
function findLargestArray(...arrays) {
    let largestArray = []
    arrays.forEach(array => {
        if (array.length >= largestArray.length) largestArray = array
    })
    return largestArray
}

module.exports = findLargestArray