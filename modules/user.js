const Sequelize = require('sequelize')
const userDatabase = require('../utils/database_manager')
const {modelSettings} = require('../config/models/user.json')
const { log } = require('../utils/logger')

log(modelSettings)

Object.keys(modelSettings).forEach(key => {
    log(modelSettings[key], Sequelize[modelSettings[key].type])
    modelSettings[key].type = Sequelize[modelSettings[key].type] // Lets say you have a key in the modelSettings with type: "NUMBER", this thing will
    log(modelSettings[key].type)
    // convert the string "NUMBER" to Sequelize["NUMBER"]
})

const UserData = userDatabase.define('user_data', modelSettings)

module.exports = UserData