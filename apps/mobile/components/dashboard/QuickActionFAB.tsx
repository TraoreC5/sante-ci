import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback, TouchableOpacity, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

export const QuickActionFAB = () => {
  const [isOpen, setIsOpen] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;

  const toggleMenu = () => {
    const toValue = isOpen ? 0 : 1;
    
    Animated.spring(animation, {
      toValue,
      friction: 6,
      tension: 60,
      useNativeDriver: Platform.OS !== 'web',
    }).start();

    setIsOpen(!isOpen);
  };

  const rotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const actions = [
    { label: 'Prendre un RDV', icon: 'calendar', color: Colors.primary.green },
    { label: 'Scanner un doc', icon: 'camera', color: Colors.accent.teal },
    { label: 'Ajouter constante', icon: 'medical', color: Colors.accent.purple },
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <TouchableWithoutFeedback onPress={toggleMenu}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
      )}

      {/* Actions + FAB */}
      <View style={styles.fabContainer} pointerEvents="box-none">
        {/* Action buttons */}
        {actions.map((action, index) => (
          <Animated.View
            key={index}
            style={[
              styles.actionWrapper,
              {
                opacity: animation,
                transform: [
                  { scale: animation },
                  {
                    translateY: animation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -(70 * (index + 1))],
                    }),
                  },
                ],
              },
            ]}
            pointerEvents={isOpen ? 'auto' : 'none'}
          >
            <View style={styles.actionLabelBg}>
              <Text style={[Typography.captionBold, styles.actionLabel]}>{action.label}</Text>
            </View>
            <TouchableOpacity
              onPress={() => { console.log(action.label); toggleMenu(); }}
              style={[styles.actionButton, { backgroundColor: action.color }]}
              activeOpacity={0.8}
            >
              <Ionicons name={action.icon as any} size={20} color="white" />
            </TouchableOpacity>
          </Animated.View>
        ))}

        {/* Main FAB */}
        <TouchableOpacity onPress={toggleMenu} activeOpacity={0.85} style={styles.fabTouchable}>
          <Animated.View style={[styles.fab, { transform: [{ rotate: rotation }] }]}>
            <LinearGradient
              colors={Colors.gradients.header}
              style={styles.fabGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="add" size={30} color="white" />
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 90,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    zIndex: 100,
    alignItems: 'flex-end',
  },
  actionWrapper: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionLabelBg: {
    backgroundColor: 'white',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  actionLabel: {
    color: Colors.text.primary,
    fontSize: 13,
  },
  actionButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  fabTouchable: {
    zIndex: 101,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: Colors.primary.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
