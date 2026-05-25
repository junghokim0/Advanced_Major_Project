import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatBlurQualityMessage } from '../constants/uploadQuality';

const COLORS = {
  amber50: '#fffbeb',
  amber700: '#b45309',
  medical600: '#0d9488',
  white: '#ffffff',
};

export default function BlurRetakeGuide({ error, onRetakePhoto, onPickGallery }) {
  return (
    <View style={styles.box}>
      <Text style={styles.title}>사진이 흐립니다</Text>
      <Text style={styles.message}>{formatBlurQualityMessage(error)}</Text>
      <View style={styles.row}>
        <TouchableOpacity style={styles.primaryBtn} onPress={onRetakePhoto} activeOpacity={0.85}>
          <Text style={styles.primaryText}>다시 촬영</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.outlineBtn} onPress={onPickGallery} activeOpacity={0.85}>
          <Text style={styles.outlineText}>갤러리에서 선택</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: 12,
    backgroundColor: COLORS.amber50,
    borderRadius: 12,
    padding: 14,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.amber700,
    marginBottom: 6,
  },
  message: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.amber700,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: COLORS.medical600,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  outlineBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.medical600,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  outlineText: {
    color: COLORS.medical600,
    fontWeight: '700',
    fontSize: 14,
  },
});
