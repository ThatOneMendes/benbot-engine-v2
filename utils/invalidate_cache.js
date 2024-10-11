/**
 * Invalidades a module's cache and returns a require. 
 * @param {string} module
 * @returns {void}
*/
function invalidateCache(module) {
    delete require.cache[require.resolve("."+module)];
}

module.exports = invalidateCache
