<script>
import AudioInputSelector from "../components/AudioInputSelector.svelte"
import { fillBufferWithSine, captureAudio } from '../lib/utils.js'
import Packet from '../api/Packet.js'
// import { playAudioBuffer } from './api/AudioPlayer.js'
import Messages from '../api/Messages.js'
import AudioPlayer from '../api/AudioPlayer.js'


let recording = false
let recordingContext
let latency= ""

// let fillSine = true

let audioPlayer
function stopRecording() {
	
	recordingContext.close()
	audioPlayer.close()

	recording = false
	latency=""
}

function startRecording() {
	recordingContext = new AudioContext({latencyHint:"playback"})
	audioPlayer = new AudioPlayer()

	captureAudio(recordingContext, {deviceId: localStorage.audioInputDeviceId, chunkSize:4096}, (audioBuffer, packetNum) => {

		if(localStorage.fillSine == "true") {
            fillBufferWithSine(audioBuffer)
        }

		const packet = new Packet([Messages.AUDIO_DATA, 123, packetNum], audioBuffer)
		
		const buf = packet.createAudioBuffer()
		
		audioPlayer.playAudioBuffer(buf)

		latency = Math.floor((recordingContext.currentTime -  audioPlayer.currentTime())*1000)

	})

	recording = true
}



</script>

<style>
	
</style>

<div class="App">
	<h1>SnowStream</h1>

    <p>Records a local stream, and plays it back</p>
	<p>Set localStorage.fillSine=true to replace recording with sine</p>

	{#if recording } 
		<button on:click={stopRecording}>stopRecording</button>
	{:else} 
		<button on:click={startRecording}>startRecording</button>
	{/if }
	
    
	
	<AudioInputSelector />

	<p>{latency}</p>
</div>
