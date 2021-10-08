const Sequelize = require('sequelize');

function  user (sequelize) {

	class User extends Sequelize.Model {}
		User.init({
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      fullName: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      phone : {
        type: Sequelize.STRING,
      }
		},
		{
			sequelize,
			modelName: 'user',
		});

  return User;
};

module.exports = user