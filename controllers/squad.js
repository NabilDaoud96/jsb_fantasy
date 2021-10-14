const {Squad, PlayerSquad, Player, Round} = require('../database');
const {Op} = require('sequelize')
const positions = require("../constants/positions.json")

  async function all(req, res){
    let where = {}
    if(req.query.userId) where.userId = req.query.userId
    const result = (await Squad.findAll({
      where,
      include: [{
        model: PlayerSquad,
        as: "playerSquads",
        include: {model: Player, as: 'player'}
      },
      { model: Round, as: 'round'},
      ]
    })).map(i => i.toJSON());
    res.status(200).send(result)
  }

  async function show(req, res){
    const result = (await Squad.findByPk(req.params.id,
      {
        include: [{
          model: PlayerSquad,
          as: "playerSquads",
          include: {model: Player, as: 'player'}
        },
          { model: Round, as: 'round'},
        ]
      })).toJSON()
    res.status(200).send(result)
  }

  async function create(req, res){
    try{

      let [foundSquad, created] = await Squad.findOrCreate({
        where: { roundId : req.body.roundId, userId: req.body.userId},
        defaults: req.body
      });

      // todo
      // if(!created) detect number of transfers and compare it to round.allowedTransfers

      const numberOfTransfers = getTransfersNumber(foundSquad, req.body)

      let round = Round.findOne({where: {id: req.body.roundId}})
      if(numberOfTransfers > round.toJSON().allowedTransfers)
        return res.status(400).json({
          success: false,
          errorMessage: 'Transfers limit',
          errorMessageKey: 'TRANSFERS_LIMIT'
        });

      // make sure squad has no player
      await PlayerSquad.destroy({
        where: { squadId: foundSquad.toJSON().id }
      })

      // goalKeeper
      await PlayerSquad.create({
        squadId: foundSquad.toJSON().id,
        playerId: req.body.goalKeeper,
        position: positions.goalKeeper
      })

      // defenders
      for (let defender of req.body.defenders){
        await PlayerSquad.create({
          squadId: foundSquad.toJSON().id,
          playerId: defender,
          position: positions.defender
        })
      }

      // midfielders
      for (let midfielder of req.body.midfielders){
        await PlayerSquad.create({
          squadId: foundSquad.toJSON().id,
          playerId: midfielder,
          position: positions.midfielder
        })
      }

      // attackers
      for (let attacker of req.body.attackers){
        await PlayerSquad.create({
          squadId: foundSquad.toJSON().id,
          playerId: attacker,
          position: positions.attacker
        })
      }

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
    const squad = await Squad.findByPk(req.params.id)
    await squad.destroy()
    res.status(204).send()
  }
  async function hasSquad (req, res){
    const squad = await Squad.findOne({
      where: {userId: req.user.id}
    })
    res.status(204).send(!!squad)
  }

  async function getTransfersNumber(oldSquad, newSquad){
    return 3
  }

module.exports = {
  all,
  show,
  create,
  delete: deleteSquad,
  hasSquad
}

