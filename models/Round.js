const Sequelize = require('sequelize');

function  round (sequelize) {

	class Round extends Sequelize.Model {}
		Round.init({
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
      deadLine: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      allowedTransfers: {
        type: Sequelize.INTEGER,
        allowNull: false,
      }
		},
		{
			sequelize,
			modelName: 'round',
		});

  return Round;
};

module.exports = round