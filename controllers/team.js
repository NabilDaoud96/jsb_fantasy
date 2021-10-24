const {Team} = require('../database');
const {Op} = require('sequelize')

  async function all(req, res){
    const {availableTeams} = req.query
    const where  = {}
    if(availableTeams) where.isOut = false
    const result = (await Team.findAll({
      where
    })).map(i => i.toJSON());
    res.status(200).send(result)
  }

  async function show(req, res){
    const result = (await Team.findByPk(req.params.id)).toJSON()
    res.status(200).send(result)
  }

  async function create(req, res){
    try{
      await Team.create(req.body)
      res.status(201).send()
    }
    catch (e){
      console.log(e)
      return res.status(500).json({
        success: false,
        errorMessage: 'Unknown server error while creating team',
        errorMessageKey: 'SERVER_ERROR'
      });
    }
  }

  async function update(req, res) {
    await Team.update(req.body, {where: { id: req.body.id}});
    res.status(204).send()
  }

  async function deleteTeam (req, res){
    const team = await Team.findByPk(req.params.id)
    await team.destroy()
    res.status(204).send()
  }

module.exports = {
  all,
  show,
  create,
  update,
  delete: deleteTeam
}

