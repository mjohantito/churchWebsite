import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';

const fmt = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

/**
 * Small audio player with an accent play button and progress bar
 * (the browser's built-in controls cannot take the brand accent).
 * Keyboard: Tab to the button (Space/Enter), then the slider (arrow keys seek).
 */
export function AudioPlayer({ src, labelId }: { src: string; labelId?: string }) {
  const { t } = useTranslation();
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    const onTime = () => setTime(a.currentTime);
    const onMeta = () => setDuration(Number.isFinite(a.duration) ? a.duration : 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onError = () => setFailed(true);
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('durationchange', onMeta);
    a.addEventListener('play', onPlay);
    a.addEventListener('pause', onPause);
    a.addEventListener('ended', onPause);
    a.addEventListener('error', onError);
    return () => {
      a.pause();
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('loadedmetadata', onMeta);
      a.removeEventListener('durationchange', onMeta);
      a.removeEventListener('play', onPlay);
      a.removeEventListener('pause', onPause);
      a.removeEventListener('ended', onPause);
      a.removeEventListener('error', onError);
    };
  }, [src]);

  const toggle = () => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) void a.play().catch(() => setFailed(true));
    else a.pause();
  };
  const progress = duration ? Math.min(100, (time / duration) * 100) : 0;

  return (
    <div className="audio-player" role="group" aria-labelledby={labelId}>
      <audio ref={audio} src={src} preload="metadata" />
      <button type="button" className="audio-player__btn" onClick={toggle} aria-label={playing ? t('audio.pause') : t('audio.play')} disabled={failed}>
        <Icon name={playing ? 'pause-bold' : 'play-bold'} className="h-5 w-5" />
      </button>
      <input
        type="range"
        className="audio-player__range"
        min={0}
        max={duration || 0}
        step={1}
        value={Math.floor(time)}
        disabled={!duration || failed}
        aria-label={t('audio.seek')}
        aria-valuetext={t('audio.position', { current: fmt(time), total: fmt(duration) })}
        style={{ ['--p' as string]: `${progress}%` }}
        onChange={(e) => {
          const a = audio.current;
          if (a) a.currentTime = Number(e.target.value);
          setTime(Number(e.target.value));
        }}
      />
      <span className="audio-player__time" aria-hidden="true">{fmt(time)} / {fmt(duration)}</span>
      {failed && <p className="audio-player__error" role="alert">{t('dailyBread.audioUnsupported')}</p>}
    </div>
  );
}
