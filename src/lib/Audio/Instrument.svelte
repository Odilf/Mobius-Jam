<script lang=ts>
	import { browser } from '$app/env'
	
	export let audioContext: AudioContext
	
	// Music!
	import { instrument as getInstrument} from 'soundfont-player'
	
	export let instrument_name: string
	let instrument
	let instrument_promise

	// import { nextBeat } from '$lib/Audio/scheduler'

	

	// nextBeat.subscribe(nextBeat => {
	// 	console.log(nextBeat, audioContext && audioContext.currentTime)
	// 	if (nextBeat.number == 3) {
	// 		// instrument.play('C4', nextBeat.nextBeatTime).stop(nextBeat.nextBeatTime + 0.1)
	// 	}
	// })


	if (browser) {
		setupInstrument(instrument_name)
	}
	
	async function setupInstrument(name) {
		instrument_promise = getInstrument(audioContext, name)
		instrument = await instrument_promise

		//@ts-expect-error
		window.navigator.requestMIDIAccess().then(function (midiAccess) {
			midiAccess.inputs.forEach(function (midiInput) {

				instrument.listenToMidi(midiInput)
			})
		})

		console.log('loaded', instrument_name);
	}


</script>
<!-- 
<button on:click={() => {
	instrument.play('C4')
	console.log(instrument)
}}> Resume </button> -->

<!-- <svelte:window on:keydown={marimba && marimba.play('D3')} /> -->

{#await instrument_promise}
	<p> waiting for {instrument_name}... </p>
{:then marimba}
	<p> We got {instrument_name}!</p>
{/await}
caca