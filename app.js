// require the dependencies we installed
var app = require('express')();
var axios = require('axios');
var redis = require('redis');
var bodyParser = require('body-parser');
var config = require('./env.json')

// create a new redis client and connect to our local redis instance
var client = redis.createClient();
var forecastKey = config.forecastKey;

// if an error occurs, print it to the console
client.on('error', function (err) {
    console.log("Error " + err);
});

app.set('port', (process.env.PORT || 5000));
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

function getDataByCityLatLng(lat, lng) {
  var forecastEndPoint = 'https://api.darksky.net/forecast/'+forecastKey+'/'+lat+','+lng;
  return axios.get(forecastEndPoint);
}

app.post('/api/cityLatLng', function(req, res) { 
	var cityKey = req.body.cityKey;
	var latitude = req.body.lat;
	var longitude = req.body.lng;

	client.exists('cityKey', function(err, reply) {
		if(!err) {
			if(reply === 1) {
				console.log(cityKey+" exists on redis");
			} else {
			 	client.hmset(cityKey, {
				    'latitude': latitude,
				    'longitude': longitude
				});
				res.send(cityKey+ 'saved!');
			}
		}else {
			res.send(err);
		}	
	});
});

app.get('/api/getDataByCityLatLng', function(req, res) {
  var cityKey = req.query.city_key;

  client.hgetall(cityKey, function (err, obj) {
  	if (obj) {
  		getDataByCityLatLng(obj.latitude, obj.longitude)
	  	.then(
	  		function success(response) {
	  			var jsonResponse = {
	  				"time": response.data.currently.time,
	  				"temperature": response.data.currently.temperature
	  			};
	  			res.send(jsonResponse);
	  		}, 
	  		function error(error) {
	  		res.send(error);
	  	});
  	}
	});
  
});

app.listen(app.get('port'), function(){
  console.log('Server listening on port: ', app.get('port'));
});