'use strict';
const NodeHelper = require('node_helper');
const { spawn, exec } = require('child_process');

var cAppStarted = false

module.exports = NodeHelper.create({

	cApp_start: function () {
		const self = this;
		self.gestureDet = spawn('modules/' + this.name + '/gesture_detection/build/gesture_detection',['modules/' + this.name + '/gesture_detection/build', self.config.image_width, self.config.image_height]);
		self.gestureDet.stdout.on('data', (data) => {
			
			var data_chunks = `${data}`.split('\n');
			data_chunks.forEach( chunk => {

				if (chunk.length > 0) {
	
				try{
					var parsed_message = JSON.parse(chunk)

					if (parsed_message.hasOwnProperty('DETECTED_GESTURES')){
						//console.log("[" + self.name + "] Gestures detected : " + parsed_message);
						self.sendSocketNotification('DETECTED_GESTURES', parsed_message);
					}else if (parsed_message.hasOwnProperty('GESTURE_DET_FPS')){
						console.log("[" + self.name + "] " + JSON.stringify(parsed_message));
						self.sendSocketNotification('GESTURE_DET_FPS', parsed_message.GESTURE_DET_FPS);
					}else if (parsed_message.hasOwnProperty('STATUS')){
						console.log("[" + self.name + "] status received: " + JSON.stringify(parsed_message));
					}
				}
				catch(err) {	
					//console.log(err)
				}
  				//console.log(chunk);
				}
			});
		});	



		exec(`renice -n 20 -p ${self.gestureDet.pid}`,(error,stdout,stderr) => {
				if (error) {
					console.error(`exec error: ${error}`);
  				}
			});

  	},

  	// Subclass socketNotificationReceived received.
  	socketNotificationReceived: function(notification, payload) {
		const self = this;	
		if(notification === 'GestureDetection_SetFPS') {
			if(cAppStarted) {
       				self.gestureDet.stdin.write(payload.toString() + "\n");
				console.log("[" + self.name + "] changing to: " + payload.toString() + " FPS");
         		}
       	 	}else if(notification === 'GESTURE_DETECITON_CONFIG') {
      			self.config = payload
      			if(!cAppStarted) {
        			cAppStarted = true;
        			this.cApp_start();
      			};
    		};
  	},

	stop: function() {
		const self = this;	
		
	}
});
