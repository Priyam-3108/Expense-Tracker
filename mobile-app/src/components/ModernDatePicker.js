import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function ModernDatePicker({ visible, onClose, selectedDate, onDateSelect }) {
    const { colors, isDark } = useTheme();
    const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];
        // Add empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }
        // Add all days in month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }
        // Pad with empty cells to always have 6 weeks (42 days total)
        // This ensures consistent calendar height
        while (days.length < 42) {
            days.push(null);
        }
        return days;
    };

    const days = getDaysInMonth(currentMonth);

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    const handleDateSelect = (date) => {
        onDateSelect(date);
        onClose();
    };

    const isToday = (date) => {
        if (!date) return false;
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const isSelected = (date) => {
        if (!date || !selectedDate) return false;
        return date.getDate() === selectedDate.getDate() &&
            date.getMonth() === selectedDate.getMonth() &&
            date.getFullYear() === selectedDate.getFullYear();
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.calendarContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton}>
                            <Text style={[styles.navText, { color: colors.primary }]}>‹</Text>
                        </TouchableOpacity>
                        <Text style={[styles.monthYear, { color: colors.text }]}>
                            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                        </Text>
                        <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
                            <Text style={[styles.navText, { color: colors.primary }]}>›</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Day Names */}
                    <View style={styles.dayNamesRow}>
                        {dayNames.map((day) => (
                            <View key={day} style={styles.dayNameCell}>
                                <Text style={[styles.dayNameText, { color: colors.subText }]}>{day}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Calendar Grid */}
                    <View style={styles.daysContainer}>
                        <View style={styles.daysGrid}>
                            {days.map((date, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.dayCell,
                                        !date && styles.emptyCell,
                                        isSelected(date) && { backgroundColor: colors.primary },
                                        isToday(date) && !isSelected(date) && {
                                            borderWidth: 2,
                                            borderColor: colors.primary
                                        }
                                    ]}
                                    onPress={() => date && handleDateSelect(date)}
                                    disabled={!date}
                                >
                                    {date && (
                                        <Text style={[
                                            styles.dayText,
                                            { color: isSelected(date) ? '#fff' : colors.text },
                                            isToday(date) && !isSelected(date) && { color: colors.primary, fontWeight: '700' }
                                        ]}>
                                            {date.getDate()}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Footer */}
                    <View style={[styles.footer, { borderTopColor: colors.border }]}>
                        <TouchableOpacity
                            style={[styles.todayButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                            onPress={() => handleDateSelect(new Date())}
                        >
                            <Text style={[styles.todayText, { color: colors.primary }]}>Today</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.closeButton, { backgroundColor: isDark ? '#273951' : '#e3e8ee' }]}
                            onPress={onClose}
                        >
                            <Text style={[styles.closeText, { color: colors.text }]}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(13, 37, 61, 0.65)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    calendarContainer: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 16,
        borderWidth: 1,
        shadowColor: '#003770',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 10,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    navButton: {
        padding: 6,
        minWidth: 36,
        alignItems: 'center',
    },
    navText: {
        fontSize: 28,
        fontWeight: '300',
    },
    monthYear: {
        fontSize: 16,
        fontWeight: '300', // Sohne thin style
        letterSpacing: -0.22,
    },
    dayNamesRow: {
        flexDirection: 'row',
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    dayNameCell: {
        flex: 1,
        alignItems: 'center',
    },
    dayNameText: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.1,
    },
    daysContainer: {
        paddingVertical: 4,
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 10,
        paddingBottom: 10,
    },
    dayCell: {
        width: '14.28%',
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 9999, // Stripe pill geometry
        marginVertical: 2,
    },
    emptyCell: {
        backgroundColor: 'transparent',
    },
    dayText: {
        fontSize: 14,
        fontWeight: '400',
        fontVariant: ['tabular-nums'],
    },
    footer: {
        flexDirection: 'row',
        padding: 14,
        gap: 10,
        borderTopWidth: 1,
    },
    todayButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 9999, // Stripe pill button (rounded.pill)
        alignItems: 'center',
        borderWidth: 1,
    },
    todayText: {
        fontSize: 14,
        fontWeight: '400',
    },
    closeButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 9999, // Stripe pill button (rounded.pill)
        alignItems: 'center',
    },
    closeText: {
        fontSize: 14,
        fontWeight: '400',
    },
});
