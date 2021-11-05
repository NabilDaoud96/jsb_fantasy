const Sequelize = require('sequelize');

function stats(sequelize) {

    class Stats extends Sequelize.Model {}

    Stats.init({
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        stats: {
            type: Sequelize.JSON,
            defaultValue: {}
        },
        isGlobal: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },
        
    }, {
        sequelize,
        modelName: 'stats',
    });

    return Stats;
};

module.exports = stats