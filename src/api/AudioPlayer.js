export default function AudioPlayer() {
  

  let playStartedAt 

  let totalSamples
  let playingContext = new AudioContext()

  // let LATENCY = 0.1

  function playAudioBuffer(audioBuffer, playbackDelayMs) {

    if(!playStartedAt) {
        playStartedAt = playingContext.currentTime 
        totalSamples = 0
    }

    // const ch = e.data
    const chunkLength = audioBuffer.length

  //   const audioBuffer = playingContext.createBuffer(2, chunkLength, 44100)
  //   audioBuffer.getChannelData(0).set(ch[0])
  //   audioBuffer.getChannelData(1).set(ch[1])

    const sample = playingContext.createBufferSource()
    sample.buffer = audioBuffer
    sample.connect(playingContext.destination)

    const startAt = playStartedAt + playbackDelayMs/1000 + totalSamples/44100;

    // if (playingContext.currentTime >= startAt) {        
    //     skip ++
    //     if(Date.now()%100 == 0)
    //           console.log("skip", playingContext.currentTime - startAt)
    // }

    
    totalSamples += chunkLength

    sample.start(startAt)

    return playingContext.currentTime
  }

  return {
    playAudioBuffer,
    playingContext,
    currentTime() {
      return playingContext.currentTime - playStartedAt
    },
    close: () => {
      playingContext.close()
    }
  }
}
