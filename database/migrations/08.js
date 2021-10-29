module.exports = {
  async up(queryInterface, Sequelize) {
    let playersTable = await queryInterface.describeTable("players");
    if(!playersTable.team2Id)
      queryInterface.addColumn(
        'players',
        'team2Id',
        {
          type: Sequelize.INTEGER,
          references: { model: 'teams', key: 'id' }
        }
      );
  },

  down(queryInterface, Sequelize) {
    //
  },
}
