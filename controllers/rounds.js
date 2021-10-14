const {Round: Rounds} = require('../database');
const {Op} = require('sequelize')

  async function all(req, res){
    const result = (await Rounds.findAll({})).map(i => i.toJSON());
    res.status(200).send(result)
  }

  async function show(req, res){
    const result = (await Rounds.findByPk(req.params.id)).toJSON()
    res.status(200).send(result)
  }

  async function create(req, res){
    try{
      const roundExists = await Rounds.findOne({
        where: {name : req.body.name}
      })

      if(roundExists) return res.status(400).json({
        success: false,
        errorMessage: "Ce nom existe déjà",
        field: 'name'
      });

      await Rounds.create(req.body)
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
    const roundExists = await Rounds.findOne({
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

    await Rounds.update(req.body, {where: { id: req.body.id}});

  res.status(204).send()
  }

  async function deleteRound (req, res){
    const round = await Rounds.findByPk(req.params.id)
    await round.destroy()
    res.status(204).send()
  }

module.exports = {
  all,
  show,
  create,
  update,
  delete: deleteRound
}

