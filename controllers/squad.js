const {Squad, PlayerSquad, Player} = require('../database');
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
      }]
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
        }]
      })).toJSON()
    res.status(200).send(result)
  }

  async function create(req, res){
    try{
      const squadExists = await Squad.findOne({
        where: {
          round : req.body.round,
          userId: req.body.userId
        }
      })

      if(squadExists) return res.status(400).json({
        success: false,
        errorMessage: "dupliccate_squad",
        field: 'squad'
      });

      let createdSquad = await Squad.create(req.body)

      // make sure squad has no player
      await PlayerSquad.destroy({
        where: { squadId: createdSquad.toJSON().id }
      })

      // goalKeeper
      await PlayerSquad.create({
        squadId: createdSquad.toJSON().id,
        playerId: req.body.goalKeeper,
        position: positions.goalKeeper
      })

      // defenders
      for (let defender of req.body.defenders){
        await PlayerSquad.create({
          squadId: createdSquad.toJSON().id,
          playerId: defender,
          position: positions.defender
        })
      }

      // attackers
      for (let attacker of req.body.attackers){
        await PlayerSquad.create({
          squadId: createdSquad.toJSON().id,
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

  async function update(req, res) {
    await Squad.update(req.body, {where: { id: req.body.id}});
    // make sure squad has no player
    await PlayerSquad.destroy({
      where: { squadId: req.body.id }
    })

    // goalKeeper
    await PlayerSquad.create({
      squadId: req.body.id,
      playerId: req.body.goalKeeper,
      position: positions.goalKeeper
    })

    // defenders
    for (let defender of req.body.defenders){
      await PlayerSquad.create({
        squadId: req.body.id,
        playerId: defender,
        position: positions.defender
      })
    }

    // attackers
    for (let attacker of req.body.attackers){
      await PlayerSquad.create({
        squadId: req.body.id,
        playerId: attacker,
        position: positions.attacker
      })
    }
    res.status(204).send()
  }

  async function deleteSquad (req, res){
    const squad = await Squad.findByPk(req.params.id)
    await squad.destroy()
    res.status(204).send()
  }

module.exports = {
  all,
  show,
  create,
  update,
  delete: deleteSquad
}

