const {User, Squad} = require('../database');
const {Op} = require('sequelize')

  async function all(req, res){
    const result = (await User.findAll({
      include: [{model: Squad, as: 'squads'}]
    })).map(i => i.toJSON());
    res.status(200).send(result)
  }

  async function show(req, res){
    const result = (await User.findByPk(req.params.id)).toJSON()
    res.status(200).send(result)
  }

  async function create(req, res){
    try{
      const usernameExists = await User.findOne({
        where: {username : req.body.username}
      })

      if(usernameExists) return res.status(400).json({
        success: false,
        errorMessage: "Ce nom d'utilisateur existe déjà",
        field: 'username'
      });


      const fullNameExists = await User.findOne({
        where: {fullName : req.body.fullName}
      })

      if(fullNameExists) return res.status(400).json({
        success: false,
        errorMessage: "Nom existe déjà",
        field: 'fullName'
      });

      await User.create(req.body)
      res.status(201).send()
    }
    catch (e){
      return res.status(500).json({
        success: false,
        errorMessage: 'Unknown server error while creating user',
        errorMessageKey: 'SERVER_ERROR'
      });
    }
  }

  async function update(req, res) {
    const usernameExists = await User.findOne({
      where: {
        id: {[Op.not]: req.body.id},
        username : req.body.username
      }
    })

    if(usernameExists) return res.status(400).json({
      success: false,
      errorMessage: "Ce nom d'utilisateur existe déjà",
      field: 'username'
    });


    const fullNameExists = await User.findOne({
      where: {
        id: {[Op.not]: req.body.id},
        fullName : req.body.fullName
      }
    })

    if(fullNameExists) return res.status(400).json({
      success: false,
      errorMessage: "Nom existe déjà",
      field: 'fullName'
    });

    await User.update(req.body, {where: { id: req.body.id}});

  res.status(204).send()
  }

  async function deleteUser (req, res){
    const user = await User.findByPk(req.params.id)
    await user.destroy()
    res.status(204).send()
  }

module.exports = {
  all,
  show,
  create,
  update,
  delete: deleteUser
}

