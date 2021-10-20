const Sequelize = require('sequelize');

function  squad (sequelize) {
  class Squad extends Sequelize.Model {}
  Squad.init({
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      score: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      captain: {
        type: Sequelize.INTEGER,
      },
		},
		{
			sequelize,
			modelName: 'squad',
		});

  return Squad;
};

module.exports = squad