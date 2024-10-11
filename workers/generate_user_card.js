const { workerData, parentPort, isMainThread } = require("node:worker_threads")
const { log } = require("../utils/logger")
const Canvas = require("@napi-rs/canvas")
const fs = require("node:fs");
const getIdealTextSize = require("../utils/get_ideal_text_size");
const { infoCanvasSize, arcData, pfpArcData, username, avatarImage, level, exp, benCoins, about } = require('../config/commands/economy/user_info.json');
const { currencyAcronym } = require("../config/main.json");
const fragmentText = require("../utils/fragment_text");
const abbreviateNumber = require("../utils/abreviate_number")
const { AttachmentBuilder } = require("discord.js");

if(isMainThread) return;

/*
    Auto run async function
*/

(async () => {
    let {userData, user, wallpaper, drawWallpaper} = workerData

    log("Generating user data card")

    /*
        Creating the canvas
    */

    const infoCanvas = Canvas.createCanvas(infoCanvasSize[0], infoCanvasSize[1])
    const infoContext = infoCanvas.getContext('2d', {
        "alpha": !drawWallpaper,
        "colorSpace": "srgb"
    })

    const userInventory = userData.inventory

    if(fs.existsSync(`./media/wallpapers/${wallpaper ?? userInventory.currentWallpaper}.png`)) {
        if(drawWallpaper) {
            const wallpaperImage = await Canvas.loadImage(`./media/wallpapers/${wallpaper ?? userInventory.currentWallpaper}.png`)
            infoContext.drawImage(wallpaperImage, 0, 0, infoCanvasSize[0], infoCanvasSize[1])
        }
    }

    /*
        Drawing the user's profile picture
    */

    infoContext.save()
    infoContext.beginPath();
    infoContext.arc(arcData.x, arcData.y, arcData.radius, 0, Math.PI * 2);
    infoContext.closePath()
    infoContext.clip();
    const userAvatar = await Canvas.loadImage(user.displayAvatarURL)
    infoContext.drawImage(userAvatar, avatarImage.x, avatarImage.y, avatarImage.dx, avatarImage.dy)
    infoContext.restore()
    infoContext.lineWidth = pfpArcData.lineWidth
    infoContext.strokeStyle = pfpArcData.style
    infoContext.beginPath()
    infoContext.arc(arcData.x - Math.ceil(pfpArcData.lineWidth / 2), arcData.y, arcData.radius, 0, Math.PI * 2);
    infoContext.closePath()
    infoContext.stroke()

    /*
        Drawing the user's name
    */

    infoContext.textAlign = "center"
    infoContext.textBaseline = "middle"
    infoContext.strokeStyle = user.roleColor ?? username.strokeStyleDefault
    infoContext.lineWidth = username.lineWidth
    infoContext.fillStyle = username.fillStyle
    infoContext.font = getIdealTextSize(infoCanvas, username.fontBaseSize, username.fontMaxWidth, user.name, username.font)
    infoContext.fillText(user.name, username.x, username.y)
    infoContext.strokeText(user.name, username.x, username.y)

    /*
        Drawing the user's level
    */

    infoContext.strokeStyle = level.strokeStyle
    infoContext.fillStyle = level.fillStyle
    infoContext.font = getIdealTextSize(infoCanvas, level.baseSize, level.maxSize, level.text, level.font)
    infoContext.fillText(level.text, level.x, level.y)
    infoContext.strokeText(level.text, level.x, level.y)
    infoContext.font = getIdealTextSize(infoCanvas, level.baseSize, level.maxSize, `${userData.level}`, level.font)
    infoContext.fillText(`${userData.level}`, level.valueX, level.y)
    infoContext.strokeText(`${userData.level}`, level.valueX, level.y)
    infoContext.strokeStyle = level.rect.strokeStyle
    infoContext.lineWidth = level.lineWidth
    infoContext.beginPath()
    infoContext.roundRect(level.rect.x, level.rect.y, level.rect.dx, level.rect.dy, level.rect.radius)
    infoContext.closePath()
    infoContext.stroke()

    /*
        Drawing the user's EXP
    */

    infoContext.strokeStyle = exp.label.strokeStyle
    infoContext.lineWidth = exp.label.lineWidth
    infoContext.font = getIdealTextSize(infoCanvas, exp.label.baseSize, exp.label.maxSize, exp.label.text, exp.label.font)
    infoContext.fillText(exp.label.text, exp.label.x, exp.label.y)
    infoContext.strokeText(exp.label.text, exp.label.x, exp.label.y)
    const userExpBar = Math.round(300 * (userData.experience / ((userData.level + 1) * 1000)))
    infoContext.fillStyle = exp.bar.fillStyle
    infoContext.strokeStyle = exp.bar.strokeStyle
    infoContext.lineWidth = exp.bar.lineWidth
    infoContext.save()
    infoContext.beginPath()
    infoContext.roundRect(exp.bar.rect.x, exp.bar.rect.y, exp.bar.rect.dx, exp.bar.rect.dy, exp.bar.rect.radius)
    infoContext.closePath()
    infoContext.clip()
    infoContext.beginPath()
    infoContext.roundRect(exp.bar.rect.x, exp.bar.rect.y, userExpBar, exp.bar.rect.dy, exp.bar.rect.radius)
    infoContext.closePath()
    infoContext.fill()
    infoContext.restore()
    infoContext.beginPath()
    infoContext.roundRect(exp.bar.rect.x, exp.bar.rect.y, exp.bar.rect.dx, exp.bar.rect.dy, exp.bar.rect.radius)
    infoContext.closePath()
    infoContext.stroke()
    const currentEXP = `${userData.experience}/${(userData.level + 1) * 1000}`
    infoContext.lineWidth = exp.bar.label.lineWidth
    infoContext.strokeStyle = exp.bar.label.strokeStyle
    infoContext.fillStyle = exp.bar.label.fillStyle
    infoContext.font = getIdealTextSize(infoCanvas, exp.bar.label.baseSize, exp.bar.label.maxSize, currentEXP, exp.bar.label.font)
    infoContext.fillText(currentEXP, exp.bar.label.x, exp.bar.label.y)
    infoContext.strokeText(currentEXP, exp.bar.label.x, exp.bar.label.y)

    /*
        Drawing the user's balance
    */

    infoContext.fillStyle = benCoins.label.fillStyle
    infoContext.strokeStyle = benCoins.label.strokeStyle
    infoContext.lineWidth = benCoins.label.lineWidth
    infoContext.font = getIdealTextSize(infoCanvas, benCoins.label.baseSize, benCoins.label.maxSize, currencyAcronym, benCoins.label.font)
    infoContext.fillText(currencyAcronym, benCoins.label.x, benCoins.label.y)
    infoContext.strokeText(currencyAcronym, benCoins.label.x, benCoins.label.y)
    infoContext.strokeStyle = benCoins.rect.strokeStyle
    infoContext.lineWidth = benCoins.rect.lineWidth
    infoContext.beginPath()
    infoContext.roundRect(benCoins.rect.x, benCoins.rect.y, benCoins.rect.dx, benCoins.rect.dy, benCoins.rect.radius)
    infoContext.closePath()
    infoContext.stroke()
    infoContext.lineWidth = benCoins.value.lineWidth
    infoContext.strokeStyle = benCoins.value.strokeStyle
    infoContext.fillStyle = benCoins.value.fillStyle
    infoContext.font = getIdealTextSize(infoCanvas, benCoins.value.baseSize, benCoins.value.maxSize, `${userData.bencoins}`, benCoins.value.font)
    infoContext.fillText(abbreviateNumber(userData.benCoins), benCoins.value.x, benCoins.value.y)
    infoContext.strokeText(abbreviateNumber(userData.benCoins), benCoins.value.x, benCoins.value.y)

    /*
        Drawing the user's about me
    */

    infoContext.strokeStyle = about.rect.strokeStyle
    infoContext.lineWidth = about.rect.lineWidth
    infoContext.beginPath()
    infoContext.roundRect(about.rect.x, about.rect.y, about.rect.dx, about.rect.dy, about.rect.radius)
    infoContext.closePath()
    infoContext.stroke()
    infoContext.lineWidth = about.value.lineWidth
    infoContext.strokeStyle = about.value.strokeStyle
    infoContext.fillStyle = about.value.fillStyle
    infoContext.font = about.value.font
    const textFragments = fragmentText(infoCanvas, userData.about, about.value.maxWidth)
    infoContext.textBaseline = "alphabetic"
    infoContext.textAlign = "start"
    const lineHeight = Number(infoContext.font.split("px")[0]) + about.value.margin
    textFragments.forEach((frag, index) => {
        infoContext.fillText(frag, about.value.x, about.value.y + (lineHeight * index))
        infoContext.strokeText(frag, about.value.x, about.value.y + (lineHeight * index))
    })

    /*
        Returning the built result
    */

    parentPort.postMessage(await infoCanvas.encode('png'))
})()