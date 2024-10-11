const Sequelize = require('sequelize')

const userDatabase = new Sequelize('database', "BenBot", "MarkIII", {
    dialect: 'sqlite',
    host: "localhost",
    storage: "database.sqlite",
    logging: false
})

module.exports = userDatabase