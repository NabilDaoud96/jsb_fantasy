const {Match, Team, Round} = require('../database');

  async function all(req, res){
    const result = (await Match.findAll({
      include: [
        { model: Team, as: 'team1'},
        { model: Team, as: 'team2'},
        { model: Round, as: 'round'},
      ]
    })).map(i => i.toJSON());
    res.status(200).send(result)
  }

  async function MatchesByRound(req, res){
    const result = (await Round.findAll({
      order: [['deadLine', 'ASC']],
      include: [
        {
          model: Match,
          as: 'matches',
          required: true,
          include: [
            { model: Team, as: 'team1'},
            { model: Team, as: 'team2'},
          ]
        },
      ]
    })).map(i => i.toJSON());
    res.status(200).send(result)
  }

  async function show(req, res){
    const result = (await Match.findByPk(req.params.id, {
      include: [
        { model: Team, as: 'team1'},
        { model: Team, as: 'team2'},
        { model: Round, as: 'round'},
      ]
    })).toJSON()
    res.status(200).send(result)
  }

  async function create(req, res){
    try{
      await Match.create(req.body)
      res.status(201).send()
    }
    catch (e){
      console.log(e)
      return res.status(500).json({
        success: false,
        errorMessage: 'Unknown server error while creating match',
        errorMessageKey: 'SERVER_ERROR'
      });
    }
  }

  async function update(req, res) {
    await Match.update(req.body, {where: { id: req.body.id}});
    res.status(204).send()
  }

  async function deleteMatch (req, res){
    const match = await Match.findByPk(req.params.id)
    await match.destroy()
    res.status(204).send()
  }

module.exports = {
  all,
  show,
  create,
  update,
  delete: deleteMatch,
  MatchesByRound
}

