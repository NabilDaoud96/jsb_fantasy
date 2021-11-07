const {Stats} = require("../database")
async function getStats(req,res){
  try {
    const {roundId} = req.query
    let where
    if(roundId === 'all') where = {isGlobal: true}
    else where = {roundId}
    let result = await Stats.findOne({where})
    res.status(200).send(result?.toJSON().stats)
  }
  catch (e) {
    console.log(e)
    return res.status(500).json({
      success: false,
      errorMessage: 'Unknown server error while getting stats',
      errorMessageKey: 'SERVER_ERROR'
    });
  }
}

module.exports = {
  getStats
}