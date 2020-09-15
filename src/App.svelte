<script>
import { onMount } from 'svelte'

import router from "page"

import Sender from './pages/Sender.svelte'
import Record from './pages/Record.svelte'
import Bounce from './pages/Bounce.svelte'
import Home from './pages/Home.svelte'


let page
let params 


router('/', () => page = Sender)

// router('/record', () => page = Record)
// router('/bounce', () => page = Bounce)
// router('/sender', () => page = Sender)


router.start()


</script>

<svelte:component this={page}  params={params} />
