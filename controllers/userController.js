const fs =  require('fs')

const users = JSON.parse(
    fs.readFileSync(`${__dirname}/../dev-data/data/users.json`)
)

const getAllUsers = (req, res) => {
    console.log(req.requestTime, 'Request');
    res.status(200).json({
        message:"Success",
        requestedAt: req.requestTime,
        results : users.length,
        data: {
            tours: users
        }
    })
}
const userByID = (req, res) => {
    res.status(500).json({
        status: 'error',
        message:'This Route is not yet defined'
    })
}
const createUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message:'This Route is not yet defined'
    })
}
const updateUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message:'This Route is not yet defined'
    })
}
const deleteUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message:'This Route is not yet defined'
    })
}

module.exports ={
    getAllUsers,
    userByID,
    createUser,
    updateUser,
    deleteUser
}
