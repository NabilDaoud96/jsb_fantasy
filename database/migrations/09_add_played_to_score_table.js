module.exports = {
  async up(queryInterface, Sequelize) {
    let scoresTable = await queryInterface.describeTable("scores");
    if(!scoresTable.played)
      queryInterface.addColumn(
        'scores',
        'played',
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
