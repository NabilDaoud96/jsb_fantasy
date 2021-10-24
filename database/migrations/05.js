module.exports = {
  async up(queryInterface, Sequelize) {
    let teamsTable = await queryInterface.describeTable("teams");
    if(!teamsTable.isOut)
      queryInterface.addColumn(
        'teams',
        'isOut',
        {
          type: Sequelize.BOOLEAN,
        }
      );
  },

  down(queryInterface, Sequelize) {
    //
  },
}
