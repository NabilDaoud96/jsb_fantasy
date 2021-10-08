const Sequelize = require('sequelize');

function  match (sequelize) {
  class Match extends Sequelize.Model {}
  Match.init({
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      round: {
        type: Sequelize.STRING,
        allowNull: false
      },
      team1Score: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      team2Score: {
          type: Sequelize.INTEGER,
          defaultValue: 0
      },
      redCards: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      yellowCards: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      team1Goals: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      team2Goals: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      played: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false
      },
		},
		{
			sequelize,
			modelName: 'match',
		});

  return Match;
};

module.exports = match