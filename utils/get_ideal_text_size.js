const Canvas = require("@napi-rs/canvas");

/**
 * Decides the ideal font size for a text.
 * @param {Canvas.SKRSContext2D} context 
 * @param {Canvas.Canvas} canvas 
 * @param {Number} baseSize 
 * @param {Number} maxWidth 
 * @param {String} text 
 */
function getIdealTextSize(canvas, baseSize, maxWidth, text, fontName) {
    const context = canvas.getContext('2d');

	do {
		context.font = `${baseSize -= 10}px ${fontName}`
	} while (context.measureText(text).width > maxWidth);

	return context.font
}

module.exports = getIdealTextSize