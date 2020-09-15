let recordingContext
const HEADER_SIZE = 16

const Messages = {
  ECHO: 0,
  PUBLISH: 1,
  SUBSCRIBE: 2,
  UNSUBSCRIBE: 3
}


function ui16_to_f(x) {
    return x/32768-1
}

const CHUNKSIZE = 1024*4

function streamTime() {
  return Date.now() % 1000
  // return Math.round(context.currentTime * 1000)
}

// function get16(data, offset) {
//   return data[offset*2] + data[offset*2+1]*256
// }

function f_to_ui16(f) {
  return ((f + 1) * 32767)|0
}




function captureAudio(context, {deviceId}, chunkCallback) {
  const constraints = { 
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        deviceId: {exact: deviceId}
    }
  } 
  let samplesCaptured =0 
  
  navigator.mediaDevices.getUserMedia(constraints).then(stream => {

    const source = recordingContext.createMediaStreamSource(stream)
    const processor = recordingContext.createScriptProcessor(CHUNKSIZE, 2,2)
      
    source.connect(processor)
    processor.connect(recordingContext.destination)
    processor.onaudioprocess = function(e) {
      chunkCallback([
        e.inputBuffer.getChannelData(0),//.slice(),
        e.inputBuffer.getChannelData(1)//.slice()
      ], samplesCaptured)

      samplesCaptured += CHUNKSIZE
    }

    
  })
}

function getDevices() {
  const devices = []
  return navigator.mediaDevices.enumerateDevices().then((_devices) => {
      _devices.forEach(device => {
          if (device.kind == "audioinput") {
              const {label, deviceId, groupId} = device
              devices.push({label, deviceId, groupId})
          }
      })

      return devices
  })
}



const sock = new WebSocket("ws://localhost:9090");
sock.binaryType = "arraybuffer"

let packetCount = 0


sock.onmessage = e => {
  const data = new Uint16Array(e.data)
  const message = data[0]//get16(data, 0)
  const channel_id = data[1]


  if(message == Messages.PUBLISH) {
      const stamp = data[2]
      const delay = streamTime() - stamp // ms
      // const ch = createAudioChunk(data)
      // playAudioChunk(ch)
  }
  
  else if(message == Messages.SUBSCRIBE) {
    const yesno = data[2]
    console.log("subscribed: ", channel_id, yesno)
  }

  else if(message == Messages.ECHO) {
    console.log("ECHO")
  }
}

sock.onopen = () => {
  // RECEIVE FROM SELF!
  console.log("Connected socket")
}


function createAudioChunk(data) {
  const chunkLength =  (data.length-HEADER_SIZE)/2

  const ch = [new Float32Array(chunkLength), new Float32Array(chunkLength)]
  for(let i=0; i<chunkLength;i++) {
    const s0 = ui16_to_f(data[i*2+HEADER_SIZE])
    const s1 = ui16_to_f(data[i*2+1+HEADER_SIZE])
    ch[0][i] = s0 
    ch[1][i] = s1
  }

  return ch
}

let sentSamples = 0

function fillSine(stereoData) {
  const chunkSize = stereoData[0].length

  for(let i=0; i<chunkSize;i++) {
    stereoData[0][i] = Math.sin((sentSamples+i)/50)
    stereoData[1][i] = Math.cos((sentSamples+i)/50)
  }

  sentSamples += chunkSize
}

function createAudioPacket(audioBuffer, channelId, packetCount) {
  const chunkSize = audioBuffer[0].length
  const packet =  new Uint16Array(chunkSize*2+HEADER_SIZE)
  
  packet[0] = Messages.PUBLISH
  packet[1] = channelId
  packet[2] = packetCount // streamTime()
  
  for(let i=0; i<chunkSize;i++) {
    //const sample = (Math.random()-0.5)*32767; 
    const left = audioBuffer[0][i] 
    const right = audioBuffer[1][i]// Math.cos((sentSamples+i)/50)

    packet[i*2 + HEADER_SIZE] = f_to_ui16(left)
    packet[i*2+1 + HEADER_SIZE] = f_to_ui16(right)
  }
  //DATA
  // toSend.set(arr, HEADER_SIZE)
  // const buf8 = new Uint8Array(packet.buffer)
  // // console.log(buf8)
  
  return packet
  
  
}

const LATENCY = 0.1
const audio = document.querySelector("audio")


let playStartedAt 
let skip = 0
let totalSamples=0
let playingContext

let currentLatency

function playAudioChunk(ch) {

  if(!playingContext) {
      playingContext = new AudioContext()
      playStartedAt = playingContext.currentTime 
      totalSamples = 0
  }

  // const ch = e.data
  const chunkLength = ch[0].length

  const audioBuffer = playingContext.createBuffer(2, chunkLength, 44100)
  audioBuffer.getChannelData(0).set(ch[0])
  audioBuffer.getChannelData(1).set(ch[1])

  const sample = playingContext.createBufferSource()
  sample.buffer = audioBuffer
  sample.connect(playingContext.destination)

  const startAt = playStartedAt + LATENCY + totalSamples/44100;

  // if (playingContext.currentTime >= startAt) {        
  //     skip ++
  //     if(Date.now()%100 == 0)
  //           console.log("skip", playingContext.currentTime - startAt)
  // }


  const latency = Math.floor((recordingContext.currentTime -  playingContext.currentTime)*1000)

  if(latency != currentLatency) {
    currentLatency = latency
    console.log("latency", currentLatency)
  }
    
  
  totalSamples += chunkLength

  sample.start(startAt)
}

function subscribe(yesno, channel_id) {
  
  sock.send(new Uint16Array([Messages.SUBSCRIBE, channel_id, yesno?1:0]))

  if(!yesno) {
    playingContext.close()
    playingContext = null
  }
}

