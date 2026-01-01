export const useReducedMotion = () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};
