// mobile-app/src/components/Amount.js
import React from 'react';
import { Text } from 'react-native';
import { usePrivacy } from '../context/PrivacyContext';

const MASK = '••••••';

function format(value, currency) {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch {
    return `${value}`;
  }
}

export default function Amount({ value, sign, style, currency = 'INR' }) {
  const { isPrivate } = usePrivacy();

  if (isPrivate) {
    return <Text style={style}>{MASK}</Text>;
  }
  const bad = value === null || value === undefined || Number.isNaN(Number(value));
  if (bad) {
    return <Text style={style}>—</Text>;
  }
  return <Text style={style}>{`${sign ?? ''}${format(value, currency)}`}</Text>;
}
