const {Match, Score, Player, Squad, PlayerSquad} = require('../database')
const points_config = require("../constants/match_points_config.json")
const {Op} = require('sequelize')

async function pointCalculation(req,res){
  const {roundId} = req.body
  /** get all matches for that roundId **/
  const matches = (await Match.findAll({
    where: {roundId}
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
      await createOrUpdateScore(roundId, playerId, score)
    }
  }
  /** calculate squad score **/
  await calculateSquadScore(roundId)

  return res.status(200).send()
}

async function createOrUpdateScore(roundId, playerId, score){
  let [foundScore, created] = await Score.findOrCreate({
    where: { playerId, roundId },
    defaults: { roundId, playerId, score}
  });
  if(!created) await foundScore.update({ roundId, playerId, score})
}

async function calculateSquadScore(roundId){
  const squads = await Squad.findAll({
    where: {roundId},
    include: [{
      model: PlayerSquad,
      as: "playerSquads",
      include: [{
        model: Player,
        as: 'player',
        include: [
          {model: Score, as: 'scores', where: {roundId}}
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