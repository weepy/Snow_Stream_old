

function f_to_ui16(f) {
    return ((f + 1) * 32767)|0
}

function ui16_to_f(x) {
    return x/32768-1
}

const HEADER_SIZE = 8

export default class Packet {
    constructor(header=[], audioData) {
        const chunkSize = audioData ? audioData[0].length : 0
        const data =  this.data = new Uint16Array(chunkSize*2+HEADER_SIZE)
        
        for(let i=0; i<header.length;i++) {
            data[i] = header[i]
        }
        
        if(audioData) {
            // const ch = [ audioBuffer.getChannelData(0), audioBuffer.getChannelData(1)]

            for(let i=0; i<chunkSize;i++) {
                //const sample = (Math.random()-0.5)*32767; 
                const left = audioData[0][i] 
                const right = audioData[1][i]// Math.cos((sentSamples+i)/50)
                
                data[i*2 + HEADER_SIZE] = f_to_ui16(left)
                data[i*2+1 + HEADER_SIZE] = f_to_ui16(right)
            } 
        }


    }

    static fromBuffer(buffer) {
        const packet = new Packet()
        packet.data = new Uint16Array(buffer)
        return packet
    }

    static createAudioBuffer(data, sampleRate) {
        const chunkLength =  (data.length-HEADER_SIZE)/2

        const buffer = new AudioBuffer({ sampleRate, length: chunkLength, numberOfChannels: 2})
        
        
        const ch = [ buffer.getChannelData(0), buffer.getChannelData(1)]

        for(let i=0; i<chunkLength;i++) {
          const s0 = ui16_to_f(data[i*2+HEADER_SIZE])
          const s1 = ui16_to_f(data[i*2+1+HEADER_SIZE])
          ch[0][i] = s0 
          ch[1][i] = s1
        }
      
        return buffer
    }



    createAudioBuffer(sampleRate) {
        return Packet.createAudioBuffer(this.data, sampleRate)
    }


}

