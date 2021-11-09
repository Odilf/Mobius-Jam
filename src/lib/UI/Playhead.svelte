<script>
	export let beat
	export let bar
	export let loop_length

	$: position = (beat - 1 + (bar - 1)/4) / loop_length
</script>

<svg viewBox="0 0 2 100" xmlns="http://www.w3.org/2000/svg" style='left: {position * 100}%'>
	<line x1="1" y1="100" x2="1" y2="0" stroke="black" />
</svg>

<!-- {position} -->

<style>
	svg {
		position: absolute;
		/* inset: 0; */
		/* right: 0;/ */
		/* left: 0; */
		width: 10px;
		/* height: 50%; */
		transition: all 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
	}
</style>