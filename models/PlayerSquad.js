const Sequelize = require('sequelize');

function  playerSquad (sequelize) {
  class PlayerSquad extends Sequelize.Model {}
  PlayerSquad.init({
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      position: {
        type: Sequelize.STRING,
        allowNull: false
      }
		},
		{
			sequelize,
			modelName: 'playerSquad',
		});

  return PlayerSquad;
};

module.exports = playerSquad