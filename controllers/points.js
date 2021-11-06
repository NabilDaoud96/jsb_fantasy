const {Match, Score, Player, Squad, PlayerSquad, User, Stats} = require('../database')
const points_config = require("../constants/match_points_config.json")
const Sequelize = require('sequelize')
const {Op} = Sequelize

async function pointCalculation(req,res){
  try{
    const {roundId} = req.body
    /** get all matches for that roundId **/
    const matches = (await Match.findAll({
      where: {roundId}
    })).map(i => i.toJSON())

    let scores = {}
    let players = {}
    /** resetting scores to all players **/
    let playersList = (await Player.findAll({})).map(i => i.toJSON())
    playersList.forEach(player => {
      scores[player.id] = {points: 0, details: []}
      players[player.id] = {position: player.position, teamId: player.teamId, team2Id: player.team2Id}
    })

    /** iterate match stats and calculate score **/
    for (let match of matches) {
      let newScores = await calculateMatchPoint({...scores}, {...players}, match)
      scores = {...newScores}
    }
    /** create or update all players score **/
    for (let player of playersList) {
      let score = scores[player.id] || 0
      if (player.team2Id) {
        score.points = Math.round(score.points / 2)
        score.details = sanitizeDetails(score.details)
      }
      await createOrUpdateScore(roundId, player.id, score)
    }
    /** calculate squad score **/
    await calculateSquadScore(roundId)


    /** calculate mangers score **/
    await calculateMangersScore()

    /** calculate stats**/
    await generateStats(roundId)


    return res.status(200).send()
  }
  catch (e) {
    console.log(e)
    return res.status(500).json({
      success: false,
      errorMessage: 'Unknown server error while calculating points',
      errorMessageKey: 'SERVER_ERROR'
    });
  }
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
          {model: Score, as: 'scores', where: {roundId}, required: false}
        ]
      }]
    }]
  });

  for (let squad of squads){
    let score = 0
    for (let playerSquad of squad.toJSON().playerSquads){
      let points = playerSquad.player.scores[0]?.score || 0
      if(squad.toJSON().captain === playerSquad.playerId)
        score += (points * 2)
      else score += points
    }
    await squad.update({...squad.toJSON(), score})
  }
}


async function calculateMangersScore(){
  const managers = await User.findAll({
    include: [{model: Squad, as: "squads"}]
  })
  for (let manager of managers){
    const squads = manager.toJSON().squads
    let score = squads.reduce((acc, curr)=>{
      return acc + curr.score
    }, 0)
    await manager.update({...manager, score})
  }
}

