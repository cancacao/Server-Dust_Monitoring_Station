const mongoose = require('mongoose');

async function connect() {
    try {
        await mongoose.connect('mongodb://localhost:27017/DATN_DUST_STATION', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
           // useCreateIndex: true,
        });
        console.log('Connect Mongo successfully!!!');
    } catch (error) {
        console.log('Connect Mongo failure!!!' + error);
    }
}

module.exports = { connect };