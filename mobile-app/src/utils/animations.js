import { Animated, Easing } from 'react-native';

/**
 * Reusable animation configurations and utilities
 */

export const animations = {
    // Timing configurations
    timing: {
        fast: 200,
        normal: 300,
        slow: 500,
    },

    // Easing functions
    easing: {
        ease: Easing.ease,
        linear: Easing.linear,
        easeIn: Easing.in(Easing.ease),
        easeOut: Easing.out(Easing.ease),
        easeInOut: Easing.inOut(Easing.ease),
        spring: Easing.elastic(1),
        bounce: Easing.bounce,
    },
};

/**
 * Fade in animation
 * @param {Animated.Value} animatedValue - Animated value to animate
 * @param {number} duration - Animation duration
 * @param {function} callback - Callback after animation completes
 */
export const fadeIn = (animatedValue, duration = 300, callback) => {
    Animated.timing(animatedValue, {
        toValue: 1,
        duration,
        easing: animations.easing.easeOut,
        useNativeDriver: true,
    }).start(callback);
};

/**
 * Fade out animation
 * @param {Animated.Value} animatedValue - Animated value to animate
 * @param {number} duration - Animation duration
 * @param {function} callback - Callback after animation completes
 */
export const fadeOut = (animatedValue, duration = 300, callback) => {
    Animated.timing(animatedValue, {
        toValue: 0,
        duration,
        easing: animations.easing.easeIn,
        useNativeDriver: true,
    }).start(callback);
};

/**
 * Slide in from bottom animation
 * @param {Animated.Value} animatedValue - Animated value to animate
 * @param {number} duration - Animation duration
 * @param {function} callback - Callback after animation completes
 */
export const slideInFromBottom = (animatedValue, duration = 300, callback) => {
    Animated.spring(animatedValue, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
    }).start(callback);
};

/**
 * Slide out to bottom animation
 * @param {Animated.Value} animatedValue - Animated value to animate
 * @param {number} toValue - Target value
 * @param {number} duration - Animation duration
 * @param {function} callback - Callback after animation completes
 */
export const slideOutToBottom = (animatedValue, toValue = 300, duration = 300, callback) => {
    Animated.timing(animatedValue, {
        toValue,
        duration,
        easing: animations.easing.easeIn,
        useNativeDriver: true,
    }).start(callback);
};

/**
 * Scale animation
 * @param {Animated.Value} animatedValue - Animated value to animate
 * @param {number} toValue - Target scale value
 * @param {number} duration - Animation duration
 * @param {function} callback - Callback after animation completes
 */
export const scale = (animatedValue, toValue = 1, duration = 300, callback) => {
    Animated.spring(animatedValue, {
        toValue,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
    }).start(callback);
};

/**
 * Pulse animation (scale up and down)
 * @param {Animated.Value} animatedValue - Animated value to animate
 * @param {number} duration - Animation duration
 */
export const pulse = (animatedValue, duration = 1000) => {
    Animated.loop(
        Animated.sequence([
            Animated.timing(animatedValue, {
                toValue: 1.05,
                duration: duration / 2,
                easing: animations.easing.easeInOut,
                useNativeDriver: true,
            }),
            Animated.timing(animatedValue, {
                toValue: 1,
                duration: duration / 2,
                easing: animations.easing.easeInOut,
                useNativeDriver: true,
            }),
        ])
    ).start();
};

/**
 * Shake animation
 * @param {Animated.Value} animatedValue - Animated value to animate
 */
export const shake = (animatedValue) => {
    Animated.sequence([
        Animated.timing(animatedValue, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(animatedValue, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(animatedValue, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(animatedValue, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(animatedValue, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
};

/**
 * Rotate animation
 * @param {Animated.Value} animatedValue - Animated value to animate (0 to 1)
 * @param {number} duration - Animation duration
 */
export const rotate = (animatedValue, duration = 300) => {
    Animated.timing(animatedValue, {
        toValue: 1,
        duration,
        easing: animations.easing.linear,
        useNativeDriver: true,
    }).start();
};

/**
 * Spring animation
 * @param {Animated.Value} animatedValue - Animated value to animate
 * @param {number} toValue - Target value
 * @param {function} callback - Callback after animation completes
 */
export const springAnimation = (animatedValue, toValue, callback) => {
    Animated.spring(animatedValue, {
        toValue,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
    }).start(callback);
};

export default animations;
