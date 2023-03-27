import { YouTubeVideoDetails } from '../types'

export { }

window.addEventListener('message', (e: any) => {
  if (e.data.type === 'wnp-message') {
    switch (e.data.event) {
      case 'getYouTubeInfo':
        window.postMessage({
          id: e.data.id,
          type: 'wnp-response',
          value: {
            videoDetails: getVideoDetails(),
            playlistDetails: findKey(getYouTubeContainer()?.querySelector('#playlist'), 'data'),
            containerLocalName: getYouTubeContainer()?.localName
          }
        }, '*')
        break
      case 'getYouTubeMusicVolume':
        window.postMessage({
          id: e.data.id,
          type: 'wnp-response',
          value: (document.querySelector('ytmusic-player-bar') as any)?.playerApi_?.getVolume?.()
        }, '*')
        break
      case 'setYouTubeMusicVolume':
        (document.querySelector('ytmusic-player-bar') as any)?.playerApi_?.setVolume?.(e.data.data)
        window.postMessage({
          id: e.data.id,
          type: 'wnp-response',
          value: null
        }, '*')
        break
      case 'seekNetflix':
        getNetflixPlayer()?.seek?.(e.data.data * 1000)
        window.postMessage({
          id: e.data.id,
          type: 'wnp-response',
          value: null
        }, '*')
        break
      case 'getNetflixInfo':
        window.postMessage({
          id: e.data.id,
          type: 'wnp-response',
          value: getNetflixInfo()
        }, '*')
        break
      default:
        window.postMessage({
          id: e.data.id,
          type: 'wnp-response',
          value: null
        }, '*')
    }
  }
})

function findKey(obj: any, key: string): any {
  if (typeof obj !== 'object' || obj === null) return null
  const value = typeof obj.get === 'function' ? obj.get(key) : obj[key]
  if (value !== undefined && value !== null) return value
  // Keys can be 'a.b.c' to find nested objects
  const keys = key.split('.')
  let prop = obj
  for (const key of keys) {
    prop = prop?.[key]
    if (!prop) break
  }
  if (prop) return prop
  return null
}

function getYouTubeContainer(): Element | null {
  const previewPlayer = document.querySelector('ytd-video-preview')
  if (findKey(previewPlayer, 'active')) return previewPlayer
  const shortsPlayer = document.querySelector('ytd-shorts')
  if (findKey(shortsPlayer, 'active')) return shortsPlayer
  const miniPlayer = document.querySelector('ytd-miniplayer')
  if (findKey(miniPlayer, 'active')) return miniPlayer
  const flexyPlayer = document.querySelector('ytd-watch-flexy')
  if (findKey(flexyPlayer, 'active')) return flexyPlayer
  return null
}

function getVideoDetails(): YouTubeVideoDetails {
  let details
  const container = getYouTubeContainer()
  if (!container) return {}
  switch (container.localName) {
    case 'ytd-video-preview':
      details = findKey(container, 'videoPreviewFetchRequest.result_.videoDetails')
      break
    case 'ytd-miniplayer':
      details = findKey(container, 'watchResponse.playerResponse.videoDetails')
      break
    case 'ytd-shorts':
    case 'ytd-watch-flexy':
      details = findKey(container, 'playerData.videoDetails')
      break
    default:
      details = findKey(document.querySelector('ytd-app'), 'data.playerResponse.videoDetails')
  }
  return details ?? {}
}

function getNetflixContext() {
  return (window as any)?.netflix?.appContext
}

function getNetflixAPI() {
  return getNetflixContext().getState?.()?.playerApp?.getAPI?.()
}

function getSessionId() {
  let sessionId = null
  for (const id of getNetflixAPI()?.videoPlayer?.getAllPlayerSessionIds?.() ?? []) {
    if (id.startsWith('watch-')) {
      sessionId = id
      break
    }
  }
  return sessionId
}

function getNetflixPlayer() {
  return getNetflixAPI()?.videoPlayer?.getVideoPlayerBySessionId?.(getSessionId())
}

function getNetflixMetadata(): any {
  try {
    return Object.values(
      getNetflixContext()?.getPlayerApp?.()?.getState?.()?.videoPlayer?.videoMetadata
    ).find((data: any) => '_video' in data)
  } catch {
    return null
  }
}

function getSeasonData() {
  const metadata = getNetflixMetadata()?._metadata?.video
  if (metadata?.seasons) {
    const getEpisode = (season: any) => [...season?.episodes].find((episode) => episode?.id === metadata?.currentEpisode)
    const season = [...metadata?.seasons].find(getEpisode)
    return {
      type: metadata?.type,
      title: metadata?.title,
      episode: getEpisode(season),
      season,
      seasons: metadata?.seasons
    }
  }
}

function getNavData() {
  const data = getSeasonData()
  if (data) {
    const { episodes, seq } = data.season
    const seasons = [...data.seasons]
    const eIndex = [...episodes].findIndex(
      (episode) => episode.id === data.episode.id
    )
    const currId = [...episodes][eIndex].id
    let prevId; let nextId
    if (eIndex > 0) {
      prevId = [...episodes][eIndex - 1]?.id
    } else if (seq > 1) {
      const prevEpisodes = [...seasons[seq - 2].episodes]
      prevId = prevEpisodes[prevEpisodes.length - 1]?.id
    }
    if (eIndex === episodes.length - 1 && seq < seasons.length)
      nextId = [...seasons[seq].episodes][0]?.id
    else
      nextId = [...episodes][eIndex + 1]?.id

    return { prevId, currId, nextId }
  }
}

function getNetflixInfo() {
  return {
    seasonData: getSeasonData(),
    navData: getNavData(),
    metadata: getNetflixMetadata(),
    isPlayerReady: getNetflixPlayer()?.isReady?.() || false
  }
}