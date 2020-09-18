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


export default function AudioPlayer(audioContext, chunkSize) {
  
  // let totalSamples
  
  let syncPoint
  
  let processor = audioContext.createScriptProcessor(chunkSize, 2,2)


  // let audioDataQueue = []

  // processor.connect(audioContext.destination)

  // processor.onaudioprocess = function(e) {
  //   const inputData = [e.inputBuffer.getChannelData(0), e.inputBuffer.getChannelData(1)]
  //   const outputData = [e.outputBuffer.getChannelData(0), e.outputBuffer.getChannelData(1)]
    
  //   for(let i=0; i<chunkSize;i++) {
  //     const l = inputData[0][i]
  //     const r = inputData[1][i]
  //     outputData[0][i] = l
  //     outputData[1][i] = r

     

  //   }

  //   audioDataQueue.push(inputData)

  //   //console.log("rms", rmsArray(inputData[0]) + rmsArray(inputData[1]) )
  // }

  function synchronize(offsetSamples) {
    syncPoint = audioContext.currentTime - offsetSamples/44100
  }

  function play(audioBuffer, offsetSamples, delaySamples) {
    
    if(syncPoint == null) {
      synchronize(offsetSamples)
    }

    const sample = audioContext.createBufferSource()
    sample.buffer = audioBuffer
    sample.connect(audioContext.destination)

    const startAt = syncPoint + (offsetSamples+delaySamples)/44100
    sample.start(startAt)    
  }
  
  return {
    play,
    // audioDataQueue,
    synchronize,
    audioContext,
    syncPoint() {
      return syncPoint
    }
    // currentTime() {
    //   return audioContext.currentTime - playStartedAt
    // },
    // syncPoint() {
    //   playStartedAt = null
    // },
    // close: () => {
    //   playingContext.close()
    // }
  }
}
