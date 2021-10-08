const Sequelize = require('sequelize');

function  player (sequelize) {

	class Player extends Sequelize.Model {}
		Player.init({
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
      position: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      price: {
        type: Sequelize.INTEGER,
        allowNull: false,
      }
		},
		{
			sequelize,
			modelName: 'player',
		});

  return Player;
};

module.exports = player