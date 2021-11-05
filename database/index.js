const UserModel = require("../models/User")
const TeamModel = require("../models/Team")
const MatchModel = require("../models/Match")
const PlayerModel = require("../models/Player")
const PlayerSquadModel = require("../models/PlayerSquad")
const SquadModel = require("../models/Squad")
const ScoreModel = require("../models/Score")
const RoundModel = require("../models/Round")
const StatsModel = require("../models/Stats")

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
const PlayerSquad = PlayerSquadModel(sequelize);
const Squad = SquadModel(sequelize);
const Score = ScoreModel(sequelize);
const Round = RoundModel(sequelize);
const Stats = StatsModel(sequelize);


// Relations

Player.belongsTo(Team, { hooks: true, as: "team", onDelete: 'SET NULL' });
Team.hasMany(Player, { as: "players" });



Player.belongsTo(Team, { hooks: true, as: "team2", foreignKey: "team2Id" });

Team.hasOne(Match, { hooks: true, onDelete: "CASCADE" });
Match.belongsTo(Team, { hooks: true, as: "team1", foreignKey: "team1Id" });

Team.hasOne(Match, { hooks: true, onDelete: "CASCADE" });
Match.belongsTo(Team, { hooks: true, as: "team2", foreignKey: "team2Id" });

Squad.hasMany(PlayerSquad, { hooks: true, as: "playerSquads", onDelete: "CASCADE" });
PlayerSquad.belongsTo(Player, { hooks: true, as: "player" });

Squad.belongsTo(User, { hooks: true, as: "user", onDelete: 'SET NULL' });
User.hasMany(Squad, { as: "squads" });

Score.belongsTo(Player, { hooks: true, as: "player", onDelete: 'SET NULL' });
Player.hasMany(Score, { as: "scores" });

Match.belongsTo(Round, { hooks: true, as: "round", onDelete: 'SET NULL' });
Round.hasMany(Match, { as: "matches" });

Score.belongsTo(Round, { hooks: true, as: "round", onDelete: 'SET NULL' });
Round.hasMany(Score, { as: "scores" });

Squad.belongsTo(Round, { hooks: true, as: "round", onDelete: 'SET NULL' });
Round.hasMany(Squad, { as: "squads" });

Stats.belongsTo(Round, { hooks: true, as: "round", onDelete: 'SET NULL' });
Round.hasOne(Stats, { hooks: true, onDelete: "CASCADE" });

const umzug = new Umzug({
    migrations: {
        path: path.join(__dirname, "./migrations"),
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
    .then(async() => {
        umzug.up()
            .then(async() => {
                console.log('All migrations performed successfully')
            })
    })

module.exports = {
    sequelize,
    User,
    Team,
    Player,
    Match,
    Squad,
    PlayerSquad,
    Score,
    Round,
    Stats
}