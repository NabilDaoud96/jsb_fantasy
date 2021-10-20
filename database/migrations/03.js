module.exports = {
  async up(queryInterface, Sequelize) {
    let scoresTable = await queryInterface.describeTable("scores");
    if(!scoresTable.details)
      queryInterface.addColumn(
        'scores',
        'details',
        {
          type: Sequelize.JSON,
          defaultValue: []
        }
      );
  },

  down(queryInterface, Sequelize) {
    //
  },
}
