const Sequelize = require('sequelize');

function  match (sequelize) {
  class Match extends Sequelize.Model {}
  Match.init({
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
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
      team1OwnGoals: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      team2OwnGoals: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      team1Assists: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      team2Assists: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      played: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      playedAllMatch: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      penaltySaved: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      penaltyMissed: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      penaltyCaused: {
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