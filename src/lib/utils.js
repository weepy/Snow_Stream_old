
export function captureAudio(recordingContext, {deviceId, chunkSize}, chunkCallback) {
    const constraints = { 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          deviceId: {exact: deviceId}
      }
    } 

    
    navigator.mediaDevices.getUserMedia(constraints).then(stream => {
  
      const source = recordingContext.createMediaStreamSource(stream)
      const processor = recordingContext.createScriptProcessor(chunkSize, 2,2)
        
      source.connect(processor)
      processor.connect(recordingContext.destination)
      processor.onaudioprocess = function(e) {
        chunkCallback(e.inputBuffer)
        
      }
    })
  }
  

export function f_to_ui16(f) {
  return ((f + 1) * 32767)|0
}

let sentSamples = 0

export function fillBufferWithSine(buffer) {
  const chunkSize = buffer.length
  const ch = [ buffer.getChannelData(0), buffer.getChannelData(1)]
  for(let i=0; i<chunkSize;i++) {
    ch[0][i] = Math.sin((sentSamples+i)/50)
    ch[1][i] = Math.cos((sentSamples+i)/50)
  }

  sentSamples += chunkSize
}

export function fillBufferWithClick(buffer) {
  const chunkSize = buffer.length
  const ch = [ buffer.getChannelData(0), buffer.getChannelData(1)]
  // const time = sentSamples/44100

  for(let i=0; i<chunkSize;i++) {
    let env = ((sentSamples+i)/44100) % 1
    env = Math.pow(1-env, 20)

    ch[0][i] = Math.sin((sentSamples+i)/50) * env
    ch[1][i] = Math.cos((sentSamples+i)/50) * env
  }

  sentSamples += chunkSize
}

export function uuid(N) {
	const s = []
	const chars = "abcdefghijklmnopqurstuvwxyz0123456789"
    for(var i =0; i<N;i++) {
        s[i] = chars[Math.floor(Math.random()*chars.length)]
    }
    return s.join("")
}