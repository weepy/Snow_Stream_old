<script>
import AudioInputSelector from "../components/AudioInputSelector.svelte"
import { fillBufferWithSine, fillBufferWithSine2, fillBufferWithClick, captureAudio, uuid, rmsBuffer,setStereoGain } from '../lib/utils.js'
import Packet from '../api/Packet.js'
import Messages from '../api/Messages.js'
import AudioPlayer from '../api/AudioPlayer.js'
import Sock from "../api/Sock.js"


let recording = false

const config = {
    fillBuffer: "sine"
}

const chunkSize = 4096
const sampleRate = 44100

$: console.log(config.fillBuffer )


let recordingContext = new AudioContext({latencyHint:"playback"})

let audioPlayer = new AudioPlayer(recordingContext)

const delay = 2


function cloneAudioBuffer(buf) {
    const audioBuffer = new AudioBuffer({ sampleRate: buf.sampleRate, length: buf.length, numberOfChannels: buf.numberOfChannels})

    audioBuffer.copyFromChannel(buf.getChannelData(0), 0, 0)
    audioBuffer.copyFromChannel(buf.getChannelData(0), 1, 0)

    return audioBuffer
} 

function play() {
	
	
    let sendPacketId = 0
    let offsetSamples = 0
    
	captureAudio(recordingContext, {
            deviceId: localStorage.audioInputDeviceId, chunkSize}, (_audioBuffer) => {

        const audioBuffer = cloneAudioBuffer(_audioBuffer) //new AudioBuffer({ sampleRate: 44100, length: chunkSize, numberOfChannels: 2})

		if(config.fillBuffer == "sine") {
			fillBufferWithSine(audioBuffer, offsetSamples)
        }
        if(config.fillBuffer == "sine2") {
			fillBufferWithSine2(audioBuffer, offsetSamples)
        }
        else if(config.fillBuffer == "click") {
            fillBufferWithClick(audioBuffer, offsetSamples)
        }
       

        audioPlayer.play(audioBuffer, offsetSamples, sampleRate*delay)


        offsetSamples+=chunkSize
        sendPacketId++

    })

	
}

function play2() {
     const context = new AudioContext({latencyHint:"playback"})
    let offsetSamples = 0

     setInterval(() => {
    
        const audioBuffer = new AudioBuffer({ sampleRate: 44100, length: chunkSize, numberOfChannels: 2})
        
        if(config.fillBuffer == "sine") {
			fillBufferWithSine(audioBuffer, offsetSamples)
        }
        if(config.fillBuffer == "sine2") {
			fillBufferWithSine2(audioBuffer, offsetSamples)
        }
        else if(config.fillBuffer == "click") {
            fillBufferWithClick(audioBuffer, offsetSamples)
        }
        
        
        audioPlayer.play(audioBuffer, offsetSamples,  sampleRate*delay)
    
        offsetSamples+= chunkSize
        
    }, chunkSize/sampleRate*1000)
        
}



</script>

<div class="App">
	<h1>SnowStream</h1>

<p>
    <label>Fill Buffer</label>
    <select bind:value={config.fillBuffer} >
    <option value="input">audio device</option>
    <option value="sine">sine wave</option>
    <option value="sine2">sine wave 2</option>
    <option value="click">1s click</option>
    <option value="remote">subcribed audio</option>
    </select>
    </p>

  
    <p>
	<button on:click={play}>Play</button>
    <button on:click={play2}>Play #2</button>
    </p>



    
</div>
