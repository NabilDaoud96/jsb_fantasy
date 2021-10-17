module.exports = {
  async up(queryInterface, Sequelize) {
    let playerSquadsTable = await queryInterface.describeTable("playerSquads");
    if(!playerSquadsTable.order)
      queryInterface.addColumn(
        'playerSquads',
        'order',
        {
          type: Sequelize.STRING,
          allowNull: false
        }
      );
  },

  down(queryInterface, Sequelize) {
    //
  },
}
