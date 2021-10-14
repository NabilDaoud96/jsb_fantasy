const {Player, Team, Score} = require('../database');
const {Op} = require('sequelize')

  async function all(req, res){
    const query= {}
    if(req.query.teamId) query.teamId = req.query.teamId
    const result = (await Player.findAll({
      where: query,
      include: [
        {model: Team, as: "team"},
        {model: Score, as: 'scores'}
      ]

    })).map(i => i.toJSON());
    res.status(200).send(result)
  }

  async function show(req, res){
    const result = (await Player.findByPk(req.params.id,{
      include: [
        {model: Team, as: "team"},
        {model: Score, as: 'scores'}
      ],
    })).toJSON()
    res.status(200).send(result)
  }

  async function create(req, res){
    try{
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

module.exports = {
  all,
  show,
  create,
  update,
  delete: deletePlayer
}

