// Функция для парсинга и рендеринга форматированного текста
export function parseFormattedText(text: string): React.ReactNode[] {
  const elements: React.ReactNode[] = [];
  let currentIndex = 0;
  
  // Регулярные выражения для разных форматов
  const patterns = [
    { regex: /\*\*(.+?)\*\*/g, tag: 'strong', className: 'font-bold' },
    { regex: /_(.+?)_/g, tag: 'em', className: 'italic' },
    { regex: /`(.+?)`/g, tag: 'code', className: 'bg-gray-100 px-1 py-0.5 rounded text-sm font-mono' },
    { regex: /~~(.+?)~~/g, tag: 'del', className: 'line-through' },
    { regex: /__(.+?)__/g, tag: 'u', className: 'underline' },
    { regex: /\[(.+?)\]\((.+?)\)/g, tag: 'a', className: 'text-blue-500 underline hover:text-blue-600' },
  ];

  // Находим все совпадения
  const matches: Array<{ start: number; end: number; content: string; format: any }> = [];
  
  patterns.forEach(pattern => {
    const regex = new RegExp(pattern.regex.source, 'g');
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        content: match[1],
        format: pattern
      });
    }
  });

  // Сортируем по позиции
  matches.sort((a, b) => a.start - b.start);

  // Строим результат
  matches.forEach((match, index) => {
    // Добавляем текст до совпадения
    if (match.start > currentIndex) {
      elements.push(text.substring(currentIndex, match.start));
    }

    // Добавляем форматированный элемент
    const Tag = match.format.tag as any;
    elements.push(
      <Tag key={index} className={match.format.className}>
        {match.content}
      </Tag>
    );

    currentIndex = match.end;
  });

  // Добавляем оставшийся текст
  if (currentIndex < text.length) {
    elements.push(text.substring(currentIndex));
  }

  return elements.length > 0 ? elements : [text];
}

// Проверка, содержит ли текст форматирование
export function hasFormatting(text: string): boolean {
  const patterns = [
    /\*\*(.+?)\*\*/,
    /_(.+?)_/,
    /`(.+?)`/,
    /~~(.+?)~~/,
    /__(.+?)__/,
    /\[(.+?)\]\((.+?)\)/,
  ];

  return patterns.some(pattern => pattern.test(text));
}
