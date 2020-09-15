<script>
import AudioInputSelector from "../components/AudioInputSelector.svelte"
import { fillBufferWithSine, fillBufferWithClick, captureAudio, uuid } from '../lib/utils.js'
import Packet from '../api/Packet.js'
import Messages from '../api/Messages.js'
import AudioPlayer from '../api/AudioPlayer.js'
import Sock from "../api/Sock.js"


let recording = false
let recordingContext
let latency= ""

/// LOAD CONFIG

const sessionId = document.location.search.slice(1)

if(sessionId == "") {
    document.location.href="/?"+uuid(16)
}

const config = {
    playbackDelayMs: 100,
    publishChannel: 123,
    subscribeChannel: 124,
    fillBuffer: "input",
    fakeDelayMs: 0,
    chunkSize: 4096,
    playReceivedAudio: true,
    ...JSON.parse(localStorage.getItem("config_"+sessionId)||"{}")
}

setInterval(() => {
    localStorage["config_"+sessionId] = JSON.stringify(config)
}, 1000)

//////////


let capturePacketId = -1
let receivedPacketId = 0
let deltaPacketNum = 0
let audioPlayer
let subscribed

let sock = new Sock("ws://" + document.location.hostname + ":9090")

let remotePacketQueue = []

sock.onaudiodata = (data) => {
    // console.log("audiodata", data.length)

    const packet = Packet.fromBuffer(data)

    const buf = packet.createAudioBuffer()
	
	if(data[2] != receivedPacketId +1) {
		console.log("received packet out of sync", receivedPacketId, data[2])
	}

    receivedPacketId = packet.data[2]
    
    if(config.playReceivedAudio) {
        audioPlayer.playAudioBuffer(buf, config.playbackDelayMs)
    }
    

    if(config.fillBuffer == "remote") {
        remotePacketQueue.push(packet)
    }

//    latency = Math.floor((recordingContext.currentTime -  audioPlayer.currentTime())*1000)

	deltaPacketNum = receivedPacketId - capturePacketId
}

sock.onsubscribe = (data) => {
    const channel = data[1]
    const yesno = data[2]
    console.log(yesno ? "subcribed":"unsubscribed", "to channel", channel)
}


function stopRecording() {
	
	recordingContext.close()
	// audioPlayer.close()
	// unsubscribe()

	recording = false
	latency=""
}

function startRecording() {
	recordingContext = new AudioContext({latencyHint:"playback"})
	
    let sendPacketId = 0
    
	captureAudio(recordingContext, {deviceId: localStorage.audioInputDeviceId, chunkSize: config.chunkSize}, (audioBuffer) => {

        if(config.fillBuffer == "remote") {

            while(remotePacketQueue.length) {
                const packet = remotePacketQueue.shift()
                
                packet.data[1] = config.publishChannel
                //packet.data[2] = sendPacketId
                packet.data[3] = config.fakeDelayMs

                capturePacketId = sendPacketId
                sendPacketId++
                // const packet = new Packet([Messages.AUDIO_DATA, publishChannel, capturePacketId, fakeDelayMs, receivedPacketId], audioBuffer)
                sock.emit(packet)
            }

            return 
        }


		if(config.fillBuffer == "sine") {
			fillBufferWithSine(audioBuffer)
        }
        else if(config.fillBuffer == "click") {
            fillBufferWithClick(audioBuffer)
        }
        
        capturePacketId = sendPacketId
        sendPacketId++
		
		const packet = new Packet([Messages.AUDIO_DATA, config.publishChannel, capturePacketId, config.fakeDelayMs, receivedPacketId], audioBuffer)
		
        sock.emit(packet)
        

	})

	recording = true
}



function subscribe() {
    const packet = new Packet([Messages.SUBSCRIBE, config.subscribeChannel, 1])
    sock.emit(packet)
    audioPlayer = new AudioPlayer()
	subscribed = true
}

function unsubscribe() {
    const packet = new Packet([Messages.SUBSCRIBE, config.subscribeChannel, 0])
    sock.emit(packet)
    audioPlayer.close()
	subscribed = false
}


</script>

<div class="App">
	<h1>SnowStream</h1>


    <h2>Publish Audio</h2>    
    <p>
        <label>Publish Channel Id</label>
        <input type="number" bind:value={config.publishChannel} />
    </p>

    <p>
    <label>Fill Buffer</label>
    <select bind:value={config.fillBuffer} >
    <option value="input">audio device</option>
    <option value="sine">sine wave</option>
    <option value="click">1s click</option>
    <option value="remote">subcribed audio</option>
    </select>
    </p>

    <p>
    <label>Fake Delay (ms)</label>
    <input type="number" bind:value={config.fakeDelayMs} />
    </p>
    
    <p>
        <label>Audio device</label>
        <AudioInputSelector />
    </p>
    <p>
        <label>Chunk Size</label>
        <input type="number" bind:value={config.chunkSize} />
    </p>
    
    <p>

    

	{#if recording } 
		<button on:click={stopRecording}>Stop</button>
	{:else} 
        
		<button on:click={startRecording}>Publish Audio</button>
	{/if }
    </p>

    <hr/>


    <h2>Subscribe Audio</h2>
    <p>
    <label>Subscribe Channel Id</label><input type="number" bind:value={config.subscribeChannel} />
    </p>
    

    <p>
    <label>Play Received Audio</label>
    <input type="checkbox" bind:checked={config.playReceivedAudio} />
    </p>

	<p><label>
        Delta chunks
    </label>
    <span>
        {deltaPacketNum} 
    </span></p>


    <p>
    <label>Playback Delay (ms)</label>
    <input type="number" bind:value={config.playbackDelayMs} />
    </p>


    <p>
	{#if subscribed } 
		<button on:click={unsubscribe}>Unsubscribe</button>
	{:else} 
        <p><button on:click={subscribe}>Subscribe</button></p>
	{/if }
    </p>

    
</div>

<style>
label {
    width: 200px;
    display: inline-block;
}



input[type="number"] {
    width: 100px
}

select {
    width: 100px;
}
</style>