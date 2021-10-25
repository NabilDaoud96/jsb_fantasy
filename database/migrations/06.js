module.exports = {
  async up(queryInterface, Sequelize) {
    let usersTable = await queryInterface.describeTable("users");
    if(!usersTable.budget)
      queryInterface.addColumn(
        'users',
        'budget',
        {
          type: Sequelize.INTEGER,
          defaultValue: 100
        }
      );
  },

  down(queryInterface, Sequelize) {
    //
  },
}
