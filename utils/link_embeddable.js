const { log } = require("./logger")

const attachmentExtensions = ["png","jpg","jpeg","ppm","gif","tif","tiff","avif","apng","webp","jfif","pjpeg","pjp"]
/**
 * Checks if a link can get embeded thorugh `Embed.setImage()`
 * @param {string} link 
 * @returns {boolean}
 */
function linkEmbeddable(link){
    log(link.split("/").reverse()[0].split('.').reverse()[0].split("?")[0])
    return attachmentExtensions.indexOf(link.split("/").reverse()[0].split('.').reverse()[0].split("?")[0]) != -1
}

module.exports = linkEmbeddable