function calculateMatchPoint(scores, players, match){

  // presence
  match.playedAllMatch.forEach(playerId => {
    scores[playerId].points += points_config.PRESENT.points
    scores[playerId].details.push({
      label: points_config.PRESENT.label,
      value: 1,
      points: points_config.PRESENT.points
    })
  })


  // match played
  match.played.forEach(playerId => {
    scores[playerId].points += points_config.MATCH_PLAYED.points
    scores[playerId].details.push({
      label: points_config.MATCH_PLAYED.label,
      value: 1,
      points: points_config.MATCH_PLAYED.points
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
    scores[id].points += points * Number(number)
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
    scores[id].points += points * Number(number)
    scores[id].details.push({
      label: label,
      value: Number(number),
      points: points * Number(number)
    })
  })

  // team 1 Assists
  match.team1Assists.forEach(({id, number}) => {
    scores[id].points += points_config.ASSIST.points * Number(number)
    scores[id].details.push({
      label: points_config.ASSIST.label,
      value: Number(number),
      points: points_config.ASSIST.points * Number(number)
    })
  })

  // team 2 Assists
  match.team2Assists.forEach(({id, number}) => {
    scores[id].points += points_config.ASSIST.points * Number(number)
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
    scores[id].points += points_config.YELLOW_CARD.points * Number(number)
    scores[id].details.push({
      label: points_config.YELLOW_CARD.label,
      value: Number(number),
      points: points_config.YELLOW_CARD.points * Number(number)
    })
  })

  // penalty Saved
  match.penaltySaved.forEach(({id, number}) => {
    scores[id].points += points_config.PENALTY_SAVED.points * Number(number)
    scores[id].details.push({
      label: points_config.PENALTY_SAVED.label,
      value: Number(number),
      points: points_config.PENALTY_SAVED.points * Number(number)
    })
  })

  // penalty Caused
  match.penaltyCaused.forEach(({id, number}) => {
    scores[id].points += points_config.PENALTY_CAUSED.points * Number(number)
    scores[id].details.push({
      label: points_config.PENALTY_CAUSED.label,
      value: Number(number),
      points: points_config.PENALTY_CAUSED.points * Number(number)
    })
  })

  // penalty Missed
  match.penaltyMissed.forEach(({id, number}) => {
    scores[id].points += points_config.PENALTY_MISSED.points * Number(number)
    scores[id].details.push({
      label: points_config.PENALTY_MISSED.label,
      value: Number(number),
      points: points_config.PENALTY_MISSED.points * Number(number)
    })
  })

  // team 1 Own Goal
  match.team1OwnGoals.forEach(({id, number}) => {
    scores[id].points += points_config.OWN_GOAL.points * Number(number)
    scores[id].details.push({
      label: points_config.OWN_GOAL.label,
      value: Number(number),
      points: points_config.OWN_GOAL.points * Number(number)
    })
  })


  // team 2 Own Goal
  match.team2OwnGoals.forEach(({id, number}) => {
    scores[id].points += points_config.OWN_GOAL.points * Number(number)
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
    for (let [id, player] of Object.entries(players)){
    // player played his match
    // player didn't play his match  yet
    // skip
    if(match.played.indexOf(Number(id)) !== -1){
      /** check if player played in this match **/
      if(
        player.teamId === match.team1Id ||
        player.teamId === match.team2Id ||
        player.team2Id === match.team1Id ||
        player.team2Id === match.team2Id
      ){
        let otherTeamScore;
        if(player.teamId === match.team1Id || player.team2Id === match.team1Id ){
          otherTeamScore = match.team2Score
        }
        else otherTeamScore = match.team1Score

        if(otherTeamScore === 0 && player.position!== "attacker") {
          let points , label

          if(['defender', 'goalkeeper'].includes(player.position)){
            points = points_config.CLEAN_SHEET_GOALKEEPER_DEFENDER.points
            label = points_config.CLEAN_SHEET_GOALKEEPER_DEFENDER.label
          }
          else if (player.position === 'midfielder'){
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

        if(otherTeamScore === 1 && player.position!== "attacker") {
          let points , label

          if(['defender', 'goalkeeper'].includes(player.position)){
            points = points_config.CONCEDED_ONE_GOAL_GOALKEEPER_DEFENDER.points
            label = points_config.CONCEDED_ONE_GOAL_GOALKEEPER_DEFENDER.label
          }
          else if (player.position === 'midfielder'){
            points = points_config.CONCEDED_ONE_GOAL_MIDFIELDER.points
            label = points_config.CONCEDED_ONE_GOAL_MIDFIELDER.label
          }
          scores[id].points += points
          scores[id].details.push({
            label: label,
            value: 1,
            points: points
          })
        }


        if(otherTeamScore >= 3 && player.position!== "attacker" && player.position !== 'midfielder') {
        let points , label, number = Math.floor(otherTeamScore / 3)

        if(['defender', 'goalkeeper'].includes(player.position)){
          points = points_config.FOR_EVERY_THREE_GOALS_CONCEDED_GOALKEEPER_DEFENDER.points
          label = points_config.FOR_EVERY_THREE_GOALS_CONCEDED_GOALKEEPER_DEFENDER.label
        }
        scores[id].points += points * number
        scores[id].details.push({
          label: label,
          value: number,
          points: points * number
        })
      }
      }
    }
  }
  return scores
}

function sanitizeDetails(details){
  let newDetails = [];
  let added = []
  details.forEach((currentDetail)=>{
    // new label
    if(added.indexOf(currentDetail.label) === -1){
      let sameLabels = details.filter(detail=>currentDetail.label === detail.label)
      let newDetail = { label: currentDetail.label, value: 0, points: 0}
      sameLabels.forEach(detail=>{
        newDetail.value += detail.value
        newDetail.points += detail.points
      })
      newDetails.push(newDetail)
      added.push(currentDetail.label)
    }
  })
  let sum = details.reduce((acc , curr)=>{
    return acc + curr.points
  }, 0)
  newDetails.push({ label: "a joué 2 matches", value: 1, points: sum+"÷2" })
  return newDetails
}

async function generateStats(roundId){
  let roundStats = {}, globalStats = {}
  /** get round ranks **/
  let ranks = (await Squad.findAll({
      attributes: ['score', [Sequelize.fn('COUNT', 'score'), 'count']],
      where: {roundId},
      order: [["score", "DESC"]],
      group: ['score'],
    })).map(i=>i.toJSON())

  /** get mean scores **/
  let totalCount = 0
  let total = ranks.reduce((acc, curr)=>{
    totalCount += curr.count
    return acc + curr.score * curr.count
  }, 0)
  let mean = Math.floor(total / totalCount)


  /** save round stats **/
  roundStats.ranks = ranks.map(rank=>rank.score)
  roundStats.mean = mean
  let [foundRoundStats, createdRoundStats] = await Stats.findOrCreate({
    where: { roundId },
    defaults: {roundId, stats: roundStats}
  });
  if(!createdRoundStats) await foundRoundStats.update({...foundRoundStats, stats: roundStats})


  /** get global ranks **/
  let globalRanks = (await User.findAll({
    attributes: ['score', [Sequelize.fn('COUNT', 'score'), 'count']],
    group: ["score"],
    order: [["score", "DESC"]],
    })).map(i=>i.toJSON())

  /** get mean scores **/
  let globalTotalCount = 0
  let globalTotal = ranks.reduce((acc, curr)=>{
    totalCount += curr.count
    return acc + curr.score * curr.count
  }, 0)
  let globalMean = Math.floor(globalTotal / globalTotalCount)

  /** save global stats **/
  globalStats.ranks = globalRanks.map(rank=>rank.score)
  roundStats.mean = globalMean
  let [foundGlobalStats, createdGlobalStats] = await Stats.findOrCreate({
    where: { isGlobal: true },
    defaults: { stats: globalStats}
  });
  if(!createdGlobalStats) await foundGlobalStats.update({...foundGlobalStats, stats: globalStats})

}

module.exports = {
  pointCalculation
}