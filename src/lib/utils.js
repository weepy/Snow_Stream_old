
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
  
export  function cloneAudioBuffer(buf) {
    const audioBuffer = new AudioBuffer({ sampleRate: buf.sampleRate, length: buf.length, numberOfChannels: buf.numberOfChannels})

    audioBuffer.copyFromChannel(buf.getChannelData(0), 0, 0)
    audioBuffer.copyFromChannel(buf.getChannelData(0), 1, 0)

    return audioBuffer
} 


export function f_to_ui16(f) {
  return ((f + 1) * 32767)|0
}


export function fillBufferWithSine(buffer, offset) {
  const chunkSize = buffer.length
  const ch = [ buffer.getChannelData(0), buffer.getChannelData(1)]
  for(let i=0; i<chunkSize;i++) {
    ch[0][i] = Math.sin((offset+i)/50)
    ch[1][i] = Math.cos((offset+i)/50)
  }

  // sentSamples += chunkSize
  return offset + chunkSize
}

export function fillBufferWithSine2(buffer, offset) {
  const chunkSize = buffer.length
  const ch = [ buffer.getChannelData(0), buffer.getChannelData(1)]
  for(let i=0; i<chunkSize;i++) {
    const t = offset+i
    ch[0][i] = ((t+Math.sin(t))/15080) % 1// * (2+ Math.sin(t/10000)*0.01))*0.01%1
    ch[1][i] = ch[0][i]
  }

  // sentSamples += chunkSize
  return offset + chunkSize
}

export function fillBufferWithClick(buffer, offset) {
  const chunkSize = buffer.length
  const ch = [ buffer.getChannelData(0), buffer.getChannelData(1)]
  // const time = sentSamples/44100

  for(let i=0; i<chunkSize;i++) {
    const second = Math.floor((offset+i)/44100)

    let env = ((offset+i)/44100)%1
    env = Math.pow(1-env, 20)

    ch[0][i] = Math.cos((offset+i)/50) * env
    ch[1][i] = Math.cos((offset+i)/50) * env
  }

  return offset + chunkSize
  // sentSamples += chunkSize
}

export function uuid(N) {
	const s = []
	const chars = "abcdefghijklmnopqurstuvwxyz0123456789"
    for(var i =0; i<N;i++) {
        s[i] = chars[Math.floor(Math.random()*chars.length)]
    }
    return s.join("")
}

export function rmsBuffer(buffer, stride=1) {
  let denom = 0
  let sum = 0
  for(let ch=0; ch < buffer.numberOfChannels;ch++) {
      const data = buffer.getChannelData(ch)
      
      for(let i=0; i<data.length;i+=stride) {
          denom+=1
          let x = data[i]
          sum += x*x
      }
      
  }

  return Math.sqrt(sum/denom)
}

export function setStereoGain(buffer, gains) {
  
  for(let ch=0; ch < 2;ch++) {
      const data = buffer.getChannelData(ch)
      const gain = gains[ch]
      if(gain == 1) 
        continue
      for(let i=0; i<data.length;i+=1) {
          
          data[i]*=gain
      }
      
  }

  
}