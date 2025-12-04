import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export const useSession = () => {
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    let sid = localStorage.getItem('minglemoody_session');
    if (!sid) {
      sid = uuidv4();
      localStorage.setItem('minglemoody_session', sid);
    }
    setSessionId(sid);
  }, []);

  return sessionId;
};

export const getDeviceType = (): string => {
  const ua = navigator.userAgent;
  if (/mobile/i.test(ua)) return 'Mobile';
  if (/tablet/i.test(ua)) return 'Tablet';
  return 'Desktop';
};
