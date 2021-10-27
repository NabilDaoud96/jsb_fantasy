module.exports = {
  async up(queryInterface, Sequelize) {
    let usersTable = await queryInterface.describeTable("users");
    if(!usersTable.score)
      queryInterface.addColumn(
        'users',
        'score',
        {
          type: Sequelize.INTEGER,
          defaultValue: 0
        }
      );
  },

  down(queryInterface, Sequelize) {
    //
  },
}
