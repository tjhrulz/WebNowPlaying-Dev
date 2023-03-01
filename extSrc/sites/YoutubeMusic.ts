import { RepeatMode, Site, StateMode } from '../content'
import { getMediaSessionCover } from '../utils'

// I'm not using mediaSession here because of ads.
// Of course this isn't an issue with YouTube Premium or adblock, but still.
const site: Site = {
  ready: () => document.querySelector('video') !== null && (document.querySelector<HTMLButtonElement>('.title.ytmusic-player-bar')?.innerText.length || 0) > 0,
  info: {
    player: () => 'Youtube Music',
    state: () => (document.querySelector('video')?.paused ? StateMode.PAUSED : StateMode.PLAYING),
    title: () => document.querySelector<HTMLElement>('.title.ytmusic-player-bar')?.innerText || '',
    artist: () => document.querySelector<HTMLElement>('.byline.ytmusic-player-bar a')?.innerText || '',
    album: () => document.querySelectorAll<HTMLElement>('.byline.ytmusic-player-bar a')[1]?.innerText || '',
    cover: () => getMediaSessionCover(),
    duration: () => {
      const durationInfo = document.querySelector<HTMLElement>('.time-info.ytmusic-player-bar')?.innerText
      if (!durationInfo) return '0:00'
      return durationInfo.split(' / ')[1]
    },
    position: () => {
      const durationInfo = document.querySelector<HTMLElement>('.time-info.ytmusic-player-bar')?.innerText
      if (!durationInfo) return '0:00'
      return durationInfo.split(' / ')[0]
    },
    volume: () => (document.querySelector('video')?.volume || 0) * 100,
    rating: () => {
      const likeButton = document.querySelectorAll('.middle-controls-buttons button')[1]
      const dislikeButton = document.querySelector('.middle-controls-buttons button')
      if (likeButton.getAttribute('aria-pressed') === 'true') return 5
      if (dislikeButton?.getAttribute('aria-pressed') === 'true') return 1
      return 0
    },
    repeat: () => {
      const repeatMode = document.querySelector('ytmusic-player-bar')?.getAttribute('repeat-mode_')
      if (repeatMode === 'ALL') return RepeatMode.ALL
      if (repeatMode === 'ONE') return RepeatMode.ONE
      return RepeatMode.NONE
    },
    // Youtube music doesn't do shuffling the traditional way, it just shuffles the current queue with no way of undoing it
    shuffle: () => false
  },
  events: {
    togglePlaying: () => document.querySelector<HTMLButtonElement>('#play-pause-button')?.click(),
    next: () => document.querySelector<HTMLButtonElement>('.next-button')?.click(),
    previous: () => document.querySelector<HTMLButtonElement>('.previous-button')?.click(),
    setPositionSeconds: null,
    setPositionPercentage: (positionPercentage: number) => {
      const el = document.querySelector('#progress-bar tp-yt-paper-progress')
      if (!el) return
      const loc = el.getBoundingClientRect()
      const position = positionPercentage * loc.width

      el.dispatchEvent(new MouseEvent('mousedown', {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: loc.left + position,
        clientY: loc.top + (loc.height / 2)
      }))
      el.dispatchEvent(new MouseEvent('mouseup', {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: loc.left + position,
        clientY: loc.top + (loc.height / 2)
      }))
    },
    setVolume: (volume: number) => {
      const video = document.querySelector('video')
      if (video) {
        video.volume = volume / 100
        if (volume === 0) video.muted = true
        else video.muted = false
      }
    },
    toggleRepeat: () => document.querySelector<HTMLButtonElement>('.repeat')?.click(),
    toggleShuffle: () => document.querySelector<HTMLButtonElement>('.shuffle')?.click(),
    toggleThumbsUp: () => document.querySelectorAll<HTMLButtonElement>('.middle-controls-buttons button')[1]?.click(),
    toggleThumbsDown: () => document.querySelector<HTMLButtonElement>('.middle-controls-buttons button')?.click(),
    setRating: (rating: number) => {
      if (rating >= 3 && site.info.rating?.() !== 5)
        site.events.toggleThumbsUp?.()
      else if (rating < 3 && site.info.rating?.() !== 1)
        site.events.toggleThumbsDown?.()
    }
  }
}

export default site