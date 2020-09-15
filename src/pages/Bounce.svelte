<script>
import AudioInputSelector from "../components/AudioInputSelector.svelte"
import { fillBufferWithSine, fillBufferWithClick, captureAudio } from '../lib/utils.js'
import Packet from '../api/Packet.js'
// import { playAudioBuffer } from './api/AudioPlayer.js'
import Messages from '../api/Messages.js'
import AudioPlayer from '../api/AudioPlayer.js'
import Sock from "../api/Sock.js"


let recording = false
let recordingContext
let latency= ""

// let fillSine = true

let sentPacketNum = -1
let receivedPacketNum
let deltaPacketNum = 0
let audioPlayer
let subscribed

let sock = new Sock("ws://localhost:9090")


sock.onaudiodata = (data) => {
    // console.log("audiodata", data.length)

    const buf = Packet.createAudioBuffer(data)
	
	if(data[2] != receivedPacketNum +1) {
		console.log("received packet out of sync", receivedPacketNum, data[2])
	}

	receivedPacketNum = data[2]
    audioPlayer.playAudioBuffer(buf)

    latency = Math.floor((recordingContext.currentTime -  audioPlayer.currentTime())*1000)

	deltaPacketNum = receivedPacketNum - sentPacketNum
}

sock.onsubscribe = (data) => {
    const channel = data[1]
    const yesno = data[2]
    // console.log(yesno ? "subcribed":"unsubscribed", "to channel", channel)
}


function stopRecording() {
	
	recordingContext.close()
	audioPlayer.close()
	// unsubscribe()

	recording = false
	latency=""
}

function startRecording() {
	recordingContext = new AudioContext({latencyHint:"playback"})
	audioPlayer = new AudioPlayer()
	// subscribe()
	captureAudio(recordingContext, {deviceId: localStorage.audioInputDeviceId, chunkSize:4096}, (audioBuffer, packetNum) => {

		if(localStorage.fillSine == "true") {
			fillBufferWithClick(audioBuffer)
		}
		

		sentPacketNum  = packetNum
		const delayMs = 300
		const packet = new Packet([Messages.AUDIO_DATA, 123, packetNum, delayMs], audioBuffer)

        sock.emit(packet)
        

	})

	recording = true
}

function subscribe() {
    const packet = new Packet([Messages.SUBSCRIBE, 123, 1])
	sock.emit(packet)
	subscribed = true
}

function unsubscribe() {
    const packet = new Packet([Messages.SUBSCRIBE, 123, 0])
	sock.emit(packet)
	subscribed = false
}


</script>

<style>
	
</style>

<div class="App">
	<h1>SnowStream</h1>

    <p>Records a local stream, sends it to a server, receives it back and plays it</p>
	<p>Set localStorage.fillSine=true to replace recording with sine</p>

	{#if recording } 
		<button on:click={stopRecording}>stopRecording</button>
	{:else} 
		<button on:click={startRecording}>startRecording</button>
	{/if }
	
<!--     
	{#if subscribed } 
		<button on:click={unsubscribe}>Stop</button>
	{:else} 
		<button on:click={subscribe}>Play</button>
	{/if }
	 -->
	
	<AudioInputSelector />

	<p>{latency} : {deltaPacketNum} </p>
</div>
