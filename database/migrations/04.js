module.exports = {
  async up(queryInterface, Sequelize) {
    let squadsTable = await queryInterface.describeTable("squads");
    if(!squadsTable.captain)
      queryInterface.addColumn(
        'squads',
        'captain',
        {
          type: Sequelize.INTEGER,
        }
      );
  },

  down(queryInterface, Sequelize) {
    //
  },
}
