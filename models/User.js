const Sequelize = require('sequelize');
const {hashSync, genSaltSync} = require('bcrypt');

function user(sequelize) {

    class User extends Sequelize.Model {}
    const generateHash = (user, options) => {
        if(user.password) user.password = hashSync(user.password, genSaltSync())
    }
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
        budget: {
            type: Sequelize.INTEGER,
            defaultValue: 100
        },
        score: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },

        password: {
            type: Sequelize.STRING,
            allowNull: false,
        },
    }, {
        sequelize,
        modelName: 'user',
        hooks : {
            beforeCreate(user, options){
                generateHash(user, options)
            },
            beforeUpdate(user, options){
                generateHash(user, options);
            }
        }
    });

    return User;
};

module.exports = user