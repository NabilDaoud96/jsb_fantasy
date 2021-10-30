const {Team} = require('../database');
const {Op} = require('sequelize')

  async function all(req, res){
    try{
      const {availableTeams} = req.query
      const where = {}
      if (availableTeams) where.isOut = false
      const result = (await Team.findAll({
        order: [['id', 'DESC']],
        where
      })).map(i => i.toJSON());
      res.status(200).send(result)
    }
    catch (e) {
      console.log(e)
      return res.status(500).json({
        success: false,
        errorMessage: 'Unknown server error while listing teams',
        errorMessageKey: 'SERVER_ERROR'
      });
    }
  }

  async function show(req, res){
    try{
      const result = (await Team.findByPk(req.params.id)).toJSON()
      res.status(200).send(result)
    }catch (e) {
      console.log(e)
      return res.status(500).json({
        success: false,
        errorMessage: 'Unknown server error while getting team',
        errorMessageKey: 'SERVER_ERROR'
      });
    }
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
    try{
      const team = await Team.findByPk(req.params.id)
      await team.destroy()
      res.status(204).send()
    }
    catch (e) {
      console.log(e)
      return res.status(500).json({
        success: false,
        errorMessage: 'Unknown server error while deleting team',
        errorMessageKey: 'SERVER_ERROR'
      });
    }
  }

module.exports = {
  all,
  show,
  create,
  update,
  delete: deleteTeam
}

