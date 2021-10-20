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
  let players = {}
  /** resetting scores to all players **/
  let playersList = await Player.findAll({})
  playersList.forEach(player=> {
    scores[player.toJSON().id] = {points: 0, details: []}
    players[player.toJSON().id] = {position: player.toJSON().position, teamId: player.toJSON().teamId}
  })

  /** iterate match stats and calculate score **/
  for (let match of matches){
    let newScores = await calculateMatchPoint({...scores},{...players}, match)
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
    defaults: { roundId, playerId, score: score.points, details: score.details}
  });
  if(!created) await foundScore.update({ roundId, playerId, score: score.points, details: score.details})
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
      if(squad.toJSON().captain === playerSquad.playerId)
        score += (playerSquad.player.scores[0].score * 2)
      else score += playerSquad.player.scores[0].score
    }
    await squad.update({...squad.toJSON(), score})
  }
}

function calculateMatchPoint(scores, players, match){
  // match played
  match.played.forEach(playerId => {
    scores[playerId].points += points_config.MATCH_PLAYED.points
    scores[playerId].details.push({
      label: points_config.MATCH_PLAYED.label,
      value: 1,
      points: points_config.MATCH_PLAYED.points
    })
  })

  // all match played
  match.playedAllMatch.forEach(playerId => {
    scores[playerId].points += points_config.ALL_MATCH_PLAYED.points
    scores[playerId].details.push({
      label: points_config.ALL_MATCH_PLAYED.label,
      value: 1,
      points: points_config.ALL_MATCH_PLAYED.points
    })
  })

  // team 1 goals
  match.team1Goals.forEach(({id, number}) => {
    let points , label

    if(['defender', 'goalkeeper'].includes(players[id].position)){
      points = points_config.GOAL_BY_GOALKEEPER_DEFENDER.points
      label = points_config.GOAL_BY_GOALKEEPER_DEFENDER.label
    }
    else if (players[id].position === 'midfielder'){
      points = points_config.GOAL_BY_MIDFIELDER.points
      label = points_config.GOAL_BY_MIDFIELDER.label
    }
    else {
      points = points_config.GOAL_BY_ATTACKER.points
      label = points_config.GOAL_BY_ATTACKER.label
    }
    scores[id].points += points * number
    scores[id].details.push({
      label: label,
      value: Number(number),
      points: points * Number(number)
    })
  })

  // team 2 goals
  match.team2Goals.forEach(({id, number}) => {
    let points , label

    if(['defender', 'goalkeeper'].includes(players[id].position)){
      points = points_config.GOAL_BY_GOALKEEPER_DEFENDER.points
      label = points_config.GOAL_BY_GOALKEEPER_DEFENDER.label
    }
    else if (players[id].position === 'midfielder'){
      points = points_config.GOAL_BY_MIDFIELDER.points
      label = points_config.GOAL_BY_MIDFIELDER.label
    }
    else {
      points = points_config.GOAL_BY_ATTACKER.points
      label = points_config.GOAL_BY_ATTACKER.label
    }
    scores[id].points += points * number
    scores[id].details.push({
      label: label,
      value: Number(number),
      points: points * Number(number)
    })
  })

  // team 1 Assists
  match.team1Assists.forEach(({id, number}) => {
    scores[id].points += points_config.ASSIST.points
    scores[id].details.push({
      label: points_config.ASSIST.label,
      value: Number(number),
      points: points_config.ASSIST.points * Number(number)
    })
  })

  // team 2 Assists
  match.team2Assists.forEach(({id, number}) => {
    scores[id].points += points_config.ASSIST.points
    scores[id].details.push({
      label: points_config.ASSIST.label,
      value: Number(number),
      points: points_config.ASSIST.points * Number(number)
    })
  })

  // red Cards
  match.redCards.forEach(playerId => {
    scores[playerId].points += points_config.RED_CARD.points
    scores[playerId].details.push({
      label: points_config.RED_CARD.label,
      value: 1,
      points: points_config.RED_CARD.points
    })
  })

  // yellow Cards
  match.yellowCards.forEach(({id, number}) => {
    if(match.redCards.indexOf(id) !== -1) return
    scores[id].points += points_config.YELLOW_CARD.points
    scores[id].details.push({
      label: points_config.YELLOW_CARD.label,
      value: Number(number),
      points: points_config.YELLOW_CARD.points * Number(number)
    })
  })

  // penalty Saved
  match.penaltySaved.forEach(({id, number}) => {
    scores[id].points += points_config.PENALTY_SAVED.points
    scores[id].details.push({
      label: points_config.PENALTY_SAVED.label,
      value: Number(number),
      points: points_config.PENALTY_SAVED.points * Number(number)
    })
  })

  // penalty Caused
  match.penaltyCaused.forEach(({id, number}) => {
    scores[id].points += points_config.PENALTY_CAUSED.points
    scores[id].details.push({
      label: points_config.PENALTY_CAUSED.label,
      value: Number(number),
      points: points_config.PENALTY_CAUSED.points * Number(number)
    })
  })

  // penalty Missed
  match.penaltyMissed.forEach(({id, number}) => {
    scores[id].points += points_config.PENALTY_MISSED.points
    scores[id].details.push({
      label: points_config.PENALTY_MISSED.label,
      value: Number(number),
      points: points_config.PENALTY_MISSED.points * Number(number)
    })
  })

  // team 1 Own Goal
  match.team1OwnGoals.forEach(({id, number}) => {
    scores[id].points += points_config.OWN_GOAL.points
    scores[id].details.push({
      label: points_config.OWN_GOAL.label,
      value: Number(number),
      points: points_config.OWN_GOAL.points * Number(number)
    })
  })

  // team 2 Own Goal
  match.team2OwnGoals.forEach(({id, number}) => {
    scores[id].points += points_config.OWN_GOAL.points
    scores[id].details.push({
      label: points_config.OWN_GOAL.label,
      value: Number(number),
      points: points_config.OWN_GOAL.points * Number(number)
    })
  })

  // Best player
  match.bestPlayer.forEach(playerId => {
    scores[playerId].points += points_config.BEST_PLAYER.points
    scores[playerId].details.push({
      label: points_config.BEST_PLAYER.label,
      value: 1,
      points: points_config.BEST_PLAYER.points
    })
  })

  if(Object.entries(players).length) for (let [id, player] of Object.entries(players)){
    // from team 1
    let otherTeamScore;
    if(player.teamId === match.team1Id){
      otherTeamScore = match.team2Score
    }else {
      otherTeamScore = match.team1Score
    }


    if(otherTeamScore === 0 && player.position!== "attacker") {
      let points , label

      if(['defender', 'goalkeeper'].includes(player.position)){
        points = points_config.CLEAN_SHEET_GOALKEEPER_DEFENDER.points
        label = points_config.CLEAN_SHEET_GOALKEEPER_DEFENDER.label
      }
      else if (players.position === 'midfielder'){
        points = points_config.CLEAN_SHEET_MIDFIELDER.points
        label = points_config.CLEAN_SHEET_MIDFIELDER.label
      }
      scores[id].points += points
      scores[id].details.push({
        label: label,
        value: 1,
        points: points
      })
    }

    if(otherTeamScore > 0 && otherTeamScore <= 2 && player.position!== "attacker") {
      let points , label

      if(['defender', 'goalkeeper'].includes(player.position)){
        points = points_config.LESS_THAN_TWO_GOALS_GOALKEEPER_DEFENDER.points
        label = points_config.LESS_THAN_TWO_GOALS_GOALKEEPER_DEFENDER.label
      }
      else if (player.position === 'midfielder'){
        points = points_config.LESS_THAN_TWO_GOALS_MIDFIELDER.points
        label = points_config.LESS_THAN_TWO_GOALS_MIDFIELDER.label
      }
      scores[id].points += points
      scores[id].details.push({
        label: label,
        value: 1,
        points: points
      })
    }

  }

  return scores
}


module.exports = {
  pointCalculation
}