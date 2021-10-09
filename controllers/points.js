const {Match, Score, Player, Squad, PlayerSquad} = require('../database')
const points_config = require("../constants/match_points_config.json")
const {Op} = require('sequelize')

async function pointCalculation(req,res){
  const {round} = req.body
  /** get all matches for that round **/
  const matches = (await Match.findAll({
    where: {round}
  })).map(i=>i.toJSON())

  let scores = {}
  /** resetting scores to all players **/
  let players = await Player.findAll({})
  players.forEach(player=>scores[player.toJSON().id] = 0)

  /** iterate match stats and calculate score **/
  for (let match of matches){
    let newScores = await calculateMatchPoint({...scores}, match)
    scores = {...newScores}

    /** create or update player score **/
    for (let [playerId, score] of Object.entries(scores)){
      await createOrUpdateScore(round, playerId, score)
    }
  }
  /** calculate squad score **/
  await calculateSquadScore(round)

  return res.status(200).send()
}

async function createOrUpdateScore(round, playerId, score){
  let [foundScore, created] = await Score.findOrCreate({
    where: { playerId, round },
    defaults: { round, playerId, score}
  });
  if(!created) await foundScore.update({ round, playerId, score})
}

async function calculateSquadScore(round){
  const squads = await Squad.findAll({
    where: {round},
    include: [{
      model: PlayerSquad,
      as: "playerSquads",
      include: [{
        model: Player,
        as: 'player',
        include: [
          {model: Score, as: 'scores', where: {round}}
        ]
      }]
    }]
  });

  for (let squad of squads){
    let score = 0
    for (let playerSquad of squad.toJSON().playerSquads){
      score += playerSquad.player.scores[0].score
    }
    await squad.update({...squad.toJSON(), score})
  }
}

function calculateMatchPoint(scores, match){
  match.played.forEach(playerId => {
    scores[playerId]+= points_config.MATCH_PLAYED
  })
  return scores
}


module.exports = {
  pointCalculation
}