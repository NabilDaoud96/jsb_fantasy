module.exports = {
  async up(queryInterface, Sequelize) {
    let matchesTable = await queryInterface.describeTable("matches");
    if(!matchesTable.bestPlayer)
      queryInterface.addColumn(
        'matches',
        'bestPlayer',
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
