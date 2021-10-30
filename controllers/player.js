const {Player, Team, Score, Round} = require('../database');
const  sequelize = require('sequelize')

const {Op}  = sequelize

  async function all(req, res){
    const query= {}
    const whereTeam= {}
    const order= []
    if(req.query.teamId && req.query.teamId !== "all") {
      query[Op.or] = [
        {teamId : req.query.teamId},
        {team2Id : req.query.teamId}
        ]
    }
    if(req.query.position) query.position = req.query.position
    if(req.query.name) query[Op.or] = [
      {fullName: sequelize.where(sequelize.fn('LOWER', sequelize.col('fullName')), 'LIKE', '%' + req.query.name.toLowerCase() + '%')},
      {label: sequelize.where(sequelize.fn('LOWER', sequelize.col('label')), 'LIKE', '%' + req.query.name.toLowerCase() + '%')},
    ]
    if(req.query.sortBy === 'DESC') order.push(['price', 'DESC'])
    if(req.query.sortBy === 'ASC') order.push(['price', 'ASC'])
    if(req.query.availablePlayers) whereTeam.isOut = false


    const players = (await Player.findAll({
      where: query,
      order,
      include: [
        {
          model: Team,
          as: "team",
          where: whereTeam,
          required: true
        },
        {
          model: Score,
          as: 'scores',
          include: [ {model: Round, as: "round"}]
        }
      ]

    })).map(i => i.toJSON())

    const result = []
    for(let player of players){
      let team2 = null
      if(player.team2Id) team2 = await getTeam2(player.team2Id)
      result.push({...player, team2})
    }

    res.status(200).send(result)
  }

  async function show(req, res){
    const result = (await Player.findByPk(req.params.id,{
      include: [
        {model: Team, as: "team"},
        {
          model: Score,
          as: 'scores',
          include: [ {model: Round, as: "round"}]
        }
      ],
    })).toJSON()
    if(result.team2Id) result.team2 = await getTeam2(result.team2Id)
    res.status(200).send(result)
  }

  async function create(req, res){
    try{

      if(req.body.position !== 'goalkeeper')
        req.body.team2Id = null

      const fullNameExists = await Player.findOne({
        where: {fullName : req.body.fullName}
      })

      if(fullNameExists) return res.status(400).json({
        success: false,
        errorMessage: "Nom existe déjà",
        field: 'fullName'
      });

      const labelExists = await Player.findOne({
        where: {label : req.body.label}
      })

      if(labelExists) return res.status(400).json({
        success: false,
        errorMessage: "Label existe déjà",
        field: 'label'
      });

      await Player.create(req.body)
      res.status(201).send()
    }
    catch (e){
      return res.status(500).json({
        success: false,
        errorMessage: 'Unknown server error while creating player',
        errorMessageKey: 'SERVER_ERROR'
      });
    }
  }

  async function update(req, res) {
    if(req.body.position !== 'goalkeeper')
      req.body.team2Id = null

    const fullNameExists = await Player.findOne({
      where: {
        id: {[Op.not]: req.body.id},
        fullName : req.body.fullName
      }
    })

    if(fullNameExists) return res.status(400).json({
      success: false,
      errorMessage: "Nom existe déjà",
      errorMessageKey: 'VALIDATION_ERROR'
    });

    const labelExists = await Player.findOne({
      where: {
        id: {[Op.not]: req.body.id},
        label : req.body.label
      }
    })

    if(labelExists) return res.status(400).json({
      success: false,
      errorMessage: "Label existe déjà",
      errorMessageKey: 'VALIDATION_ERROR'
    });

    await Player.update(req.body, {where: { id: req.body.id}});

    res.status(204).send()
  }

  async function deletePlayer (req, res){
    const player = await Player.findByPk(req.params.id)
    await player.destroy()
    res.status(204).send()
  }

  async function getTeam2(id){
    return (await Team.findByPk(id))?.toJSON()
  }

module.exports = {
  all,
  show,
  create,
  update,
  delete: deletePlayer
}

