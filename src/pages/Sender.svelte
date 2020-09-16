<script>
import AudioInputSelector from "../components/AudioInputSelector.svelte"
import { fillBufferWithSine, fillBufferWithSine2, fillBufferWithClick, captureAudio, uuid, rmsBuffer,setStereoGain, cloneAudioBuffer } from '../lib/utils.js'
import Packet from '../api/Packet.js'
import Messages from '../api/Messages.js'
import AudioPlayer from '../api/AudioPlayer.js'
import Sock from "../api/Sock.js"


let recording = false
let recordingContext
let playbackContext
let latency= ""
let startedAt = null

/// LOAD CONFIG

const sessionId = document.location.search.slice(1)

if(sessionId == "") {
    document.location.href="/?"+uuid(16)
}


const config = {
    capturePlaybackDelayMs: 1000,
    receivedPlaybackDelayMs: 1000,
    // delayCapturedPlayback:
    publishChannel: 123,
    subscribeChannel: 124,
    fillBuffer: "input",
    fakeDelayMs: 0,
    chunkSize: 4096,
    playReceivedAudio: true,
    playCapturedAudio: false,
    serverUrl: "ws://localhost:9090",
    ...JSON.parse(localStorage.getItem("config_"+sessionId)||"{}")
}

$: console.log(config.fillBuffer )

setInterval(() => {
    localStorage["config_"+sessionId] = JSON.stringify(config)
}, 1000)

//////////


let capturePacketId = -1
let receivedPacketId = 0
let deltaPacketNum = 0
let audioPlayer = new AudioPlayer()
let subscribed 

let sock = new Sock(config.serverUrl)

let remotePacketQueue = []

sock.onaudiodata = (data) => {
    const packet = Packet.fromBuffer(data)

    const audioBuffer = packet.createAudioBuffer()
	
	if(data[2] != receivedPacketId +1) {
		console.log("received packet out of sync", receivedPacketId, data[2])
	}

    receivedPacketId = packet.data[2]

    // console.log("receivedPacketId", receivedPacketId)
    
    if(config.playReceivedAudio) {
        
        // if(startedAt == null) {
        //     playbackContext = new AudioContext({latencyHint: "playback"})
        //     startedAt = playbackContext.currentTime
        // }

        setStereoGain(audioBuffer, [0,1])

        const offsetSamples = receivedPacketId*config.chunkSize
        // const sample = playbackContext.createBufferSource()
        // sample.buffer = audioBuffer
        // sample.connect(playbackContext.destination)

        const delaySamples = config.receivedPlaybackDelayMs*44.1

        audioPlayer.play( audioBuffer, offsetSamples, delaySamples)
        
        // sample.start(startedAt + )// c

        // audioPlayer.playAudioBuffer(audioBuffer, receivedPacketId*config.chunkSize+config.receivedPlaybackDelayMs*44.1)
    }   
    

    if(config.fillBuffer == "remote") {
        remotePacketQueue.push(packet)
    }

//    latency = Math.floor((recordingContext.currentTime -  audioPlayer.currentTime())*1000)

	// deltaPacketNum = 
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
       // audioPlayer.stop()
}

function startRecording() {
	recordingContext = new AudioContext({latencyHint:"playback"})
	
    let sendPacketId = 0
    
    
	captureAudio(recordingContext, {deviceId: localStorage.audioInputDeviceId, chunkSize: config.chunkSize}, (_audioBuffer) => {

        const audioBuffer = cloneAudioBuffer(_audioBuffer)

        if(config.fillBuffer == "remote") {

            while(remotePacketQueue.length) {
                const packet = remotePacketQueue.shift()
                
                packet.data[1] = config.publishChannel
                //packet.data[2] = sendPacketId
                packet.data[3] = config.fakeDelayMs

                capturePacketId = sendPacketId
                sendPacketId++
                
                // console.log("sending packet id (bounce)", packet.data[2])

                // const packet = new Packet([Messages.AUDIO_DATA, publishChannel, capturePacketId, fakeDelayMs, receivedPacketId], audioBuffer)
                sock.emit(packet)
            }

            return 
        }

        const offsetSamples = sendPacketId*config.chunkSize

		if(config.fillBuffer == "sine") {
			fillBufferWithSine(audioBuffer, offsetSamples)
        }
        if(config.fillBuffer == "sine2") {
			fillBufferWithSine2(audioBuffer, offsetSamples)
        }
        else if(config.fillBuffer == "click") {
            fillBufferWithClick(audioBuffer, offsetSamples)
        }
        
       
		
		const packet = new Packet([Messages.AUDIO_DATA, config.publishChannel, capturePacketId, config.fakeDelayMs, receivedPacketId], audioBuffer)
		
       sock.emit(packet)

        if(config.playCapturedAudio) {
            setStereoGain(audioBuffer, [1,0])

            // if(startedAt == null) {
            //     playbackContext = new AudioContext({latencyHint: "playback"})
            //     startedAt = playbackContext.currentTime
            // }

            
            // const sample = playbackContext.createBufferSource()
            // sample.buffer = audioBuffer
            // sample.connect(playbackContext.destination)



            const delaySamples = config.capturePlaybackDelayMs*44.1
            
            audioPlayer.play(audioBuffer, offsetSamples, delaySamples)

          //  console.log(offsetSamples, delaySamples, audioPlayer.syncPoint() )
            // sample.start(startedAt + offsetSamples/44100 + delay)// config.capturePlaybackDelayMs/1000)
            // console.log(startedAt, offsetSamples/44100, delay)
            
            // audioPlayer.playAudioBuffer(audioBuffer, capturePacketId*config.chunkSize, config.capturePlaybackDelayMs*44.1)
        }

         capturePacketId = sendPacketId
        sendPacketId++
        // else {
        //     audioPlayer.stop()
        // }

        // console.log("sending packet id", capturePacketId)

	})

	recording = true
}



function subscribe() {
    const packet = new Packet([Messages.SUBSCRIBE, config.subscribeChannel, 1])
    sock.emit(packet)
    
	subscribed = true
}

function unsubscribe() {
    const packet = new Packet([Messages.SUBSCRIBE, config.subscribeChannel, 0])
    sock.emit(packet)
    // audioPlayer.close()
	subscribed = false
}


</script>

<div class="App">
	<h1>SnowStream</h1>

    

    <p>
        <label>Server Address</label>
        <input type="text" bind:value={config.serverUrl} />
    </p>


    <hr />

    <h2>Publish Audio</h2>    
    <p>
        <label>Publish Channel Id</label>
        <input type="number" bind:value={config.publishChannel} />
    </p>

    <p><label>Last sent packetId: </label>{capturePacketId}</p>

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
    <label>Fake Sending Latency (ms)</label>
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
        <label>Playback Delay (ms)</label>
        <input type="number" bind:value={config.capturePlaybackDelayMs} />
    </p>
    


    
    <p>
    <label>Play Captured Audio</label>
    <input type="checkbox" bind:checked={config.playCapturedAudio} />
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
    
    <p><label>Last received packetId:</label> {receivedPacketId}</p>
    <p>
    <label>Play Received Audio</label>
    <input type="checkbox" bind:checked={config.playReceivedAudio} />
    </p>

	<p><label>
        Delta chunks
    </label>
    <span>
        {receivedPacketId - capturePacketId} 
    </span></p>


    <p>
    <label>Playback Delay (ms)</label>
    <input type="number" bind:value={config.receivedPlaybackDelayMs} />
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