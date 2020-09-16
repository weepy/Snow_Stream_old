export default function AudioPlayer(audioContext) {
  
  // let totalSamples
  audioContext = audioContext || new AudioContext({latencyHint:"playback"})
  let syncPoint
  

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

  function play2(audioBuffer) {
    const sample = audioContext.createBufferSource()
    sample.buffer = audioBuffer
    sample.connect(audioContext.destination)

    sample.start(audioContext.currentTime + 1)// in sec
  }
  return {
    play,
    play2,
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
