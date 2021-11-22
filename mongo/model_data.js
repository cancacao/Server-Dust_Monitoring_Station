const mongoose = require('mongoose');


const dataSchema = new mongoose.Schema({
    temp: String,
    pressure: String,
    flow: String,
    pm: String,
    time: {type: Date, default: Date.valueOf()},
})

module.exports = mongoose.model('dustStation', dataSchema)