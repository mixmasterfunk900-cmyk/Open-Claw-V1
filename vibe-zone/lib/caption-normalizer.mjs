export const DEFAULT_CAPTION_FONT = 'DejaVu Sans'

export function cleanCaptionText(value = '') {
  return String(value || '')
    .replace(/[{}]/g, '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

export function assEscape(value = '') {
  return cleanCaptionText(value).replace(/\\/g, '\\\\')
}

export function assTime(value = 0) {
  const total = Math.max(0, Number(value) || 0)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const secondsValue = total % 60
  const secondsPart = String(Math.floor(secondsValue)).padStart(2, '0')
  const centis = String(Math.floor((secondsValue - Math.floor(secondsValue)) * 100)).padStart(2, '0')
  return `${hours}:${String(minutes).padStart(2, '0')}:${secondsPart}.${centis}`
}

export function secondsFromStamp(value, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const text = String(value || '').trim()
  if (!text) return fallback
  const parts = text.split(':').map(Number)
  if (parts.some((part) => !Number.isFinite(part))) return fallback
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return parts[0]
}

function splitWords(text = '') {
  return cleanCaptionText(text).split(/\s+/).filter(Boolean)
}

function weightedLength(text = '') {
  let total = 0
  for (const char of cleanCaptionText(text)) {
    const code = char.codePointAt(0)
    if ((code >= 0x4E00 && code <= 0x9FFF) || (code >= 0x3040 && code <= 0x30FF)) total += 1.75
    else if (code >= 0xAC00 && code <= 0xD7A3) total += 1.5
    else total += 1
  }
  return total
}

function phraseChunks(words, { maxWords = 6, maxChars = 42 } = {}) {
  const chunks = []
  let current = []
  const flush = () => {
    if (current.length) chunks.push(current.join(' '))
    current = []
  }
  for (const word of words) {
    const candidate = [...current, word].join(' ')
    if (current.length && (current.length >= maxWords || weightedLength(candidate) > maxChars)) flush()
    current.push(word)
    if (/[.!?]$/.test(word) || current.length >= maxWords || weightedLength(current.join(' ')) >= maxChars) flush()
  }
  flush()
  return chunks.filter(Boolean)
}

function eventFromWordTiming(word, timelineOffset = 0) {
  const text = cleanCaptionText(word.word || word.text || '')
  const start = Number(word.start)
  const end = Number(word.end)
  if (!text || !Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null
  return { start: start + timelineOffset, end: end + timelineOffset, text }
}

function segmentIntersections(segments = [], sourceStart, sourceEnd, timelineOffset = 0) {
  const out = []
  for (const segment of segments) {
    const segStart = Number(segment.start)
    const segEnd = Number(segment.end)
    if (!Number.isFinite(segStart) || !Number.isFinite(segEnd) || segEnd <= sourceStart || segStart >= sourceEnd) continue
    out.push({
      start: Math.max(segStart, sourceStart) - sourceStart + timelineOffset,
      end: Math.min(segEnd, sourceEnd) - sourceStart + timelineOffset,
      text: cleanCaptionText(segment.text),
      words: Array.isArray(segment.words) ? segment.words : [],
    })
  }
  return out.filter((item) => item.text && item.end > item.start)
}

export function buildShortWordEvents({ segments = [], sourceStart = 0, sourceEnd = 0, timelineOffset = 0, minDuration = 0.16, maxDuration = 0.62, gap = 0.015 } = {}) {
  const intersections = segmentIntersections(segments, sourceStart, sourceEnd, timelineOffset)
  const raw = []
  for (const segment of intersections) {
    const timedWords = segment.words.map((word) => eventFromWordTiming(word, timelineOffset - sourceStart)).filter(Boolean)
      .filter((word) => word.end > timelineOffset && word.start < timelineOffset + (sourceEnd - sourceStart))
    if (timedWords.length) {
      raw.push(...timedWords.map((word) => ({ ...word, text: word.text.toUpperCase() })))
      continue
    }
    const words = splitWords(segment.text)
    const duration = segment.end - segment.start
    words.forEach((word, index) => {
      const start = segment.start + duration * (index / words.length)
      const end = segment.start + duration * ((index + 1) / words.length)
      raw.push({ start, end, text: word.toUpperCase() })
    })
  }
  return normalizeTiming(raw, { minDuration, maxDuration, gap, videoDuration: Math.max(0, sourceEnd - sourceStart) + timelineOffset })
}

export function buildLongPhraseEvents({ segments = [], beats = null, sourceStart = 0, sourceEnd = 0, maxWords = 6, maxChars = 42, minDuration = 0.72, maxDuration = 2.6, gap = 0.035 } = {}) {
  const raw = []
  let timeline = 0
  const ranges = beats?.length ? beats.map((beat) => ({ sourceStart: secondsFromStamp(beat.start), sourceEnd: secondsFromStamp(beat.end), timelineOffset: beat.timelineOffset ?? timeline, advance: true })) : [{ sourceStart, sourceEnd, timelineOffset: 0, advance: false }]
  for (const range of ranges) {
    const intersections = segmentIntersections(segments, range.sourceStart, range.sourceEnd, range.timelineOffset)
    for (const segment of intersections) {
      const words = splitWords(segment.text)
      const chunks = phraseChunks(words, { maxWords, maxChars })
      if (!chunks.length) continue
      let usedWords = 0
      for (const chunk of chunks) {
        const count = splitWords(chunk).length
        const start = segment.start + (segment.end - segment.start) * (usedWords / words.length)
        const end = segment.start + (segment.end - segment.start) * ((usedWords + count) / words.length)
        raw.push({ start, end, text: chunk.toUpperCase() })
        usedWords += count
      }
    }
    if (range.advance) timeline += Math.max(0, range.sourceEnd - range.sourceStart)
  }
  const videoDuration = beats?.length ? timeline : Math.max(0, sourceEnd - sourceStart)
  return normalizeTiming(raw, { minDuration, maxDuration, gap, videoDuration })
}

export function normalizeTiming(events = [], { minDuration = 0.5, maxDuration = 2.5, gap = 0.03, videoDuration = null } = {}) {
  const sorted = events
    .map((event) => ({ start: Number(event.start), end: Number(event.end), text: cleanCaptionText(event.text) }))
    .filter((event) => event.text && Number.isFinite(event.start) && Number.isFinite(event.end) && event.end > event.start)
    .sort((a, b) => a.start - b.start)
  const out = []
  let lastEnd = 0
  const capEnd = Number.isFinite(videoDuration) ? videoDuration : Infinity
  for (const event of sorted) {
    const start = Math.max(0, event.start, lastEnd + (out.length ? gap : 0))
    let end = Math.max(start + minDuration, event.end)
    end = Math.min(end, start + maxDuration, capEnd)
    if (end <= start + 0.02 || start >= capEnd - 0.02) continue
    out.push({ start, end, text: event.text })
    lastEnd = end
  }
  return out
}

export function captionStyle({ mode = 'long', font = DEFAULT_CAPTION_FONT } = {}) {
  if (mode === 'short') {
    return {
      playResX: 1080,
      playResY: 1920,
      styleName: 'VibeShortWord',
      line: `Style: VibeShortWord,${font},92,&H00FFFFFF,&H00FFFFFF,&H00000000,&HAA000000,-1,0,0,0,100,100,0,0,1,8,0,2,70,70,292,1`,
    }
  }
  return {
    playResX: 1920,
    playResY: 1080,
    styleName: 'VibeNetflix',
    line: `Style: VibeNetflix,${font},46,&H00FFFFFF,&H00FFFFFF,&H001A0A14,&HAA000000,-1,0,0,0,100,100,0,0,1,5,1.2,2,240,240,58,1`,
  }
}

export function buildAss(events = [], options = {}) {
  const style = captionStyle(options)
  const lines = events.map((event) => `Dialogue: 0,${assTime(event.start)},${assTime(event.end)},${style.styleName},,0,0,0,,${assEscape(event.text)}`)
  return `[Script Info]\nTitle: Vibe Zone ${options.mode === 'short' ? 'short one-word' : 'long Netflix'} captions\nScriptType: v4.00+\nWrapStyle: 2\nScaledBorderAndShadow: yes\nPlayResX: ${style.playResX}\nPlayResY: ${style.playResY}\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n${style.line}\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n${lines.join('\n')}\n`
}

export function captionCoverage(events = [], { videoDuration = null, maxGap = 4, tailGap = maxGap } = {}) {
  const sorted = events
    .map((event) => ({ start: Number(event.start), end: Number(event.end), text: cleanCaptionText(event.text) }))
    .filter((event) => event.text && Number.isFinite(event.start) && Number.isFinite(event.end) && event.end > event.start)
    .sort((a, b) => a.start - b.start)
  const duration = Number.isFinite(videoDuration) ? Number(videoDuration) : sorted.at(-1)?.end || 0
  let maxSilentGap = sorted[0]?.start ?? duration
  let previousEnd = 0
  for (const event of sorted) {
    maxSilentGap = Math.max(maxSilentGap, event.start - previousEnd)
    previousEnd = Math.max(previousEnd, event.end)
  }
  const finalGap = Math.max(0, duration - previousEnd)
  maxSilentGap = Math.max(maxSilentGap, finalGap)
  return {
    ok: sorted.length > 0 && maxSilentGap <= maxGap && finalGap <= tailGap,
    eventCount: sorted.length,
    duration,
    firstStart: sorted[0]?.start ?? null,
    lastEnd: sorted.at(-1)?.end ?? null,
    maxSilentGap: Number(maxSilentGap.toFixed(3)),
    finalGap: Number(finalGap.toFixed(3)),
  }
}

export function mergeTimedCaptionEvents(primaryEvents = [], fallbackEvents = [], { videoDuration = null, maxGap = 4, coverPadding = 0.18 } = {}) {
  const primary = normalizeTiming(primaryEvents, { minDuration: 0.14, maxDuration: 0.75, gap: 0.015, videoDuration })
  const fallback = normalizeTiming(fallbackEvents, { minDuration: 0.14, maxDuration: 0.75, gap: 0.015, videoDuration })
  if (!primary.length) return { events: fallback, source: 'fallback', coverage: captionCoverage(fallback, { videoDuration, maxGap }) }
  const primaryRanges = primary.map((event) => ({ start: Math.max(0, event.start - coverPadding), end: event.end + coverPadding }))
  const fills = fallback.filter((event) => !primaryRanges.some((range) => event.start < range.end && event.end > range.start))
  const merged = normalizeTiming([...primary, ...fills], { minDuration: 0.14, maxDuration: 0.75, gap: 0.015, videoDuration })
  const primaryCoverage = captionCoverage(primary, { videoDuration, maxGap })
  const mergedCoverage = captionCoverage(merged, { videoDuration, maxGap })
  return {
    events: mergedCoverage.ok ? merged : fallback,
    source: mergedCoverage.ok ? (primaryCoverage.ok ? 'word' : 'word+fallback-gapfill') : 'fallback-coverage-rescue',
    coverage: mergedCoverage.ok ? mergedCoverage : captionCoverage(fallback, { videoDuration, maxGap }),
    primaryCoverage,
  }
}

export function qaCaptionEvents(events = [], { mode = 'long', maxWords = mode === 'short' ? 1 : 7, maxChars = mode === 'short' ? 24 : 46, minDuration = mode === 'short' ? 0.14 : 0.65, maxDuration = mode === 'short' ? 0.75 : 2.8 } = {}) {
  const failures = []
  const warnings = []
  if (!events.length) failures.push('no caption events generated')
  events.forEach((event, index) => {
    const text = cleanCaptionText(event.text)
    const words = splitWords(text)
    if (/[\r\n]/.test(String(event.text))) failures.push(`event ${index + 1} contains a line break`)
    if (words.length > maxWords) failures.push(`event ${index + 1} has ${words.length} words > ${maxWords}`)
    if (weightedLength(text) > maxChars) failures.push(`event ${index + 1} has weighted length ${weightedLength(text)} > ${maxChars}`)
    const duration = event.end - event.start
    if (duration < minDuration - 0.01) failures.push(`event ${index + 1} duration ${duration.toFixed(2)}s < ${minDuration}s`)
    if (duration > maxDuration + 0.01) warnings.push(`event ${index + 1} duration ${duration.toFixed(2)}s > ${maxDuration}s`)
    if (index > 0 && event.start < events[index - 1].end - 0.001) failures.push(`event ${index} overlaps event ${index + 1}`)
  })
  return { ok: failures.length === 0, failures, warnings, eventCount: events.length, mode }
}
