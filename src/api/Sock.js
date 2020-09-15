import Messages from './Messages.js'

export default class Sock  {
    constructor(url) {
        const sock = this.sock = new WebSocket(url) //"ws://localhost:9090");
        sock.binaryType = "arraybuffer"

        sock.onmessage = e => {
            const packet = new Uint16Array(e.data)
            const message = packet[0]//get16(data, 0)
            // const channel_id = data[1]
            
            if(message == Messages.AUDIO_DATA) {

                this.onaudiodata(packet)
                // const stamp = data[2]
                // const delay = streamTime() - stamp // ms
                // // const ch = createAudioChunk(data)
                // // playAudioChunk(ch)
            }
            
            else if(message == Messages.SUBSCRIBE) {
                this.onsubscribe(packet)

            // const yesno = data[2]
            // console.log("subscribed: ", channel_id, yesno)
            }
        
            else if(message == Messages.ECHO) {
                this.onecho(packet)
                // 
            }
        }
        
        sock.onopen = () => {
            // RECEIVE FROM SELF!
            console.log("Connected socket")
        }

    }

    emit(packet) {
        this.sock.send(packet.data)
    }
    
    onecho(packet) {
        console.log("ECHO", packet.length)
    }
    onpublish(packet) {
        console.log("PUBLISH", packet.length)
    }
    onaudiodata(packet) {
        console.log("AUDIO DATA", packet.length)
    }
}



let packetCount = 0


