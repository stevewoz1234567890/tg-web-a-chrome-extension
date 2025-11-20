(function () {
  const STATE_KEY = '__tgDisappearState';
  const ACTION_PATCH_FLAG = '__tgDisappearPatched';
  const TTL_SECONDS = 2147483647;
  const BUTTON_ID = 'tg-disappear-toggle';
  const ACTIVE_CLASS = 'tg-disappear-active';
  const STATUS_CLASS_TRIGGER = 'tg-disappear-show-status';

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  async function waitForTelegram() {
    for (let i = 0; i < 600; i += 1) {
      if (typeof window.getActions === 'function' && typeof window.getGlobal === 'function') {
        return true;
      }
      await wait(200);
    }
    throw new Error('Telegram actions not available');
  }

  function getState() {
    if (!window[STATE_KEY]) {
      window[STATE_KEY] = { enabled: false };
    }
    return window[STATE_KEY];
  }

  function isMediaAttachment(attachment) {
    if (!attachment || typeof attachment !== 'object') return false;
    if (attachment.shouldSendAsFile) return false;

    const type = String(attachment.mediaType || attachment.type || '').toLowerCase();
    if (/(photo|video|gif|story)/.test(type)) return true;

    if (attachment.photo || attachment.video || attachment.story) return true;
    if (attachment.media?.photo || attachment.media?.video) return true;

    const mime = String(attachment.mimeType || '').toLowerCase();
    if (mime.startsWith('image/') || mime.startsWith('video/')) return true;

    return Boolean(attachment.previewBlobUrl || attachment.previewFile || attachment.quick);
  }

  function applyTtl(attachment) {
    if (!isMediaAttachment(attachment)) return;
    try {
      attachment.ttlSeconds = TTL_SECONDS;
      if (attachment.media) {
        attachment.media.ttlSeconds = TTL_SECONDS;
      }
      if (attachment.photo) {
        attachment.photo = { ...attachment.photo, ttlSeconds: TTL_SECONDS };
      }
      if (attachment.video) {
        attachment.video = { ...attachment.video, ttlSeconds: TTL_SECONDS };
      }
      if (attachment.story) {
        attachment.story = { ...attachment.story, ttlSeconds: TTL_SECONDS };
      }
    } catch (err) {
      console.warn('[tg-disappear] Failed to apply TTL to attachment', err);
    }
  }

  function mutatePayload(payload) {
    if (!payload || typeof payload !== 'object') return false;
    let mutated = false;

    if (Array.isArray(payload.attachments)) {
      payload.attachments.forEach((attachment) => {
        const before = attachment?.ttlSeconds;
        applyTtl(attachment);
        if (!mutated && attachment && attachment.ttlSeconds !== before) {
          mutated = true;
        }
      });
    }

    if (payload.attachment) {
      const before = payload.attachment.ttlSeconds;
      applyTtl(payload.attachment);
      mutated = mutated || payload.attachment.ttlSeconds !== before;
    }

    if (payload.story) {
      applyTtl(payload.story);
      mutated = true;
    }

    if (mutated) {
      payload.isInvertedMedia = true;
      payload.ttlSeconds = TTL_SECONDS;
    }

    return mutated;
  }

  function patchActions(actions) {
    if (!actions || typeof actions.sendMessage !== 'function') return;
    if (actions.sendMessage[ACTION_PATCH_FLAG]) return;

    const originalSendMessage = actions.sendMessage;

    const patched = function patchedSendMessage(payload, ...rest) {
      const state = getState();
      if (state.enabled && payload) {
        try {
          mutatePayload(payload);
        } catch (err) {
          console.error('[tg-disappear] Unable to prepare message payload', err);
        }
      }
      return originalSendMessage.call(this, payload, ...rest);
    };

    patched[ACTION_PATCH_FLAG] = true;
    actions.sendMessage = patched;
  }

  function ensureActionsPatched() {
    try {
      patchActions(window.getActions());
    } catch (err) {
      console.warn('[tg-disappear] Unable to patch actions immediately', err);
    }
  }

  function createToggle(actions) {
    if (document.getElementById(BUTTON_ID)) return;

    const button = document.createElement('button');
    button.id = BUTTON_ID;
    button.type = 'button';
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-label', 'Toggle disappearing media mode');

    const icon = document.createElement('span');
    icon.className = 'tg-toggle-icon';
    icon.textContent = '⚡';

    const status = document.createElement('span');
    status.className = 'tg-toggle-status';
    status.textContent = 'OFF';

    button.appendChild(icon);
    button.appendChild(status);

    const state = getState();

    function updateVisuals() {
      status.textContent = state.enabled ? 'ON' : 'OFF';
      button.classList.toggle(ACTIVE_CLASS, state.enabled);
      button.classList.add(STATUS_CLASS_TRIGGER);
      button.setAttribute('aria-pressed', state.enabled ? 'true' : 'false');
      button.title = state.enabled
        ? 'Disappearing media mode is ON'
        : 'Disappearing media mode is OFF';

      window.clearTimeout(updateVisuals.statusTimeout);
      updateVisuals.statusTimeout = window.setTimeout(() => {
        button.classList.remove(STATUS_CLASS_TRIGGER);
      }, 1400);
    }

    button.addEventListener('click', () => {
      state.enabled = !state.enabled;
      updateVisuals();
      if (actions?.updateAttachmentSettings) {
        actions.updateAttachmentSettings({ isInvertedMedia: state.enabled ? true : undefined });
      }
    });

    document.body.appendChild(button);
    updateVisuals();
  }

  function enhanceGetActions() {
    const originalGetActions = window.getActions;
    window.getActions = function patchedGetActions() {
      const actions = originalGetActions.apply(this, arguments);
      patchActions(actions);
      createToggle(actions);
      return actions;
    };
  }

  function ensureTogglePresence(actions) {
    createToggle(actions);
    const observer = new MutationObserver(() => {
      if (!document.body.contains(document.getElementById(BUTTON_ID))) {
        createToggle(window.getActions());
      }
    });
    observer.observe(document.body, { childList: true });
  }

  function init() {
    const actions = window.getActions();
    patchActions(actions);
    enhanceGetActions();
    ensureTogglePresence(actions);
  }

  waitForTelegram()
    .then(init)
    .catch((err) => {
      console.error('[tg-disappear] Failed to initialize', err);
    });
})();

