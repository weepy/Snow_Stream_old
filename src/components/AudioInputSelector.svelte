<script>
import { onMount } from 'svelte'
import { updateAudioDevices, audioInputDeviceId, audioInputDevices  } from '../lib/recorderStore.js'
updateAudioDevices()
function change(e) {
    audioInputDeviceId.set(e.srcElement.value)
}
</script>

<select on:input={change} value={$audioInputDeviceId}>
    {#each $audioInputDevices as device}
        <option value={device.deviceId}>{device.label}</option>
    {/each}
</select>

<style>
select {
    font-size: 12px;
    padding: 0;
    margin: 0;
}
</style>