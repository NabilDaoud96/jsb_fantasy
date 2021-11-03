const { User, Squad } = require('../database');
const { Op } = require('sequelize')

const pageSize = 10
async function getLeadBoard(req, res) {
    try{
        const {roundId, page} = req.query
        const offset = (Number(page) - 1) * pageSize
        let rows, count;
        if (roundId === "all") {
            let users = (await User.findAndCountAll({
                offset: offset,
                limit: pageSize,
                order: [["score", "DESC"]]
            }))
            count = users.count
            rows = users.rows.map(user => {
                return {
                    id: user.toJSON().id,
                    team: user.toJSON().team,
                    firstName: user.toJSON().firstName,
                    lastName: user.toJSON().lastName,
                    points: user.toJSON().score
                }
            });
        } else {
            let squads = (await Squad.findAndCountAll({
                where: {roundId},
                offset: offset,
                limit: pageSize,
                include: [{model: User, as: "user"}],
                order: [["score", "DESC"]]
            }))
            count = squads.count
            rows = squads.rows.map(squad => {
                squad = squad.toJSON()
                return {
                    id: squad.user.id,
                    team: squad.user.team,
                    firstName: squad.user.firstName,
                    lastName: squad.user.lastName,
                    points: squad.score
                }
            });

        }
        res.status(200).send({count, rows})
    }
    catch (e) {
        console.log(e)
        return res.status(500).json({
            success: false,
            errorMessage: 'Unknown server error while getting lead board',
            errorMessageKey: 'SERVER_ERROR'
        });
    }
}

async function getUserRank(req, res){
    try{
        const {roundId} = req.query
        let count;
        if (roundId === "all") {
            count = (await User.count({
                where: {score: {[Op.gt]: req.user.score}}
            }));
        } else {
            // todo fix [Op.gt]: squad.score
            count = (await Squad.count({
                where: {
                    score: {[Op.gt]: req.user.score},
                    roundId
                }
            }));
        }
        res.status(200).send({rank: count , id: req.user.id})
    }
    catch (e) {
        console.log(e)
        return res.status(500).json({
            success: false,
            errorMessage: 'Unknown server error while getting user rank',
            errorMessageKey: 'SERVER_ERROR'
        });
    }
}

module.exports = {
    getLeadBoard,
    getUserRank
}