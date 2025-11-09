import { createElement, forwardRef, useEffect, useRef } from 'react';

function mergeRefs(refA, refB) {
  return (node) => {
    if (typeof refA === 'function') refA(node);
    else if (refA) refA.current = node;
    if (typeof refB === 'function') refB(node);
    else if (refB) refB.current = node;
  };
}

const Reveal = forwardRef(function Reveal(
  {
    as: Component = 'div',
    className = '',
    children,
    delay = 0,
    duration = 0.6,
    offset = 40,
    fromScale = 1,
    once = true,
    margin = '-80px',
    style,
    ...rest
  },
  forwardedRef,
) {
  const localRef = useRef(null);

  useEffect(() => {
    const element = localRef.current;
    if (!element) return;

    element.style.opacity = element.style.opacity || '0';
    if (!element.style.transform || element.style.transform === 'none') {
      element.style.transform = `translateY(${offset}px) scale(${fromScale})`;
    }
    element.style.transition = `opacity ${duration}s ease ${delay}s, transform ${duration}s ease ${delay}s`;
    element.style.willChange = 'opacity, transform';

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.style.opacity = '1';
          element.style.transform = 'translateY(0) scale(1)';
          if (once) observer.disconnect();
        } else if (!once) {
          element.style.opacity = '0';
          element.style.transform = `translateY(${offset}px) scale(${fromScale})`;
        }
      },
      {
        rootMargin: margin,
        threshold: 0.1,
      },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [delay, duration, fromScale, margin, offset, once]);

  const initialStyle = {
    opacity: 0,
    transform: `translateY(${offset}px) scale(${fromScale})`,
    ...style,
  };

  return createElement(
    Component,
    {
      ref: mergeRefs(localRef, forwardedRef),
      className,
      style: initialStyle,
      ...rest,
    },
    children,
  );
});

export default Reveal;
