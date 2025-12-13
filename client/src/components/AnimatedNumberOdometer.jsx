import { useEffect, useState } from 'react'
import { formatCurrency } from '../utils/helpers'

/**
 * Odometer-style animated number component
 * Numbers animate digit by digit from left to right
 */
const AnimatedNumberOdometer = ({
    value,
    currency = null,
    duration = 3000,
    isLoading = false,
    className = ''
}) => {
    const [displayValue, setDisplayValue] = useState('')
    const [isAnimating, setIsAnimating] = useState(false)

    useEffect(() => {
        if (isLoading || value === 0) {
            setDisplayValue('')
            return
        }

        // Format the final value to get the target string
        const finalFormatted = currency
            ? formatCurrency(value, currency)
            : value.toLocaleString()

        // Extract just the numeric part (remove currency symbols, commas, etc.)
        const numericString = value.toString()
        const digitCount = numericString.length

        // Start animation
        setIsAnimating(true)

        // First, show all zeros with proper length
        const currencyPrefix = currency ? getCurrencySymbol(finalFormatted) : ''
        const initialZeros = '0'.repeat(digitCount)
        setDisplayValue(formatWithPrefix(initialZeros, currencyPrefix, currency))

        // Animate each digit from left to right
        const digitDuration = duration / digitCount
        let currentDigitIndex = 0

        const animateNextDigit = () => {
            if (currentDigitIndex >= digitCount) {
                setDisplayValue(finalFormatted)
                setIsAnimating(false)
                return
            }

            const targetDigit = parseInt(numericString[currentDigitIndex])
            let currentCount = 0
            const digitAnimationSteps = 10
            const stepDuration = digitDuration / digitAnimationSteps

            const countUp = () => {
                if (currentCount <= targetDigit) {
                    // Build the current display string
                    let newNumericString = ''
                    for (let i = 0; i < digitCount; i++) {
                        if (i < currentDigitIndex) {
                            // Already animated digits - show actual value
                            newNumericString += numericString[i]
                        } else if (i === currentDigitIndex) {
                            // Currently animating digit
                            newNumericString += currentCount.toString()
                        } else {
                            // Not yet animated - show 0
                            newNumericString += '0'
                        }
                    }

                    // Format and display
                    const formatted = currency
                        ? formatCurrency(parseInt(newNumericString), currency)
                        : parseInt(newNumericString).toLocaleString()

                    setDisplayValue(formatted)

                    if (currentCount < targetDigit) {
                        currentCount++
                        setTimeout(countUp, stepDuration)
                    } else {
                        // Move to next digit
                        currentDigitIndex++
                        setTimeout(animateNextDigit, 50)
                    }
                }
            }

            countUp()
        }

        // Start animation after a brief delay
        const startTimeout = setTimeout(animateNextDigit, 100)

        return () => {
            clearTimeout(startTimeout)
            setIsAnimating(false)
        }
    }, [value, currency, duration, isLoading])

    if (isLoading) {
        return <span className={className}>...</span>
    }

    return <span className={className}>{displayValue || '0'}</span>
}

// Helper function to extract currency symbol
const getCurrencySymbol = (formattedString) => {
    const match = formattedString.match(/^[^\d,]+/)
    return match ? match[0] : ''
}

// Helper function to format with currency prefix
const formatWithPrefix = (numericString, prefix, currency) => {
    if (!currency) return numericString
    return prefix + parseInt(numericString).toLocaleString()
}

export default AnimatedNumberOdometer
