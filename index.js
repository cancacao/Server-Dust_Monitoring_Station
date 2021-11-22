
const express = require('express');
const app = express();
const cors=require("cors");
const server = require('http').createServer(app);
const mqtt = require('mqtt');
const mongoose = require('mongoose');
var dustStation = require('./mongo/model_data');
const mongo = require('./mongo/mongo_index');
const io = require('socket.io')(server, { cors: {origin: '*'}});
////////////////////////
var btnConnect_mqtt = '';
var btnDisconnect_mqtt = false;
var btnSubscribe = false;
var isConnect_mqtt = false;
var objToClient = {};
var urlBroker = 'broker.hivemq.com';
var mqttPort;
var mqttTopic = 'can_test';
var myInterval;
var list_chart_data = [
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
]
var chart_time = [0,0,0,0,0,0,0,0,0,0]
var mqttClient = undefined;
///////////////////////////////////
const corsOptions ={
  origin:'*', 
  credentials:true,            //access-control-allow-credentials:true
  optionSuccessStatus:200,
}

app.use(cors(corsOptions))

io.on('connection', (socket) => {
  console.log('a user connected: ' + socket.id);
  io.sockets.emit("mqttState",isConnect_mqtt.toString())
  socket.on('disconnect', () => {
    console.log('a user disconnected: ' + socket.id)
  })
  socket.on("mqttConnection", (data) => {
    var objMess = JSON.parse(data.toString());
    if (objMess.state === 'true'){
      urlBroker = objMess.broker
      mqttClient  = mqtt.connect('mqtt://' + urlBroker)
      mqttClient.on('connect',() => {
              isConnect_mqtt = true;
              io.sockets.emit("mqttState","true")
              console.log('Connected to MQTT ');
              socket.on("mqttTopic", (data) => {
                  mqttTopic = data;
                  console.log(mqttTopic)
              })
              myInterval = setInterval(function(){
                // connect 
                // simulation data
                  let temp = (Math.random() * (35 - 30) + 30).toFixed(2);
                  let pressure = (Math.random() * (10 - 5) + 5).toFixed(2);
                  let flow = (Math.random() * (200 - 150) + 150).toFixed(2);
                  let pm = (Math.random() * (100 - 80) + 80).toFixed(2);
                  // publish data
                  if (isConnect_mqtt)
                  mqttClient.publish(mqttTopic, '{"temp":"' + temp.toString() + '","pressure":"' + 
                  pressure.toString() + '","flow":"' + flow.toString() + '","pm":"' + pm.toString() +
                   '"}' );
              },10000);
            });
              mqttClient.subscribe(mqttTopic)
      
    }
              mqttClient.on('message', function (topic, message) {
      //       // message is Buffer
                console.log('message received:' + message.toString() + ' from: ' + topic.toString());
                objToClient = JSON.parse(message.toString());
//       //   store data to DB
                let dataToDB = new dustStation(objToClient);
                dataToDB.save();
                console.log("Stored to DB!!");
                list_chart_data.map(data => data.shift());
                list_chart_data = [
                    [...list_chart_data[0],Number(objToClient.pm)],
                    [...list_chart_data[1],Number(objToClient.pressure)],
                    [...list_chart_data[2],Number(objToClient.temp)],
                    [...list_chart_data[3],Number(objToClient.flow)],
                  ]
                chart_time.shift();
                let tmp_time = new Date();
                chart_time = [...chart_time, tmp_time.toLocaleString()]
                objToClient = {...objToClient, state: isConnect_mqtt, list_chart_data: list_chart_data, chart_time: chart_time};
                console.log(objToClient);
                io.sockets.emit('server_to_client', objToClient)

              })
    if (data === 'false'){
          if (isConnect_mqtt){
            mqttClient.unsubscribe(mqttTopic)
            mqttClient.end()
            mqttClient.on('close', () => {
              mqttClient = undefined;
              console.log('Disconnected to MQTT')
            })
          }}
          isConnect_mqtt = false
          io.sockets.emit("mqttState","false")
  })
  
});

// Mongo
/////////////////////////////////
mongo.connect();
//store data to DB



/////////////////////////////////

// MQTT 
////////////////////////////////




// if (mqttClient != undefined) {
//     mqttClient.on('connect',() => {
//     isConnect_mqtt = true;
//     console.log('Connected to MQTT ');
//     io.sockets.emit('mqttState', "true");
//     mqttClient.subscribe(mqttTopic, (err) => {
//       setInterval(function(){
//         // connect 
          
//         // simulation data
//           let temp = (Math.random() * (35 - 30) + 30).toFixed(2);
//           let pressure = (Math.random() * (10 - 5) + 5).toFixed(2);
//           let flow = (Math.random() * (200 - 150) + 150).toFixed(2);
//           let pm = (Math.random() * (100 - 80) + 80).toFixed(2);
//           console.log(`I just publish ${temp} && ${flow} && ${pressure} && ${pm}`);
//           // publish data
//           mqttClient.publish('can_test', '{"temp":"' + temp.toString() + '","pressure":"' + pressure.toString() + '","flow":"' + flow.toString() + '","pm":"' + pm.toString() + '"}' );
//       },30000);
//     });
//     });
//     mqttClient.on('message', function (topic, message) {
//       // message is Buffer
//       console.log('message received:' + message.toString() + ' from: ' + topic.toString());
//       // convert message to obj
//       objToClient = JSON.parse(message.toString());
//       //   store data to DB
//      let dataToDB = new dustStation(objToClient);
//      dataToDB.save();
//      console.log("Stored to DB!!");
//       list_chart_data.map(data => data.shift());
//       list_chart_data = [
//         [...list_chart_data[0],Number(objToClient.pm)],
//         [...list_chart_data[1],Number(objToClient.pressure)],
//         [...list_chart_data[2],Number(objToClient.temp)],
//         [...list_chart_data[3],Number(objToClient.flow)],
//       ]
//       chart_time.shift();
//       let tmp_time = new Date();
//       chart_time = [...chart_time, tmp_time.toLocaleString()]

//       objToClient = {...objToClient, state: isConnect_mqtt, list_chart_data: list_chart_data, chart_time: chart_time};
//       console.log(objToClient);
//       io.sockets.emit('server_to_client', objToClient)

//     })
// }

//////////////////////////

app.get('/apiData', (req, res) => {
  dustStation.find({ 
    time: {
            $gte: new Date(req.query.from),
            $lte: new Date(req.query.to),
        // $gte: new Date(2021, 8, 12, 12, 47, 0, 0), 
        // $lte: new Date(2021, 8, 12, 13, 0 , 0, 0)
    }
}).then(data => {
  res.send(data);
}).catch(err => {
  res.status(500).send({
    message:
          err.message || "Some error occurred."
  })
})
});


server.listen(4000, () => {
  console.log('listening on http://localhost:4000');
});