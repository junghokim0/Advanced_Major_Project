import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  MEDICAL_DISCLAIMER_FULL,
  MEDICAL_DISCLAIMER_SHORT,
  MEDICAL_DISCLAIMER_TITLE,
  MEDICAL_RESULT_HINT,
} from '../constants/medicalDisclaimer';
import { BRAND } from '../theme/brand';

export default function MedicalDisclaimerCard({ variant = 'short', showResultHint = false }) {
  const isFull = variant === 'full';

  return (
    <View style={[styles.card, isFull && styles.cardFull]}>
      <Text style={styles.title}>{MEDICAL_DISCLAIMER_TITLE}</Text>
      <Text style={styles.body}>{isFull ? MEDICAL_DISCLAIMER_FULL : MEDICAL_DISCLAIMER_SHORT}</Text>
      {showResultHint ? <Text style={styles.hint}>{MEDICAL_RESULT_HINT}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  cardFull: {
    backgroundColor: BRAND.white,
    borderColor: BRAND.neutral200,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400e',
    marginBottom: 6,
  },
  body: {
    fontSize: 12,
    color: BRAND.neutral700,
    lineHeight: 18,
  },
  hint: {
    marginTop: 8,
    fontSize: 12,
    color: BRAND.medical700,
    fontWeight: '600',
    lineHeight: 18,
  },
});
