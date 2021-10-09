const Sequelize = require('sequelize');

function  score (sequelize) {

	class Score extends Sequelize.Model {}
		Score.init({
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      round: {
        type: Sequelize.STRING,
        allowNull: false
      },
      score: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
		},
		{
			sequelize,
			modelName: 'score',
		});

  return Score;
};

module.exports = score