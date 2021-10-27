const {Round, Squad} = require('../database');
const {Op} = require('sequelize')
const moment  = require("moment")

  async function all(req, res){
    const result = await getAllRounds()
    res.status(200).send(result)
  }

  async function show(req, res){
    const result = (await Round.findByPk(req.params.id)).toJSON()
    res.status(200).send(result)
  }

  async function create(req, res){
    try{
      const roundExists = await Round.findOne({
        where: {name : req.body.name}
      })

      if(roundExists) return res.status(400).json({
        success: false,
        errorMessage: "Ce nom existe déjà",
        field: 'name'
      });

      await Round.create(req.body)
      res.status(201).send()
    }
    catch (e){
      return res.status(500).json({
        success: false,
        errorMessage: 'Unknown server error while creating round',
        errorMessageKey: 'SERVER_ERROR'
      });
    }
  }

  async function update(req, res) {
    const roundExists = await Round.findOne({
      where: {
        id: {[Op.not]: req.body.id},
        name : req.body.name
      }
    })

    if(roundExists) return res.status(400).json({
      success: false,
      errorMessage: "Ce nom existe déjà",
      field: 'name'
    });

    await Round.update(req.body, {where: { id: req.body.id}});

  res.status(204).send()
  }

  async function deleteRound (req, res){
    const round = await Round.findByPk(req.params.id)
    await round.destroy()
    res.status(204).send()
  }

async function currentRound (req, res){
  let now = moment().toDate()
  const round = await Round.findOne({
    where: { deadLine: {[Op.gte]: now}},
    order: [['deadLine','ASC']]
  })
  res.status(200).send(round?.toJSON())
}

async function availableRounds (req, res){
  const rounds = await getAvailableRounds(req.user?.id)
  res.status(200).send(rounds)
}

async function getAllRounds(){
  return (await Round.findAll({
    order: [['deadLine','ASC']]
  })).map(i => i.toJSON());
}

async function getAvailableRounds(userId){
  const firstSquad = (await Squad.findOne({
    where: { userId },
    order: [['createdAt','ASC']]

  }))?.toJSON()
  if(!firstSquad) return []
  const rounds = (await Round.findAll({
    where: {
      deadLine: {
        [Op.gte]: new Date(firstSquad.createdAt)
      }

    },
    order: [['deadLine','ASC']]
  })).map(i => i.toJSON());
  return rounds
}
module.exports = {
  all,
  show,
  create,
  update,
  delete: deleteRound,
  currentRound,
  availableRounds,
  getAllRounds,
  getAvailableRounds
}

