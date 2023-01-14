const {Player, Team, Score, Round, PlayerSquad, Squad, User} = require('../database');
const roundsController = require("./rounds")
const  sequelize = require('sequelize')

const {Op}  = sequelize

  async function all(req, res){
    try{
      const query = {}
      const whereTeam = {}
      let order = [['fullName', 'ASC']]
      if (req.query.teamId && req.query.teamId !== "all") {
        query[Op.or] = [
          {teamId: req.query.teamId},
          {team2Id: req.query.teamId}
        ]
      }
      if (req.query.position) query.position = req.query.position
      if (req.query.name) query[Op.or] = [
        {fullName: sequelize.where(sequelize.fn('LOWER', sequelize.col('fullName')), 'LIKE', '%' + req.query.name.toLowerCase() + '%')},
        {label: sequelize.where(sequelize.fn('LOWER', sequelize.col('label')), 'LIKE', '%' + req.query.name.toLowerCase() + '%')},
      ]
      if (req.query.sortBy === 'DESC') order = [['price', 'DESC']]
      if (req.query.sortBy === 'ASC') order = [['price', 'ASC']]

      if (req.query.availablePlayers) whereTeam.isOut = false


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
            include: [{model: Round, as: "round"}]
          }
        ]

      })).map(i => i.toJSON())

      const result = []
      for (let player of players) {
        let team2 = null
        if (player.team2Id) team2 = await getTeam2(player.team2Id)
        result.push({...player, team2})
      }

      res.status(200).send(result)
    }
    catch (e) {
      console.log(e)
      return res.status(500).json({
        success: false,
        errorMessage: 'Unknown server error while listing players',
        errorMessageKey: 'SERVER_ERROR'
      });
    }
  }

  async function show(req, res){
    try{
      const result = (await Player.findByPk(req.params.id, {
        include: [
          {model: Team, as: "team"},
          {
            model: Score,
            as: 'scores',
            include: [{model: Round, as: "round"}]
          }
        ],
      })).toJSON()
      if (result.team2Id) result.team2 = await getTeam2(result.team2Id)
      res.status(200).send(result)
    }
    catch (e) {
      console.log(e)
      return res.status(500).json({
        success: false,
        errorMessage: 'Unknown server error while getting player',
        errorMessageKey: 'SERVER_ERROR'
      });
    }
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
    try{
      if (req.body.position !== 'goalkeeper')
        req.body.team2Id = null

      const fullNameExists = await Player.findOne({
        where: {
          id: {[Op.not]: req.body.id},
          fullName: req.body.fullName
        }
      })

      if (fullNameExists) return res.status(400).json({
        success: false,
        errorMessage: "Nom existe déjà",
        errorMessageKey: 'VALIDATION_ERROR'
      });

      const labelExists = await Player.findOne({
        where: {
          id: {[Op.not]: req.body.id},
          label: req.body.label
        }
      })

      if (labelExists) return res.status(400).json({
        success: false,
        errorMessage: "Label existe déjà",
        errorMessageKey: 'VALIDATION_ERROR'
      });

      const oldData = await Player.findByPk(req.body.id)

      await Player.update(req.body, {where: {id: req.body.id}});

      if(oldData.price != req.body.price)
        await onPlayerPriceChange(oldData.id, Number(req.body.price) - Number(oldData.price))

      res.status(204).send()
    }
    catch (e) {
      console.log(e)
      return res.status(500).json({
        success: false,
        errorMessage: 'Unknown server error while updating player user',
        errorMessageKey: 'SERVER_ERROR'
      });
    }
  }

  async function deletePlayer (req, res){
    try{
      const player = await Player.findByPk(req.params.id)
      await player.destroy()
      res.status(204).send()
    }
    catch (e) {
      console.log(e)
      return res.status(500).json({
        success: false,
        errorMessage: 'Unknown server error while deleting player',
        errorMessageKey: 'SERVER_ERROR'
      });
    }
  }

  async function getTeam2(id){
    return (await Team.findByPk(id))?.toJSON()
  }

  async function onPlayerPriceChange(playerId, change){
    // get last round
    const allRounds = await roundsController.getAllRounds()
    const currentRound = await roundsController.getCurrentRound()
    const currentRoundIndex = allRounds.findIndex(round=>round.id === currentRound.id)
    if(currentRoundIndex === -1) throw 'round not found'
    const lastRound = allRounds[currentRoundIndex - 1]
    if(!lastRound) return
    // get all users that had the player last round
    const squads = await PlayerSquad.findAll(
      {
        attributes: ['id'],
        raw: true,
        where: {
          playerId
        },
        include: [ {
          model: Squad,
          as: "squad",
          where: {roundId: lastRound.id},
          attributes: ['userId']
        } ]
    })
    const userIds = squads.map(squad=>squad['squad.userId'])
    // update their budgets with the change
    for (let id of userIds){
      let user = await User.findByPk(id)
      await user.update({...user.toJSON(), budget: user.toJSON().budget + Number(change)})
    }
  }

module.exports = {
  all,
  show,
  create,
  update,
  delete: deletePlayer
}

