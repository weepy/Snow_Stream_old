
export function captureAudio(recordingContext, {deviceId, chunkSize, noiseSuppression=false}, chunkCallback) {
    const constraints = { 
        audio: {
          echoCancellation: false,
          noiseSuppression,
          autoGainControl: false,
          // latency: 0,
          deviceId: {exact: deviceId}
      }
    } 

    let source
    let processor
    
    navigator.mediaDevices.getUserMedia(constraints).then(stream => {
      console.log(stream)
      source = recordingContext.createMediaStreamSource(stream)
      processor = recordingContext.createScriptProcessor(chunkSize, 2,2)
        
      source.connect(processor)
      processor.connect(recordingContext.destination)
      processor.onaudioprocess = function(e) {
        let chunk = [
          e.inputBuffer.getChannelData(0).slice(),
          e.inputBuffer.getChannelData(1).slice()
        ]

        chunkCallback(chunk)
        
      }
    })

    return () => {
      source.disconnect()
      processor.disconnect()

    }
  }
  
export  function cloneAudioBuffer(buf) {
    const audioBuffer = new AudioBuffer({ 
        sampleRate: buf.sampleRate, 
        length: buf.length, 
        numberOfChannels: buf.numberOfChannels})

    audioBuffer.copyToChannel(buf.getChannelData(0), 0, 0)
    audioBuffer.copyToChannel(buf.getChannelData(1), 1, 0)

    return audioBuffer
} 


export function f_to_ui16(f) {
  return ((f + 1) * 32767)|0
}


export function fillBufferWithSine(ch, offset) {
  

  const chunkSize = ch[0].length
  for(let i=0; i<chunkSize;i++) {
    ch[0][i] = Math.sin((offset+i)/50)
    ch[1][i] = Math.cos((offset+i)/50)
  }


}

export function fillBufferWithSine2(ch, offset) {
  const chunkSize = ch[0].length
  for(let i=0; i<chunkSize;i++) {
    const t = offset+i
    ch[0][i] = ((t+Math.sin(t))/15080) % 1// * (2+ Math.sin(t/10000)*0.01))*0.01%1
    ch[1][i] = ch[0][i]
  }

}

export function fillBufferWithClick(ch, offset) {
  const chunkSize = ch[0].length
 
  // const time = sentSamples/44100

  for(let i=0; i<chunkSize;i++) {

    let env = ((offset+i)/44100)%1
    env = Math.pow(1-env, 20)
    const pos = [0,4,7,10][Math.floor((((offset+i)/44100))%4)]
    const f = Math.pow(2, pos/12)/50
    ch[0][i] = Math.cos((offset+i)*f) * env
    ch[1][i] = ch[0][i]
  }

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

export function rmsArray(arr, stride=1) {
  let denom = 0
  let sum = 0

  for(let i=0; i<arr.length;i+=stride) {
      denom+=1
      let x = arr[i]
      sum += x*x
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


export function getTimestamp(uint16array, TIMESTAMP_OFFSET=0) {
    
  const bytes = uint16array.slice(TIMESTAMP_OFFSET, TIMESTAMP_OFFSET+4).buffer
  const floatarray = new Float64Array(bytes)
  return floatarray[0]
}

export function setTimestamp(uint16array, val, TIMESTAMP_OFFSET=0) {
  const floatarray = Float64Array.from([val])
  const arr = new Uint16Array(floatarray.buffer)
  for(let i=0; i<4;i++) {
      uint16array[i+TIMESTAMP_OFFSET] = arr[i]
  }
}