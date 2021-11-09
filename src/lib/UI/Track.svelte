<script lang=ts>
	import Instrument from "$lib/Audio/Instrument.svelte";

	export let name: string
	export let audioContext: AudioContext
	

	export function schedule(beat, time) {
		return 'caca'
	}
</script>

<Instrument {audioContext} instrument_name={name}/>

<main>
	<h1> {name} </h1>
</main>

<style>
	main {
		width: 100%;
		height: 200px;

		align-items: center;

		padding: 1em;
		box-sizing: border-box;
		background-color: var(--tertiary);

		border-radius: 2rem;
	}
</style>