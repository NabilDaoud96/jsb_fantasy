const Sequelize = require('sequelize');

function  score (sequelize) {

	class Score extends Sequelize.Model {}
		Score.init({
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      score: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      details: {
        type: Sequelize.JSON,
        allowNull: [],
      },
		},
		{
			sequelize,
			modelName: 'score',
		});

  return Score;
};

module.exports = score