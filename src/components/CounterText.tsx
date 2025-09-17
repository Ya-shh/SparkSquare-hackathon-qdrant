import React, { useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';

interface CounterTextProps {
  value: number;
  suffix?: string;
  duration?: number;
}

const CounterText: React.FC<CounterTextProps> = ({ 
  value, 
  suffix = '', 
  duration = 2000 
}) => {
  const [count, setCount] = useState(0);
  const countRef = useRef<number>(0);
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  useEffect(() => {
    if (inView) {
      countRef.current = 0;
      setCount(0);
      
      const step = Math.ceil(value / (duration / 16));
      const timer = setInterval(() => {
        countRef.current += step;
        
        if (countRef.current >= value) {
          countRef.current = value;
          clearInterval(timer);
        }
        
        setCount(countRef.current);
      }, 16);
      
      return () => clearInterval(timer);
    }
  }, [inView, value, duration]);

  return (
    <span ref={ref}>
      {count}{suffix}
    </span>
  );
};

export default CounterText; 