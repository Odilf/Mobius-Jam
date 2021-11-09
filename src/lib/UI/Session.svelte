<script lang=ts>
	import { browser } from "$app/env";
	import type { InstrumentName } from "soundfont-player"; 
	import { Session, Track, Note } from "$lib/Audio/scheduler";

	import Metronome from "./Metronome.svelte";

	const default_tracks: InstrumentName[] = [
		'acoustic_grand_piano',
		'acoustic_bass',
		'cello'
	]

	let session = new Session('caca', 120, default_tracks)
</script>

<Metronome/>

<h1> 
	{session.name}
</h1>
<main class=session-window>
	{#each session.tracks as track}
		<h2> {track.name} </h2>
	{/each}
</main>

<button on:click={() => session.start()}> Start </button>
<button on:click={() => session.stop()}> Stop </button>

<style>
	main {
		height: 80vh;
		width: 80vw;

		position: relative;

		flex-direction: column;

		background-color: var(--secondary);

		box-shadow: 0 0 5px hsla(0, 0%, 0%, 50%);
		border-radius: 2rem;
		padding: 2rem;
		box-sizing: border-box;
	}
</style>

