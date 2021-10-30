const {Squad, PlayerSquad, Player, Round, Score, Team, User} = require('../database');
const {Op} = require('sequelize')
const {getAvailableRounds} = require('./rounds')
const positions = require("../constants/positions.json")

  async function all(req, res){
    try{
      let where = {}
      // todo check from admin
      if (req.user?.role === 'admin' && req.query.userId) where.userId = req.query.userId
      else where.userId = req.user.id
      const result = (await Squad.findAll({
        where,
        include: [{
          model: PlayerSquad,
          as: "playerSquads",
          include: {model: Player, as: 'player'}
        },
          {model: Round, as: 'round'},
        ]
      })).map(i => i.toJSON());
      res.status(200).send(result)
    }
    catch (e) {
      console.log(e)
      return res.status(500).json({
        success: false,
        errorMessage: 'Unknown server error while listing squads',
        errorMessageKey: 'SERVER_ERROR'
      });
    }
  }

  async function show(req, res){
    try{
      const squad = (await Squad.findOne({
        where: {roundId: req.params.roundId, userId: req.user.id},
        include: [{
          model: PlayerSquad,
          as: "playerSquads",
          include: [{
            model: Player,
            as: 'player',
            include: [
              {model: Score, as: 'scores', duplicating: false, where: {roundId: req.params.roundId}, required: false},
              {model: Team, as: 'team'}
            ]
          }]
        },
          {model: Round, as: 'round'},
        ]
      }))?.toJSON()
      if (squad?.playerSquads.length > 0)
        for (let playerSquad of squad.playerSquads) {
          if (playerSquad.player.team2Id) playerSquad.player.team2 = await getTeam2(playerSquad.player.team2Id)
          console.log(playerSquad.player)
        }
      if (!squad) res.status(404).send(squad)
      res.status(200).send(squad)
    }
    catch (e) {
      console.log(e)
      return res.status(500).json({
        success: false,
        errorMessage: 'Unknown server error while getting squad',
        errorMessageKey: 'SERVER_ERROR'
      });
    }
  }

  async function createAllSquads(req, res){
    try{
      const users = (await User.findAll({})).map(i => i.toJSON())
      for (let user of users) {
        let squad = await findSquad(req.params.roundId, user.id)
        let rounds = await getAvailableRounds(user.id)
        let index = rounds.findIndex(round => round.id == req.params.roundId)
        let previousRound = rounds[index - 1]
        if (!squad && previousRound) {
          //else first squad is not yet created => didnt start the game yet

          // get previous squad
          let previousSquad = await findSquad(previousRound.id, user.id)
          let newSquad = await Squad.create({
            userId: user.id,
            roundId: req.params.roundId,
            captain: previousSquad.captain
          })

          let goalkeeper = null, defenders = {}, attackers = {}, midfielders = {};
          previousSquad.playerSquads.forEach(playerSquad => {
            if (playerSquad.position === 'defender') defenders[playerSquad.order] = playerSquad.player
            else if (playerSquad.position === 'attacker') attackers[playerSquad.order] = playerSquad.player
            else if (playerSquad.position === 'midfielder') midfielders[playerSquad.order] = playerSquad.player
            else if (playerSquad.position === 'goalkeeper') goalkeeper = playerSquad.playerId
          })
          await createPlayerSquad(newSquad.toJSON().id, {goalkeeper, midfielders, defenders, attackers})
        }
      }
      return res.status(200).send()
    }
    catch (e) {
      console.log(e)
      return res.status(500).json({
        success: false,
        errorMessage: 'Unknown server error while creating all squads',
        errorMessageKey: 'SERVER_ERROR'
      });
    }
  }

  async function create(req, res){
    try{
      // check deadLine
      let round = (await Round.findOne({where: {id: req.body.roundId}}))?.toJSON()
      if(new Date() > new Date(round.deadLine))
        return res.status(400).json({
          success: false,
          errorMessage: 'Transfers limit',
          errorMessageKey: 'DEADLINE_PASSED'
        });

      let [foundSquad, created] = await Squad.findOrCreate({
        where: { roundId : req.body.roundId, userId: req.user.id},
        defaults: {...req.body, userId: req.user.id}
      });

      if(!created){
        let rounds = await getAvailableRounds(req.user.id)
        let index = rounds.findIndex(round=>round.id == req.body.roundId)
        let previousRound = rounds[index - 1]
        if(previousRound){
          // get previous squad
          let previousSquad = await findSquad(previousRound.id, req.user.id)
          let newSquad = [
            req.body.goalkeeper,
            ...Object.values(req.body.defenders).map(defender=>defender.id),
            ...Object.values(req.body.midfielders).map(midfielder=>midfielder.id),
            ...Object.values(req.body.attackers).map(attacker=>attacker.id),
          ]
          const transfersNumber = getTransfersNumber (previousSquad.playerSquads.map(i=>i.playerId), newSquad)
          if(round.allowedTransfers < transfersNumber)
            return res.status(400).json({
              success: false,
              errorMessage: 'Transfers limit',
              errorMessageKey: 'TRANSFERS_LIMIT'
            });
        }
        await foundSquad.update({...req.body})
      }



      await createPlayerSquad(foundSquad.toJSON().id, req.body)
      res.status(201).send()
    }
    catch (e){
      console.log(e)
      return res.status(500).json({
        success: false,
        errorMessage: 'Unknown server error while creating squad',
        errorMessageKey: 'SERVER_ERROR'
      });
    }
  }

  async function deleteSquad (req, res){
    try{
      const squad = await Squad.findByPk(req.params.id)
      await squad.destroy()
      res.status(204).send()
    }
    catch (e) {
      console.log(e)
      return res.status(500).json({
        success: false,
        errorMessage: 'Unknown server error while deleting squad',
        errorMessageKey: 'SERVER_ERROR'
      });
    }
  }

  async function hasSquad (req, res){
    try{
      const squad = await Squad.findOne({
        where: {userId: req.user.id}
      })
      res.status(200).send({hasSquad: !!squad})
    }
    catch (e) {
      console.log(e)
      return res.status(500).json({
        success: false,
        errorMessage: 'Unknown server error while has squad',
        errorMessageKey: 'SERVER_ERROR'
      });
    }
  }

  function getTransfersNumber(oldSquad, newSquad){
  let difference = newSquad.filter(player => !oldSquad.includes(player));
  return difference.length
}


