import {writable} from 'svelte/store'


export const recorderState = writable()



export const audioInputDeviceId = writable(localStorage.audioInputDeviceId)
export const recordingLevel = writable(0)

audioInputDeviceId.subscribe(v => {
    localStorage.audioInputDeviceId = v    
})

export const audioInputDevices = writable([])

export function updateAudioDevices() {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
        audioInputDevices.set(devices.filter((d) => d.kind === 'audioinput'))
    })
}

updateAudioDevices()