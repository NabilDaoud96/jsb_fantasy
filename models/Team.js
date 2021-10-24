const Sequelize = require('sequelize');

function  team (sequelize) {

	class Team extends Sequelize.Model {}
		Team.init({
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      isOut: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      }
		},
		{
			sequelize,
			modelName: 'team',
		});

  return Team;
};

module.exports = team