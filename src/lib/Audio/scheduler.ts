import { browser } from "$app/env"

import { instrument } from "soundfont-player"
import type { InstrumentName, Player } from "soundfont-player"

class Scheduler {
	bar = 0
	beat = 0

	time = 0
	decimal_beat = 0
	bar_length: number

	timer_id: ReturnType<typeof setTimeout>

	lookahead = {
		range: 0.1, // In seconds
		refresh_rate: 25, // In miliseconds
	}

	constructor(tempo: number) {
		this.bar = 0
		this.beat = 0
		this.time = 0
		this.bar_length = 60 / tempo * 4
	}

	advance_beat() {
		this.beat += 1
		if (this.beat > 3) {
			this.beat = 0
			this.bar = (this.bar + 1) % 4
		}

		this.time += this.bar_length / 4
		this.decimal_beat = this.bar + this.beat / 4
	}

	note_in_range(this: Scheduler, note: Note) {
		return (note.beat >= this.decimal_beat) && (note.beat < (this.decimal_beat + 0.25))
	}

	schedule(this: Scheduler, session: Session) {
		for (const track of session.tracks) {
			for (const note of track.notes) {
				if (this.note_in_range(note)) {
					track.instrument.play(note.value, this.real_time(note.beat))
					track.instrument.stop(this.real_time(note.beat + note.length))
				}
			}
		}
	}

	real_time(this: Scheduler, decimal_beat: number) {
		return this.time + (decimal_beat - this.decimal_beat) * this.bar_length
	}
}

export class Note {
	value: string
	beat: number
	length: number
	velocity = 100

	constructor(value: string, beat: number, length = 0.25) {
		this.value = value
		this.beat = beat
		this.length = length
	}
}

function audio_context_time(beat_time: number, beat: Scheduler) {
	// return beat.time + (beat_time - decimal_beat(beat)) * beat.beat_length * 4
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
	settings: {
		audio_context: AudioContext
		tempo: number
	}
	scheduler: Scheduler
	metadata: {
		created: Date
		modified: Date
	}

	constructor(name: string, tempo: number, tracks: InstrumentName[] = []) {
		this.settings = {
			audio_context: browser ? new AudioContext() : null,
			tempo: tempo,
		}
		this.name = name
		this.tracks = tracks.map(track => {
			return new Track(track, track, this.settings.audio_context)
		})

		this.playing = false
		
		this.metadata = {
			created: new Date(),
			modified: new Date(),
		}

		this.scheduler = new Scheduler(this.settings.tempo)
	}

	/** Gets the current decimal beat given the specified scheduled beat */
	// public get_current_beat(): number {
	// 	const time = this.settings.audio_context.currentTime
	// 	const scheduled_beat = this.scheduling.beat
	// 	const beat_length = 60 / this.settings.tempo
	
	// 	return scheduled_beat.bar + (time - scheduled_beat.time) / beat_length
	// }

	// schedule = (scheduler: Scheduler): void => {
	// 	for (const track of this.tracks) {
	// 		for (const note of track.notes) {
	// 			if (this.scheduler.note_in_range(note)) {
	// 				track.schedule(note, scheduler)
	// 			}
	// 		}
	// 	}
	// }

	look_for_scheduling = (): void => {
		const scheduler = this.scheduler
		// If there's a beat to schedule, schedule it
		if (scheduler.time < this.settings.audio_context.currentTime + scheduler.lookahead.range) {
			// console.log('beat in range', scheduler, );
			
			this.scheduler.schedule(this)
			// this.schedule(this.scheduler)
			this.scheduler.advance_beat()
		}
		
		this.scheduler.timer_id = setTimeout(this.look_for_scheduling, scheduler.lookahead.refresh_rate)
	}

	/** Start the scheduler */
	public start(): void {
		if (!browser) return

		if (!this.settings.audio_context) {
			this.settings.audio_context = new AudioContext()
		}

		const audio_context = this.settings.audio_context

		if (audio_context.state === 'suspended') {
			console.warn('Audio context is paused!')
			audio_context.resume()
		}

		this.scheduler.time = audio_context.currentTime
		this.playing = true
		this.look_for_scheduling()
	}

	/** Stop the scheduler */
	public stop(): void {
		clearTimeout(this.scheduler.timer_id)
		this.playing = false
	}
}