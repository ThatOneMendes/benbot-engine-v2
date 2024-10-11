const Canvas = require("@napi-rs/canvas")
const { log } = require("./logger")

/**
 * Gets a string and returns an array with chunks of that string; This is used to wrap text on a canvas.
 * 
 * @param {Canvas.Canvas} canvas The canvas
 * @param {String} text The message.
 * @param {Number} maxWidth Max width
 * @returns {[String]}
 */
function fragmentText(canvas, text, maxWidth) {
    const ctx = canvas.getContext("2d")
    
    let words = text.split(' '),
        lines = [],
        line = "";
    if (ctx.measureText(text).width < maxWidth) {
        return [text];
    }
    while (words.length > 0) {
        while (ctx.measureText(words[0]).width >= maxWidth) {
            let tmp = words[0];
            words[0] = tmp.slice(0, -1);
            if (words.length > 1) {
                words[1] = tmp.slice(-1) + words[1];
            } else {
                words.push(tmp.slice(-1));
            }
        }
        if (ctx.measureText(line + words[0]).width < maxWidth) {
            line += words.shift() + " ";
        } else {
            lines.push(line);
            line = "";
        }
        if (words.length === 0) {
            lines.push(line);
        }
    }
    return lines;
}

module.exports = fragmentText