async function transfersNumberController(req, res){
  try{
    const {roundId, newSquad} = req.body
    let rounds = await getAvailableRounds(req.user.id)
    let index = rounds.findIndex(round => round.id == roundId)
    let previousRound = rounds[index - 1]
    if (!previousRound) return res.status(200).send({transfersNumber: 0})
    // get previous squad
    let previousSquad = await findSquad(previousRound.id, req.user.id)
    const transfersNumber = getTransfersNumber(previousSquad.playerSquads.map(i => i.playerId), newSquad)
    return res.status(200).send({transfersNumber})
  }catch (e) {
    console.log(e)
    return res.status(500).json({
      success: false,
      errorMessage: 'Unknown server error while getting transfers',
      errorMessageKey: 'SERVER_ERROR'
    });
  }
  }


  async function createPlayerSquad(squadId, data){

    // make sure squad has no player
    await PlayerSquad.destroy({
      where: { squadId: squadId }
    })

    // goalKeeper
    await PlayerSquad.create({
      squadId: squadId,
      order: '0',
      playerId: data.goalkeeper,
      position: positions.goalkeeper
    })

    // defenders
    for (let [order, defender] of Object.entries(data.defenders)){
      await PlayerSquad.create({
        squadId: squadId,
        order,
        playerId: defender.id,
        position: positions.defender
      })
    }

    // midfielders
    for (let [order, midfielder] of Object.entries(data.midfielders)){
        await PlayerSquad.create({
          squadId: squadId,
          order,
          playerId: midfielder.id,
          position: positions.midfielder
      })
    }

    // attackers
    for (let [order, attacker] of Object.entries(data.attackers)){
      await PlayerSquad.create({
        squadId: squadId,
        order,
        playerId: attacker.id,
        position: positions.attacker
      })
    }
  }

  async function findSquad(roundId, userId){
    const squad = (await Squad.findOne({
      where: {roundId, userId},
      include: [{
        model: PlayerSquad,
        as: "playerSquads",
        include: [{
          model: Player,
          as: 'player',
          include: [
            {model: Score, as: 'scores', duplicating: false, where: {roundId: roundId}, required: false},
            {model: Team, as: 'team'}
          ]
        }]
      },
        { model: Round, as: 'round'},
      ]
    }))?.toJSON()
    if(squad?.playerSquads.length > 0)
      for(let playerSquad of squad.playerSquads){
      if(playerSquad.player.team2Id) playerSquad.player.team2 = await getTeam2(playerSquad.player.team2Id)
      console.log(playerSquad.player)
    }
    return squad
  }

  async function getTeam2(id){
    return (await Team.findByPk(id))?.toJSON()
  }
module.exports = {
  all,
  show,
  create,
  delete: deleteSquad,
  hasSquad,
  createAllSquads,
  transfersNumberController
}

