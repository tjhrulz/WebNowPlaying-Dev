const openTabs: { [key: string]: boolean } = {}

const updateTitle = () => {
  const tabs = Object.keys(openTabs).length
  chrome.action.setTitle({ title: `${tabs} tab${tabs === 1 ? '' : 's'} connected` })
}
updateTitle()

chrome.runtime.onMessage.addListener((request, sender) => {
  switch (request.event) {
    case 'outdated':
      chrome.action.setBadgeText({ text: '!' })
      chrome.action.setBadgeBackgroundColor({ color: [255, 0, 0, 255] })
      chrome.action.setTitle({ title: 'WebNowPlaying plugin is outdated' })
      break
    case 'wsConnected':
      if (!sender.tab || !sender.tab.id) break
      if (openTabs[sender.tab.id]) break
      openTabs[sender.tab.id] = true
      updateTitle()
      chrome.action.setBadgeText({ text: '' }) // Reset it in case it was set to '!'
      break
    case 'wsDisconnected':
      if (!sender.tab || !sender.tab.id) break
      if (!openTabs[sender.tab.id]) break
      delete openTabs[sender.tab.id]
      updateTitle()
      chrome.action.setBadgeText({ text: '' }) // Reset it in case it was set to '!'
      break
    default:
      break
  }
})