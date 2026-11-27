import { useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const KEY = 'excludeSavings';

// "Leave savings and investments out of spending", shared by Home and Analytics.
// Re-read on focus so flipping it on one tab carries to the other.
export function useExcludeSavings() {
    const [exclude, setExclude] = useState(false);

    useFocusEffect(
        useCallback(() => {
            AsyncStorage.getItem(KEY).then((v) => setExclude(v === '1'));
        }, [])
    );

    const set = useCallback((value) => {
        setExclude(value);
        AsyncStorage.setItem(KEY, value ? '1' : '0');
    }, []);

    return [exclude, set];
}
