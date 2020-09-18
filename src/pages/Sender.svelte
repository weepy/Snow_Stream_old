<script>
import AudioInputSelector from "../components/AudioInputSelector.svelte"
import { fillBufferWithSine, fillBufferWithSine2, fillBufferWithClick, captureAudio, uuid, rmsBuffer,rmsArray, setStereoGain, cloneAudioBuffer, setTimestamp, getTimestamp } from '../lib/utils.js'
import Packet from '../api/Packet.js'
import Messages from '../api/Messages.js'
import AudioPlayer from '../api/AudioPlayer.js'
import Sock from "../api/Sock.js"


const sampleRate = 44100


let recording = false
let recordingContext
let playbackContext
// let latency= ""
let startedAt = null

/// LOAD CONFIG



let audioContext = new AudioContext({ sampleRate, latencyHint:"playback"})

let audioInputDevices = []

navigator.mediaDevices.enumerateDevices().then((devices) => {
    audioInputDevices = devices.filter((d) => d.kind === 'audioinput')

    config = config
})


const sessionId = document.location.search.slice(1)

if(sessionId == "") {
    document.location.href="/?"+uuid(16)
}


const config = {
    capturePlaybackDelayMs: 1000,
    receivedPlaybackDelayMs: 1000,
    // delayCapturedPlayback:
    audioInputDeviceId: "default",
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

//$: console.log(config.audioInputDeviceId )

setInterval(() => {
    localStorage["config_"+sessionId] = JSON.stringify(config)
}, 1000)

//////////


let capturePacketId = -1
let receivedPacketId = 0
let deltaPacketNum = 0
let audioPlayer = new AudioPlayer(audioContext, config.chunkSize)
let subscribed 

let sock = new Sock(config.serverUrl)

let remotePacketQueue = []
// let audioOutputQueue = []


sock.onaudiodata = (data) => {
    const packet = Packet.fromBuffer(data)

    const audioBuffer = packet.createAudioBuffer(sampleRate)
	
	if(data[2] != receivedPacketId +1) {
		console.log("received packet out of sync", receivedPacketId, data[2])
	}

    receivedPacketId = packet.data[2]

    // console.log("receivedPacketId", receivedPacketId)

    // console.log("packet", rmsArray(audioBuffer.getChannelData(0)))

    
    if(config.playReceivedAudio) {
        
        // if(startedAt == null) {
        //     playbackContext = new AudioContext({latencyHint: "playback"})
        //     startedAt = playbackContext.currentTime
        // }

        setStereoGain(audioBuffer, [0,1])

        const offsetSamples = receivedPacketId*config.chunkSize
        
        let delaySamples = config.receivedPlaybackDelayMs*44.1
        
        


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

let stopCapture
function stopRecording() {
	stopCapture()
	// recordingContext.close()
	
	recording = false
    latency=""
}

function startRecording() {
	// recordingContext = audioPlayer.audioContext //new AudioContext({latencyHint:"playback"})
	
    let sendPacketId = null
    
    
	stopCapture = captureAudio(audioContext, {
        noiseSuppression: false,
        deviceId: config.audioInputDeviceId, chunkSize: config.chunkSize}, (chunk) => {


        if(config.fillBuffer == "remote") {

            while(remotePacketQueue.length) {
                if(sendPacketId == null) {
                    sendPacketId = receivedPacketId
                }
                else {
                    sendPacketId += 1
                }


                const packet = remotePacketQueue.shift()
                packet.data[1] = config.publishChannel
                packet.data[3] = config.fakeDelayMs
                sock.emit(packet)

                capturePacketId = sendPacketId
            }

            return 
        }

        // if(config.fillBuffer == "audioOutput") {
        //     while(audioPlayer.audioDataQueue.length) {
        //         if(sendPacketId == null) {
        //             sendPacketId = receivedPacketId
        //         }
        //         else {
        //             sendPacketId += 1
        //         }


        //         const audioData = audioPlayer.audioDataQueue.shift()

        //         const packet = new Packet([Messages.AUDIO_DATA, 
        //             config.publishChannel, 
        //             capturePacketId, 
        //             config.fakeDelayMs, 
        //             sendPacketId], audioData)

        //         sock.emit(packet)

        //         console.log("audioOutput", rmsArray(audioData[0]))
        //         capturePacketId = sendPacketId
                
        //     }

        //     return 
        // }

        const offsetSamples = sendPacketId*config.chunkSize

		if(config.fillBuffer == "sine") {
			fillBufferWithSine(chunk, offsetSamples)
        }
        if(config.fillBuffer == "sine2") {
			fillBufferWithSine2(chunk, offsetSamples)
        }
        else if(config.fillBuffer == "click") {
            fillBufferWithClick(chunk, offsetSamples)
        }
        
		if(sendPacketId == null) {
            sendPacketId = receivedPacketId
        }
        else {
            sendPacketId += 1
        }

        

        
		const packet = new Packet([Messages.AUDIO_DATA, config.publishChannel, capturePacketId, config.fakeDelayMs, sendPacketId], chunk)
        
        setTimestamp(packet.data, audioContext.currentTime, 5)


       sock.emit(packet)

        if(config.playCapturedAudio) {
            const audioBuffer = new AudioBuffer({sampleRate, length: config.chunkSize, numberOfChannels: 2})
            audioBuffer.copyToChannel(chunk[0], 0, 0)
            audioBuffer.copyToChannel(chunk[1], 1, 0)
            
            setStereoGain(audioBuffer, [1,0])

         
            
            audioPlayer.play(audioBuffer, offsetSamples, config.capturePlaybackDelayMs*44.1)
        
        }

         capturePacketId = sendPacketId
       
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
    <!-- <div class="volume" style=""></div> -->

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
    <option value="audioOutput">audio output</option>
    </select>
    </p>

    <p>
    <label>Fake Sending Latency (ms)</label>
    <input type="number" bind:value={config.fakeDelayMs} />
    </p>
    
    <p>
    
    <label>Audio device</label>
    <select bind:value={config.audioInputDeviceId} >


    {#each audioInputDevices as device}
        <option value={device.deviceId}>{device.label}</option>
    {/each}
    </select>

        <!-- <AudioInputSelector /> -->
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