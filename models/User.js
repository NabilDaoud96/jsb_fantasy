const Sequelize = require('sequelize');

function user(sequelize) {

    class User extends Sequelize.Model {}
    User.init({
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        email: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        firstName: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        lastName: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        team: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        password: {
            type: Sequelize.STRING,
            allowNull: false,
        },
    }, {
        sequelize,
        modelName: 'user',
    });

    return User;
};

module.exports = user