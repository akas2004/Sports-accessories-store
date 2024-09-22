const jwt = require('jsonwebtoken');
const userModel = require('../Models/User-model');
require('dotenv').config();

module.exports = async (req, res, next) => {
    if (!req.cookies.token) {
        req.flash('error', 'You need to login first');
        return res.status(401).redirect('/login'); // Redirect to login page
    }

    try {
        const decoded = jwt.verify(req.cookies.token, process.env.JWT_KEY);
        const userDB = await userModel.findOne({ _id: decoded.id });
        if (!userDB) {
            req.flash('error', 'Invalid user');
            return res.status(401).redirect('/login'); // Redirect to login page
        }
        req.user = userDB;
        next();
    } catch (err) {
        req.flash('error', 'Invalid or expired token');
        res.status(401).redirect('/login'); // Redirect to login page
    }
};
