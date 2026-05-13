// Утилита для получения информации об устройстве и браузере

export interface DeviceInfo {
  device: string;
  platform: string;
  browser: string;
  location: string;
}

export function getDeviceInfo(): DeviceInfo {
  const userAgent = navigator.userAgent;
  
  // Определение устройства
  let device = 'Неизвестное устройство';
  if (/Windows/i.test(userAgent)) {
    device = 'Windows PC';
    if (/Windows NT 10.0/i.test(userAgent)) device = 'Windows 10/11';
    else if (/Windows NT 6.3/i.test(userAgent)) device = 'Windows 8.1';
    else if (/Windows NT 6.2/i.test(userAgent)) device = 'Windows 8';
    else if (/Windows NT 6.1/i.test(userAgent)) device = 'Windows 7';
  } else if (/Macintosh/i.test(userAgent)) {
    device = 'Mac';
    if (/Mac OS X 10[._]1[5-9]/i.test(userAgent)) device = 'macOS Catalina/Big Sur';
    else if (/Mac OS X 1[0-2]_/i.test(userAgent)) device = 'macOS';
  } else if (/Linux/i.test(userAgent)) {
    device = 'Linux';
  } else if (/iPhone/i.test(userAgent)) {
    device = 'iPhone';
  } else if (/iPad/i.test(userAgent)) {
    device = 'iPad';
  } else if (/Android/i.test(userAgent)) {
    device = 'Android';
    if (/Mobile/i.test(userAgent)) device = 'Android Phone';
    else device = 'Android Tablet';
  }
  
  // Определение платформы
  let platform = 'Unknown';
  if (/Win/.test(navigator.platform)) platform = 'Windows';
  else if (/Mac/.test(navigator.platform)) platform = 'MacOS';
  else if (/Linux/.test(navigator.platform)) platform = 'Linux';
  else if (/iPhone|iPad|iPod/.test(navigator.platform)) platform = 'iOS';
  else if (/Android/.test(navigator.platform)) platform = 'Android';
  
  // Определение браузера
  let browser = 'Unknown Browser';
  if (/Chrome/.test(userAgent) && !/Edg/.test(userAgent)) {
    const match = userAgent.match(/Chrome\/(\d+)/);
    browser = `Chrome ${match ? match[1] : ''}`;
  } else if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) {
    browser = 'Safari';
  } else if (/Firefox/.test(userAgent)) {
    const match = userAgent.match(/Firefox\/(\d+)/);
    browser = `Firefox ${match ? match[1] : ''}`;
  } else if (/Edg/.test(userAgent)) {
    browser = 'Microsoft Edge';
  } else if (/OPR/.test(userAgent)) {
    browser = 'Opera';
  }
  
  // Получение приблизительного местоположения (по IP, упрощенно)
  // В реальном приложении можно использовать геолокацию API или сервис определения по IP
  let location = 'Неизвестно';
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (timezone) {
    // Преобразуем таймзону в примерное местоположение
    const cityMap: Record<string, string> = {
      'Europe/Moscow': 'Москва, Россия',
      'Europe/Kaliningrad': 'Калининград, Россия',
      'Europe/St_Petersburg': 'Санкт-Петербург, Россия',
      'Asia/Yekaterinburg': 'Екатеринбург, Россия',
      'Asia/Novosibirsk': 'Новосибирск, Россия',
      'Asia/Vladivostok': 'Владивосток, Россия',
      'America/New_York': 'Нью-Йорк, США',
      'America/Los_Angeles': 'Лос-Анджелес, США',
      'Europe/London': 'Лондон, Великобритания',
      'Europe/Berlin': 'Берлин, Германия',
      'Europe/Paris': 'Париж, Франция',
      'Asia/Tokyo': 'Токио, Япония',
      'Asia/Shanghai': 'Шанхай, Китай',
      'Asia/Dubai': 'Дубай, ОАЭ',
    };
    location = cityMap[timezone] || timezone.replace('_', ' ');
  }
  
  return {
    device,
    platform,
    browser,
    location
  };
}
