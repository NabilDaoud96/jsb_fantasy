const UserModel = require("../models/User")
const TeamModel = require("../models/Team")
const MatchModel = require("../models/Match")
const PlayerModel = require("../models/Player")
const Sequelize = require("sequelize");
const Umzug = require('umzug');
const path = require("path")
const sequelize = new Sequelize("postgres://postgres:root@127.0.0.1:5432/JSB_FANTASY")
sequelize
  .authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
  })
  .catch(err => {
    console.error("Unable to connect to the database:", err);
  });

const User = UserModel(sequelize);
const Team = TeamModel(sequelize);
const Match = MatchModel(sequelize);
const Player = PlayerModel(sequelize);


// Relations

Player.belongsTo(Team, { hooks: true, as: "team", onDelete : 'SET NULL'});
Team.hasMany(Player, { as: "players" });
Team.hasOne(Match, { hooks: true, onDelete: "CASCADE"});
Match.belongsTo(Team, { hooks: true, as: "team1", foreignKey: "team1Id" });
Team.hasOne(Match, { hooks: true, onDelete: "CASCADE"});
Match.belongsTo(Team, { hooks: true, as: "team2", foreignKey: "team2Id" });


const umzug = new Umzug({
  migrations: {
    path: path.join(__dirname,"./migrations"),
    params: [
      sequelize.getQueryInterface(),
      sequelize.constructor, 
    ]
  },
  storage: 'sequelize',
  storageOptions: {
    sequelize: sequelize
  }
})
sequelize.sync({ force: false })
  .then(async () => {
    umzug.up()
      .then(async () => {
        console.log('All migrations performed successfully')
      })
  })

module.exports = {
  sequelize,
  User,
  Team,
  Player,
  Match
}







