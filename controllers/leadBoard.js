const { User, Squad, Stats } = require('../database');
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

async function getRanks(req, res){
    try{
        let ranks, totalPlayers, userScore
        const {roundId} = req.query
        if (roundId === "all") {
            totalPlayers = (await User.count({}));
            userScore = req.user.score
            let stats = await Stats.findOne({ where : { isGlobal: true }})
            ranks = stats?.toJSON().stats?.ranks || [0]
        }
        else {
            totalPlayers = (await Squad.count({ where: { roundId} }));
            userScore = (await Squad.findOne({
                where: {
                    userId: req.user.id,
                    roundId
                }
            }))?.toJSON().score || "N/A"
            let stats = await Stats.findOne({ where : { roundId }})
            ranks = stats?.toJSON().stats?.ranks || [0]
        }
        res.status(200).send({
            ranks,
            totalPlayers,
            userScore,
            id: req.user.id,
        })
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
    getRanks
}