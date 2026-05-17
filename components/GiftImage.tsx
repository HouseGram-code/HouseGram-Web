'use client';

import Image from 'next/image';
import { useState } from 'react';

/**
 * Небольшой обёрточный компонент над next/image, который при ошибке загрузки
 * (например, 404 на raw.githubusercontent.com или сетевой сбой) автоматически
 * подменяет картинку на соответствующий эмоджи. Это не даёт сетке подарков
 * "ломаться" с крошечным плейсхолдером и обрезанным названием, как было видно
 * на скриншоте у "Красное сердце" и "Подарочная коробка".
 */
interface GiftImageProps {
  src: string;
  alt: string;
  emoji: string;
  width: number;
  height: number;
  /** CSS-классы для <Image>. Применяются только пока картинка не упала. */
  imgClassName?: string;
  /** CSS-классы для fallback-эмоджи. Дают подобрать размер шрифта руками. */
  emojiClassName?: string;
}

export default function GiftImage({
  src,
  alt,
  emoji,
  width,
  height,
  imgClassName,
  emojiClassName,
}: GiftImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <span
        className={emojiClassName ?? 'leading-none'}
        style={{ fontSize: `${Math.max(width, height)}px` }}
        aria-label={alt}
        role="img"
      >
        {emoji}
      </span>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={imgClassName}
      unoptimized
      onError={() => setFailed(true)}
    />
  );
}
