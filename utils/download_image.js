const https = require('https');
const fs = require('fs');
const { log, logPriority } = require('./logger');

/**
 * Donwloads an image to a path
 * @param {string} imageName 
 * @param {string} path 
 * @returns {Promise<boolean>}
 */
function downloadImage(imageUrl, imageName, path) {
    const file = fs.createWriteStream(`${path}/${imageName}`);

    return new Promise(resolve => {
        https.get(imageUrl, response => {
            response.pipe(file);
      
            file.on('finish', () => {
              file.close();
              log(`Image downloaded as ${path}/${imageName}`);
              resolve(true)
            });
          }).on('error', err => {
            fs.unlink(`${path}/${imageName}`);
            log(`Error downloading image: ${err.message}`, logPriority.error);
            resolve(false)
          });
    })
}

module.exports = downloadImage