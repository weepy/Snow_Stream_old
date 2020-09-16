// const express = require('express')
// const app = express()

const WebSocket = require('ws')


// app.get('*', function(req, res, next) {
//   res.sendFile(ROOT+'/public/index.html')
// })

// app.use('/', express.static(__dirname + '/public'))

// app.listen(8080, () => {
//   console.log(`Listening at http://:${port}`)
// })


const wss = new WebSocket.Server({ port: 9090 })

const channels = {

}


const Messages = {
    ECHO: 0,
    PUBLISH: 1,
    AUDIO_DATA: 1,
    SUBSCRIBE: 2,
    
}

function get16(data, offset) {
  return data[offset*2] + data[offset*2+1]*256
}


wss.on('connection', function connection(ws) {
    console.log("connect")


    
    // ECHO
    ws.on('message', function incoming(data) {
      
      
      // const data = new Uint16Array(data8.buffer, data8.byteOffset, data8.byteLength / Uint16Array.BYTES_PER_ELEMENT);
      

      const message = get16(data, 0)
      const channel_id = get16(data, 1)
      const packet_id = get16(data, 2)
      const delay = get16(data, 3)

      console.log(message, channel_id, packet_id, delay)
      


      if(message == Messages.PUBLISH) {
      
          
          
          if(delay != 0) {
            setTimeout(() => {
              broadcastToChannel(channel_id, data)
            }, delay)
          }
          else {
              broadcastToChannel(channel_id, data)
          }
          

          // if(get16(data, 3)) {
          //   ws.send(data) // send it back!
          // }
          
        }
        else if(message == Messages.SUBSCRIBE) {
          const channel = channels[channel_id] = channels[channel_id] || { id: channel_id, listeners: [], queue: []}
          const yes = get16(data, 2)

          // remove either way
          channel.listeners = channel.listeners.filter(c => c != ws)

          if(yes) {
            channel.listeners.push(ws)
          }
          else {
            /// 
          }
          ws.send(data) // IE ok
        }
       
        else if(message == Messages.ECHO) {
          // console.log("ECHO!")
          ws.send(data)
        }
        else {
          console.log("unknown message type", data[0], data[1], data[2], data[3])
        }


    })
})


// setInterval(() => {


//   for(let i in channels) {
//     broadcastAudio(channels[i])
//   }
// }, 16)

function broadcastToChannel(channel_id, data) {
  const toremove = []
  const channel = channels[channel_id] || { id: channel_id, listeners: [], queue: []}

  if(!channel) {
    console.log("cannot broadcast - no such listening channel ", channel_id)
    return
  }

  channel.listeners.forEach((client, index) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data)
      // console.log("index", index)
    }
    else {
      toremove.push(client)
    }
  })

  if(toremove.length) {
    console.log("removing", toremove.length, "clients from channel #",channel_id)
    channel.listeners = channel.listeners.filter(c => toremove.indexOf(c) < 0)
  }
}

// function broadcastAudio(channel) {
  

//     const queue = channel.queue
//     let toremove = []
    
//     if(queue.length) {
      
//       channel.listeners.forEach(client => {
//         if (client.readyState !== WebSocket.OPEN) {
//           toremove.push(client)
//         }
//         else
//           for(let i=0; i<queue.length;i++) {
//             client.send(queue[i])
//           }
//           console.log("sending", channel.id)
//         }
//         else {
//           filter = true
//         }
//       })

//       queue.length = 0

//       if(filter) {
//         channel.listeners = channel.listeners.filter(c => c.readyState === WebSocket.OPEN)
//       }
//     }

//   }