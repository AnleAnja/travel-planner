import '@testing-library/jest-dom/vitest'

class BroadcastChannelMock {
  onmessage: ((event: MessageEvent) => void) | null = null
  postMessage() {}
  close() {}
}

Object.defineProperty(globalThis, 'BroadcastChannel', {
  value: BroadcastChannelMock,
  writable: true,
})

if (typeof HTMLDialogElement !== 'undefined') {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute('open')
  }
}
