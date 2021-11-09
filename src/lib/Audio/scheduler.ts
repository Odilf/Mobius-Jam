import { browser } from "$app/env"

import { instrument } from "soundfont-player"
import type { InstrumentName, Player } from "soundfont-player"

class Beat {
	bar = 0
	beat = 0

	time = 0
	beat_length: number

	// timer_id: ReturnType<typeof setTimeout>

	constructor(tempo: number) {
		this.bar = 0
		this.beat = 0
		this.time = 0
		this.beat_length = 60 / tempo
	}

	advance(this: Beat): void {
		this.beat += 1
		if (this.beat > 3) {
			this.beat = 0
			this.bar = (this.bar + 1) % 4
		}
		this.time += this.beat_length
	}

	scheduling_range() {

	}
}

export class Note {
	value: string
	beat: { beat: number, bar: number }
	length = 0.25
	velocity = 100

	constructor(value: string, beat: number) {
		this.value = value
		this.beat = musical_beat(beat)
	}
}

function audio_context_time(beat_time: number, beat: Beat) {
	return beat.time + (beat_time - decimal_beat(beat)) * beat.beat_length * 4
}

function decimal_beat(beat: Beat) {
	return beat.bar + beat.beat / 4
}

function musical_beat(decimal_beat: number) {
	return {
		bar: Math.floor(decimal_beat),
		beat: Math.floor((decimal_beat % 1) * 4),
	}
}

interface AutomationPoint {
	beat: number
	value: number
}

class AutomationTrack {
	type: string
	points: AutomationPoint[]

	constructor(type: string) {
		this.type = type
		this.points = []
	}
}

export class Track {
	name: string
	instrument: Player
	notes: Note[] = []
	automation: AutomationTrack[] = []
	length: number
	settings = {
		volume: 0,
		muted: 0,
		pan: 0,
	}

	schedule(note: Note, beat: Beat): void {
		const start_time = audio_context_time(note.beat, beat)
		const stop_time = audio_context_time(note.beat + note.length, beat)

		this.instrument.play(note.value, start_time)
		this.instrument.stop(stop_time)
	}

	constructor(name: string, instrument_name: InstrumentName, ac: AudioContext) {
		this.name = name 

		instrument(ac, instrument_name)
			.then(instrument => this.instrument = instrument)
			.catch(console.warn)
	}
}

export class Session {
	name: string
	tracks: Track[]
	playing: boolean
	scheduling: {
		readonly beat: Beat
		timeout_id?: ReturnType<typeof setTimeout>
	}
	settings: {
		audio_context: AudioContext
		tempo: number
		lookahead: { refresh_rate: number, range: number}
	}
	metadata: {
		created: Date
		modified: Date
	}

	constructor(name: string, tempo: number, tracks: InstrumentName[] = []) {
		this.settings = {
			audio_context: browser ? new AudioContext() : null,
			tempo: tempo,
			lookahead: { range: 0.1, refresh_rate: 25 }
		}
		this.name = name
		this.tracks = tracks.map(track => {
			return new Track(track, track, this.settings.audio_context)
		})

		this.playing = false
		this.scheduling = {
			beat: new Beat(this.settings.tempo)
		}
		
		this.metadata = {
			created: new Date(),
			modified: new Date(),
		}
	}

	/** Gets the current decimal beat given the specified scheduled beat */
	public get_current_beat(): number {
		const time = this.settings.audio_context.currentTime
		const scheduled_beat = this.scheduling.beat
		const beat_length = 60 / this.settings.tempo
	
		return scheduled_beat.bar + (time - scheduled_beat.time) / beat_length
	}

	schedule = (beat: Beat): void => {
		console.log('scheduling', beat);
		
		for (const track of this.tracks) {
			for (const note of track.notes) {
				// Schedule notes on the beat that is getting scheduled
				if (Math.floor(note.beat) === beat.bar) {
					track.schedule(note, beat)
				}
			}
		}
	}

	scheduler = (): void => {
		// If there's a beat to schedule, schedule it
		if (this.scheduling.beat.time < this.settings.audio_context.currentTime + this.settings.lookahead.range) {
			this.schedule(this.scheduling.beat)
			this.scheduling.beat.advance()
		}
		
		this.scheduling.timeout_id = setTimeout(this.scheduler, this.settings.lookahead.refresh_rate)
	}

	/** Start the scheduler */
	public start(): void {
		if (!browser) return

		if (!this.settings.audio_context) {
			this.settings.audio_context = new AudioContext()
		}

		const audio_context = this.settings.audio_context

		if (audio_context.state === 'suspended') {
			audio_context.resume()
		}

		this.scheduling.beat.time = audio_context.currentTime
		this.playing = true
		this.scheduler()
	}

	/** Stop the scheduler */
	public stop(): void {
		clearTimeout(this.scheduling.timeout_id)
		this.playing = false
	}

	// add_track(track: Track) {
	// 	this.tracks.push(track)
	// }
}