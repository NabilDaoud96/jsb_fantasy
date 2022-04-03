module.exports = {
  async up(queryInterface, Sequelize) {
    let matchesTable = await queryInterface.describeTable("matches");
    if(!matchesTable.played)
      queryInterface.addColumn(
        'matches',
        'matchPlayed',
        {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        }
      );
  },

  down(queryInterface, Sequelize) {
    //
  },
}
